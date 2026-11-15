// app/lib/llm/byok-provider.ts
// BYOK（自備 key）HTTP provider：以 fetch 呼叫 OpenAI 相容的 Chat Completions 端點。
// 外部 AI 端點只允許出現在 app/lib/llm/ 的 provider 檔案（AC-002）。
//
// - 不在這裡重試；重試與降級統一由 router.safeCall 處理（AC-003：至多重試 1 次）。
// - 錯誤一律轉成 LlmHttpError／LlmAuthError，訊息不含 API key 或上游原始訊息。
// - fetchImpl／baseUrl／timeoutMs 可注入，測試以假 fetch 驗證，不發出真實請求。
// - M1 不接正式付費 API：沒有任何伺服器端預設 key，只有使用者自備 key 時才會走到這裡。

import type { Dimensions, LlmProvider } from './types';
import { LlmAuthError, LlmHttpError } from './errors';
import { buildEvidence, observe, OWN_WORDS_REMINDER } from '@/app/lib/scoring/rubric';
import { buildStructureHints } from './structure-hints';

export const OPENAI_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_TIMEOUT_MS = 30_000;
export const KEY_CHECK_TIMEOUT_MS = 15_000;
export const DEFAULT_MODEL = 'gpt-4o-mini';

export interface HttpProviderOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
  keyCheckTimeoutMs?: number;
  model?: string;
}

type ChatMessage = { role: 'system' | 'user'; content: string };

function clampScore(value: unknown, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeDimensions(value: unknown): Dimensions {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    structure: clampScore(v.structure, 0),
    depth: clampScore(v.depth, 0),
    relevance: clampScore(v.relevance, 0),
    clarity: clampScore(v.clarity, 0),
    confidence: clampScore(v.confidence, 0),
  };
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : [];
}

function parseJsonContent(content: unknown): Record<string, unknown> {
  if (typeof content !== 'string') throw new LlmHttpError('invalid_response');
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
    return parsed as Record<string, unknown>;
  } catch {
    throw new LlmHttpError('invalid_response');
  }
}

export function createHttpProvider(options: HttpProviderOptions = {}): LlmProvider {
  const baseUrl = (options.baseUrl ?? OPENAI_BASE_URL).replace(/\/$/, '');
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const keyCheckTimeoutMs = options.keyCheckTimeoutMs ?? KEY_CHECK_TIMEOUT_MS;
  const model = options.model ?? DEFAULT_MODEL;
  // 延後取得 globalThis.fetch，讓測試的守門／假 fetch 一定生效。
  const doFetch: typeof fetch = (input, init) => (options.fetchImpl ?? globalThis.fetch)(input, init);

  async function request(path: string, apiKey: string, init: RequestInit, limitMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), limitMs);
    try {
      const response = await doFetch(`${baseUrl}${path}`, {
        ...init,
        headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) throw new LlmAuthError(response.status);
      if (!response.ok) throw new LlmHttpError('http', response.status);
      return response;
    } catch (err) {
      if (err instanceof LlmAuthError || err instanceof LlmHttpError) throw err;
      if ((err as { name?: string })?.name === 'AbortError') throw new LlmHttpError('timeout');
      throw new LlmHttpError('network');
    } finally {
      clearTimeout(timer);
    }
  }

  async function chat(apiKey: string, messages: ChatMessage[], temperature: number): Promise<Record<string, unknown>> {
    const response = await request(
      '/chat/completions',
      apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature }),
      },
      timeoutMs,
    );
    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new LlmHttpError('invalid_response');
    }
    return parseJsonContent(data?.choices?.[0]?.message?.content);
  }

  return {
    async analyze(ctx, params) {
      const parsed = await chat(
        ctx.apiKey!,
        [
          {
            role: 'system',
            content:
              '你是專業的面試教練。解析以下履歷與職缺描述，回傳 JSON：{questions:[{id,text,hint}], skills:[], scenarios:[], risks:[]}。繁中、5-15 題。',
          },
          {
            role: 'user',
            content: `履歷：${params.resumeText?.slice(0, 1500) ?? ''}\n\n職缺：${params.jobText?.slice(0, 1500) ?? ''}`,
          },
        ],
        0.5,
      );
      const questions = Array.isArray(parsed.questions)
        ? parsed.questions
            .filter((q: any) => q && typeof q.text === 'string')
            .map((q: any, i: number) => ({
              id: typeof q.id === 'string' ? q.id : `q${i + 1}`,
              text: q.text as string,
              hint: typeof q.hint === 'string' ? q.hint : undefined,
            }))
        : [];
      return {
        mode: 'byok',
        questions,
        skills: stringList(parsed.skills),
        scenarios: stringList(parsed.scenarios),
        risks: stringList(parsed.risks),
      };
    },

    async evaluate(ctx, params) {
      const parsed = await chat(
        ctx.apiKey!,
        [
          {
            role: 'system',
            content:
              '你是專業的面試教練。只評估使用者自己寫的回答，不得替使用者撰寫或改寫答案，不得捏造回答中沒有的經歷。' +
              '**只回傳 JSON**（無其他文字）：{"score":0-100,"dimensions":{"structure":0-100,"depth":0-100,"relevance":0-100,"clarity":0-100,"confidence":0-100},"feedback":"一句話中文","suggestions":["改進方向（不含示範答案）"]}',
          },
          { role: 'user', content: `問題：${params.questionText}\n回答：${params.answer}` },
        ],
        0.3,
      );
      if (typeof parsed.score !== 'number' || typeof parsed.dimensions !== 'object' || parsed.dimensions === null) {
        throw new LlmHttpError('invalid_response');
      }
      const feedback = typeof parsed.feedback === 'string' && parsed.feedback.trim() ? parsed.feedback.trim() : '已完成評分。';
      const suggestions = stringList(parsed.suggestions);
      return {
        mode: 'byok',
        score: clampScore(parsed.score, 0),
        dimensions: normalizeDimensions(parsed.dimensions),
        feedback,
        // 證據一律由本機 rubric 從使用者回答偵測，不採用 LLM 的敘述，避免捏造。
        evidence: buildEvidence(observe(params.answer ?? '', params.questionText ?? '')),
        suggestions: [...(suggestions.length > 0 ? suggestions : [feedback]), OWN_WORDS_REMINDER],
      };
    },

    async generateQuestion(ctx, params) {
      const parsed = await chat(
        ctx.apiKey!,
        [
          {
            role: 'system',
            content:
              '你是專業的 AI 面試官。已問過：' +
              JSON.stringify(params.askedQuestions ?? []) +
              '。生成下一道**不同**的繁中行為面試問題。**只回傳 JSON**：{"question":"...","hint":"只提示答題結構，不含示範答案"}',
          },
          { role: 'user', content: `職位：${params.jobType}｜級別：${params.jobLevel}` },
        ],
        0.8,
      );
      if (typeof parsed.question !== 'string' || !parsed.question.trim()) throw new LlmHttpError('invalid_response');
      return {
        mode: 'byok',
        question: parsed.question.trim(),
        hint:
          typeof parsed.hint === 'string' && parsed.hint.trim()
            ? parsed.hint.trim()
            : '描述 Situation、Task、Action、Result 四個部分。',
      };
    },

    async finalReport(ctx, params) {
      const answersText = params.answers
        .map((a, i) => `第 ${i + 1} 題（${a.score ?? '?'}）：${(a.answerText ?? '').slice(0, 200)}`)
        .join('\n\n');
      const parsed = await chat(
        ctx.apiKey!,
        [
          {
            role: 'system',
            content:
              '你是專業的面試教練。只依以下回答生成綜合報告，不得捏造回答中沒有的經歷，不做錄取預測或人格評斷。' +
              '**只回傳 JSON**：{"summary":"","strengths":["","",""],"improvements":["","",""],"radarData":{"structure":0-100,"depth":0-100,"relevance":0-100,"clarity":0-100,"confidence":0-100}}',
          },
          { role: 'user', content: answersText },
        ],
        0.4,
      );
      if (typeof parsed.summary !== 'string' || typeof parsed.radarData !== 'object' || parsed.radarData === null) {
        throw new LlmHttpError('invalid_response');
      }
      return {
        mode: 'byok',
        summary: parsed.summary,
        strengths: stringList(parsed.strengths),
        improvements: stringList(parsed.improvements),
        radarData: normalizeDimensions(parsed.radarData),
      };
    },

    // 結構提示刻意不呼叫 LLM：固定骨架、不含答案內容，杜絕「代答」風險（AC-007）。
    async structureHint(_ctx, params) {
      return { mode: 'byok', hints: buildStructureHints(params.language === 'en' ? 'en' : 'zh') };
    },

    async validateKey(ctx) {
      if (!ctx.apiKey) return { ok: false, error: 'NO_API_KEY' };
      try {
        await request('/models', ctx.apiKey, { method: 'GET' }, keyCheckTimeoutMs);
        return { ok: true, status: 200 };
      } catch (err) {
        if (err instanceof LlmAuthError) return { ok: false, status: err.status, error: 'INVALID_API_KEY' };
        if (err instanceof LlmHttpError) {
          if (err.kind === 'timeout') return { ok: false, status: 504, error: 'KEY_CHECK_TIMEOUT' };
          if (err.kind === 'http') return { ok: false, status: err.status, error: `KEY_CHECK_HTTP_${err.status}` };
        }
        return { ok: false, status: 502, error: 'KEY_CHECK_NETWORK_ERROR' };
      }
    },
  };
}

export const byokProvider: LlmProvider = createHttpProvider();
