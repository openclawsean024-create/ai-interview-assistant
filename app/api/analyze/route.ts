// app/api/analyze/route.ts
// 【去留待 Sean 決定】原本是「輸入一題 → 回傳 AI 建議答案」的代答型端點（見 STATUS.md）。
// M1 處置（AC-002、AC-007）：
//   - 介面上的入口已全部移除；本檔保留但不再產生任何答案內容。
//   - 只透過 LlmProvider.structureHint 回傳固定的「答題結構提示」，每則都含「請用自己的話」。
//   - 不呼叫任何外部 AI 端點；request 中的 apiKey／model／systemPrompt 一律忽略。

import { NextRequest, NextResponse } from 'next/server';
import { buildCtx, safeCall } from '@/app/lib/llm/router';
import { errorResponse } from '@/app/lib/llm/http-errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    const language: 'zh' | 'en' = body?.lang === 'en' ? 'en' : 'zh';

    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    // 永遠使用 Mock ctx：結構提示不需要、也不允許呼叫外部 AI。
    const ctx = buildCtx({});
    const result = await safeCall(ctx, (p) => p.structureHint(ctx, { questionText: question, language }));

    return NextResponse.json({
      success: true,
      data: {
        mode: result.mode,
        degraded: false,
        degradedReason: null,
        kind: 'structure-hints',
        hints: result.hints,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
