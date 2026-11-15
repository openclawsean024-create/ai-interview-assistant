// app/lib/llm/router.ts
// AC-002：provider 的單一工廠（resolveProvider）。
// AC-003：重試（至多 1 次）、降級 Mock、401／403 不降級、連續失敗冷卻。
//
// 冷卻機制在「伺服器端記憶體」生效（不再讀寫 window.localStorage）：
//   - 以 API key 的 SHA-256 指紋為索引（不保存 key 本身）。
//   - 同一把 key 連續 3 次請求最終都失敗（已含重試）→ 30 分鐘內直接走 Mock，不再呼叫外部供應商，
//     回應標示 degraded: true、degradedReason: 'cooldown_active'。
//   - 任何一次成功都會把連續失敗次數歸零。
//   - 限制：狀態存在單一 server process 的記憶體；serverless 多 instance 之間不共享、重啟後歸零。

import { createHash } from 'crypto';
import type { LlmContext, LlmProvider, ProviderMeta } from './types';
import { mockProvider } from './mock-provider';
import { byokProvider } from './byok-provider';
import { LlmAuthError, LlmHttpError } from './errors';

export const MAX_RETRIES = 1;
export const COOLDOWN_FAILURE_THRESHOLD = 3;
export const COOLDOWN_MS = 30 * 60 * 1000;
const RETRIABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export interface CooldownStore {
  isActive(key: string, now: number): boolean;
  recordFailure(key: string, now: number): void;
  recordSuccess(key: string): void;
  reset(): void;
}

export function createCooldownStore(
  threshold = COOLDOWN_FAILURE_THRESHOLD,
  cooldownMs = COOLDOWN_MS,
): CooldownStore {
  const state = new Map<string, { failures: number; until: number }>();
  return {
    isActive(key, now) {
      const entry = state.get(key);
      if (!entry || entry.until === 0) return false;
      if (entry.until > now) return true;
      state.delete(key); // 冷卻期滿，重新計數
      return false;
    },
    recordFailure(key, now) {
      const entry = state.get(key) ?? { failures: 0, until: 0 };
      entry.failures += 1;
      if (entry.failures >= threshold) entry.until = now + cooldownMs;
      state.set(key, entry);
    },
    recordSuccess(key) {
      state.delete(key);
    },
    reset() {
      state.clear();
    },
  };
}

/** process 層級的預設冷卻狀態（伺服器端生效）。 */
export const serverCooldown: CooldownStore = createCooldownStore();

export function fingerprintKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex').slice(0, 16);
}

export interface RouterDeps {
  mock?: LlmProvider;
  byok?: LlmProvider;
  cooldown?: CooldownStore;
  now?: () => number;
}

export function buildCtx(opts: { apiKey?: string | null }): LlmContext {
  const apiKey = opts.apiKey?.trim() || undefined;
  return { mode: apiKey ? 'byok' : 'mock', apiKey, retryCount: 0 };
}

/** 單一工廠：依 ctx 選擇 provider。沒有 key 一律 Mock。 */
export function resolveProvider(ctx: LlmContext, deps: RouterDeps = {}): LlmProvider {
  return ctx.mode === 'byok' && ctx.apiKey ? deps.byok ?? byokProvider : deps.mock ?? mockProvider;
}

function isRetriable(err: unknown): boolean {
  if (!(err instanceof LlmHttpError)) return false;
  if (err.kind === 'timeout' || err.kind === 'network') return true;
  return err.kind === 'http' && err.status !== undefined && RETRIABLE_STATUS.has(err.status);
}

function reasonOf(err: unknown): string {
  if (err instanceof LlmHttpError) return err.message;
  return 'openai_unknown';
}

/**
 * 經由 provider 執行一次 AI 呼叫。
 * - Mock：直接回傳。
 * - BYOK：timeout／網路錯誤／429／5xx 重試至多 1 次；仍失敗（或其他非授權錯誤）→ 降級 Mock 並標示 degraded。
 * - 401／403：拋 LlmAuthError（OPENAI_AUTH_FAILED），不降級。
 */
export async function safeCall<T extends ProviderMeta>(
  ctx: LlmContext,
  fn: (provider: LlmProvider) => Promise<T>,
  deps: RouterDeps = {},
): Promise<T> {
  const mock = deps.mock ?? mockProvider;
  const cooldown = deps.cooldown ?? serverCooldown;
  const now = deps.now ?? Date.now;

  if (ctx.mode !== 'byok' || !ctx.apiKey) {
    const r = await fn(mock);
    return { ...r, mode: 'mock' };
  }

  const degrade = async (degradedReason: string): Promise<T> => {
    const fallback = await fn(mock);
    return { ...fallback, mode: 'mock', degraded: true, degradedReason, fallbackMode: 'mock' };
  };

  const key = fingerprintKey(ctx.apiKey);
  if (cooldown.isActive(key, now())) return degrade('cooldown_active');

  const provider = resolveProvider(ctx, deps);
  let lastError: unknown;
  for (let attempt = ctx.retryCount; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn(provider);
      cooldown.recordSuccess(key);
      return result;
    } catch (err) {
      if (err instanceof LlmAuthError) throw err;
      lastError = err;
      if (!isRetriable(err)) break;
    }
  }

  cooldown.recordFailure(key, now());
  return degrade(reasonOf(lastError));
}
