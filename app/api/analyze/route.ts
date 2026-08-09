// app/api/analyze/route.ts
// v3.0 SPEC §16 + §17 — 即時分析單一面試問題、給 AI 建議答案
// 對應前端 /interview/page.tsx 的「聽到問題 → 按按鈕 → 看答案」流程

import { NextRequest, NextResponse } from 'next/server';
import { logEvent, getOrCreateSession } from '@/app/lib/session/session';

export const runtime = 'nodejs';

const OPENAI_TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT_ZH =
  '你是專業的面試助手，擅長技術面試。請用繁體中文回答，回答要具體、可驗證、有結構（必要時列點）。';
const SYSTEM_PROMPT_EN =
  'You are a professional interview assistant specializing in technical interviews. Answer in clear, structured English with concrete, verifiable points.';

async function callOpenAI(apiKey: string, question: string, systemPrompt: string, model: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `面試問題: ${question}` },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const e: any = new Error(err?.error?.message ?? `openai_${response.status}`);
      e.status = response.status;
      throw e;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  } finally {
    clearTimeout(timeoutId);
  }
}

function mockAnswer(question: string, lang: 'zh' | 'en'): string {
  // v3.0 mock — 不打 OpenAI，回結構化模板。內容多樣化避免每次一樣。
  const trimmed = question.trim();
  const seed = trimmed.length + trimmed.split(/\s+/).length;
  const templates_zh = [
    `【Demo 模式示範】針對「${trimmed.slice(0, 60)}」這個問題，建議回答結構：\n\n1. **先釐清題目**：用一句話複述問題，確認理解一致。\n2. **列舉 2–3 個情境**：每個情境 30 秒內講完，重點在「我做了什麼」「結果如何」。\n3. **量化成果**：用 %、金額、時間或人數等具體數字佐證。\n4. **反思一句**：從這個經驗學到什麼、未來會怎麼調整。\n\n⚠️ Demo Mode (Mock)：設定 API Key 後會用真實 LLM 生成個人化答案。`,
    `【Demo 模式示範】這題可從 STAR 回答：\n\n- **Situation**：交代背景（公司 / 專案 / 時間）。\n- **Task**：你負責什麼、挑戰是什麼。\n- **Action**：你具體做了哪些事、技術選型、協作方式。\n- **Result**：量化成果（效能提升 %、省下時數、用戶成長）。\n\n下一步：準備一個你做過的真實專案，把這 4 段填完，就是這題的即戰力答案。`,
  ];
  const templates_en = [
    `[Demo Mode] For "${trimmed.slice(0, 60)}", structure your answer with STAR:\n\n1. **Situation** — Set context (company / project / timeframe).\n2. **Task** — Your responsibility and the challenge.\n3. **Action** — What you specifically did (tech choices, collaboration).\n4. **Result** — Quantified outcome (% improvement, time saved, user growth).\n\n⚠️ Demo Mode (Mock): set your API Key to get a real LLM-generated personalized answer.`,
  ];
  const pool = lang === 'en' ? templates_en : templates_zh;
  return pool[seed % pool.length];
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const question = (body?.question ?? '').toString().trim();
    const apiKey: string | undefined = body?.apiKey || undefined;
    const model = body?.model ?? 'gpt-4o-mini';
    const systemPromptIn = body?.systemPrompt;
    const lang: 'zh' | 'en' = body?.lang === 'en' ? 'en' : 'zh';

    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const userId = getOrCreateSession().uid;
    let mode: 'mock' | 'byok' = 'mock';
    let degraded = false;
    let degradedReason: string | null = null;

    // Mock-first: 沒 apiKey 直接走 mock
    if (!apiKey) {
      const answer = mockAnswer(question, lang);
      logEvent('analyze_mock', { userId, questionLen: question.length, durationMs: Date.now() - startedAt });
      return NextResponse.json({
        success: true,
        data: {
          answer,
          mode,
          degraded: false,
          degradedReason: null,
        },
      });
    }

    // BYOK path — 帶 timeout, retry 1 次, 失敗降級 mock
    let attempt = 0;
    while (attempt < 2) {
      try {
        mode = 'byok';
        const answer = await callOpenAI(
          apiKey,
          question,
          systemPromptIn ?? (lang === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH),
          model,
        );
        logEvent('analyze_byok', { userId, questionLen: question.length, durationMs: Date.now() - startedAt });
        return NextResponse.json({
          success: true,
          data: {
            answer,
            mode,
            degraded: false,
            degradedReason: null,
          },
        });
      } catch (err: any) {
        attempt++;
        const status = err?.status;
        const isAuth = status === 401 || status === 403;
        const isTimeout = err?.name === 'AbortError';

        if (isAuth) {
          return NextResponse.json(
            { error: 'OPENAI_AUTH_FAILED', message: 'OpenAI API key 失效或無效，請到 Settings 重新設定' },
            { status: 400 },
          );
        }

        // retry 一次
        if (attempt < 2) continue;

        // 降級 mock
        degraded = true;
        degradedReason = isTimeout ? 'openai_timeout' : `openai_${status ?? 'unknown'}`;
        const answer = mockAnswer(question, lang);
        logEvent('analyze_degraded', {
          userId,
          questionLen: question.length,
          reason: degradedReason,
          durationMs: Date.now() - startedAt,
        });
        return NextResponse.json({
          success: true,
          data: {
            answer,
            mode: 'mock',
            degraded: true,
            degradedReason,
          },
        });
      }
    }

    // 不會到這裡，TypeScript 滿足用
    return NextResponse.json({ error: 'unreachable' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}
