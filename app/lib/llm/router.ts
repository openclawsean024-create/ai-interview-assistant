// app/lib/llm/router.ts
// v3.0 SPEC §16.5 自動降級規則

import type { LlmContext, LlmProvider } from './types';
import { mockProvider } from './mock-provider';
import { byokProvider } from './byok-provider';

const RETRY_FORCE_MOCK_THRESHOLD = 3;
const FORCE_MOCK_COOLDOWN_MS = 30 * 60 * 1000;

function readForceMockUntil(userId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(`aiia.llm.forceMockUntil.${userId}`);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

function writeForceMockUntil(userId: string, until: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`aiia.llm.forceMockUntil.${userId}`, String(until));
  } catch {
    /* ignore */
  }
}

export function buildCtx(opts: {
  mode: 'mock' | 'byok';
  apiKey?: string;
  userId: string;
}): LlmContext {
  const forceUntil = readForceMockUntil(opts.userId);
  const now = Date.now();
  if (forceUntil > now) {
    return { mode: 'mock', userId: opts.userId, retryCount: 0 };
  }
  return {
    mode: opts.mode,
    apiKey: opts.apiKey,
    userId: opts.userId,
    retryCount: 0,
  };
}

export function pickProvider(ctx: LlmContext): LlmProvider {
  return ctx.mode === 'byok' && ctx.apiKey ? byokProvider : mockProvider;
}

export async function safeCall<T extends { mode: string }>(
  ctx: LlmContext,
  fn: (provider: LlmProvider) => Promise<T>,
): Promise<T> {
  const provider = pickProvider(ctx);

  // mock 路徑：直接回傳，不打外部
  if (ctx.mode !== 'byok' || !ctx.apiKey) {
    const r = await fn(provider);
    return { ...r, mode: 'mock' } as T;
  }

  try {
    const r = await fn(provider);
    return r;
  } catch (err: any) {
    const status = err?.status;
    const isRetriable = status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || err?.name === 'AbortError';
    const isAuth = status === 401 || status === 403;

    // 401/403 不降級（必須讓 user 知道 key 失效），直接拋
    if (isAuth) {
      const e: any = new Error('OPENAI_AUTH_FAILED');
      e.status = status;
      throw e;
    }

    if (isRetriable && ctx.retryCount < 1) {
      return safeCall({ ...ctx, retryCount: ctx.retryCount + 1 }, fn);
    }

    // 連續失敗太多 → 強制 mock 30 分鐘
    if (ctx.retryCount >= RETRY_FORCE_MOCK_THRESHOLD) {
      writeForceMockUntil(ctx.userId, Date.now() + FORCE_MOCK_COOLDOWN_MS);
    }

    // 降級 mock 並標示 degraded
    const fallback = await fn(mockProvider);
    return {
      ...fallback,
      mode: 'mock',
      degraded: true,
      reason: err?.name === 'AbortError' ? 'openai_timeout' : `openai_${status ?? 'unknown'}`,
      fallbackMode: 'mock',
    } as T;
  }
}
