// app/lib/security/rate-limit.ts
// /api/* 的伺服器端限流，避免本站被當成匿名的 AI 代理或「驗證外洩 key」的工具。
//
//   - 一般 API：每個來源 IP 每分鐘最多 API_RATE_LIMIT_PER_MIN 次（預設 60；一場 5 題的練習約 7 次）。
//   - /api/test-key：每個來源 IP 每 10 分鐘最多 10 次。
//   - key 驗證失敗（401／403）：同一 IP 15 分鐘內累計 5 次後，帶 key 的請求一律回 429，
//     直到時間窗結束（無 key 的 Mock 練習不受影響）。
//
// 限制：狀態存在單一 server process 的記憶體；serverless 多 instance 之間不共享、重啟後歸零。
// 每張表都有筆數上限，超過時先清掉過期項目，仍超過就刪掉最舊的，不會無限成長。

import { NextResponse, type NextRequest } from 'next/server';

export const MAX_TRACKED_CLIENTS = 5000;
export const API_WINDOW_MS = 60_000;
export const KEY_CHECK_LIMIT = 10;
export const KEY_CHECK_WINDOW_MS = 10 * 60_000;
export const AUTH_FAILURE_LIMIT = 5;
export const AUTH_FAILURE_WINDOW_MS = 15 * 60_000;

export function apiLimitPerMinute(): number {
  const n = Number(process.env.API_RATE_LIMIT_PER_MIN);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export interface FixedWindowCounter {
  /** 計數 +1，回傳計數後的值。 */
  hit(id: string, now: number): number;
  /** 目前時間窗內的計數（不 +1）。 */
  peek(id: string, now: number): number;
  size(): number;
  reset(): void;
}

export function createFixedWindowCounter(windowMs: number, maxEntries = MAX_TRACKED_CLIENTS): FixedWindowCounter {
  const buckets = new Map<string, Bucket>();

  function prune(now: number) {
    if (buckets.size < maxEntries) return;
    for (const [id, b] of Array.from(buckets.entries())) if (b.resetAt <= now) buckets.delete(id);
    // 仍然太多：Map 依插入順序，刪掉最舊的。
    while (buckets.size >= maxEntries) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined) break;
      buckets.delete(oldest);
    }
  }

  function current(id: string, now: number): Bucket | undefined {
    const b = buckets.get(id);
    if (b && b.resetAt <= now) {
      buckets.delete(id);
      return undefined;
    }
    return b;
  }

  return {
    hit(id, now) {
      let b = current(id, now);
      if (!b) {
        prune(now);
        b = { count: 0, resetAt: now + windowMs };
        buckets.set(id, b);
      }
      b.count += 1;
      return b.count;
    },
    peek(id, now) {
      return current(id, now)?.count ?? 0;
    },
    size() {
      return buckets.size;
    },
    reset() {
      buckets.clear();
    },
  };
}

export const apiCounter = createFixedWindowCounter(API_WINDOW_MS);
export const keyCheckCounter = createFixedWindowCounter(KEY_CHECK_WINDOW_MS);
export const authFailureCounter = createFixedWindowCounter(AUTH_FAILURE_WINDOW_MS);

export function resetRateLimits() {
  apiCounter.reset();
  keyCheckCounter.reset();
  authFailureCounter.reset();
}

/** 來源 IP：平台提供的 req.ip 優先，其次是 x-forwarded-for 的第一個位址、x-real-ip。 */
export function clientId(req: NextRequest): string {
  const platformIp = (req as NextRequest & { ip?: string }).ip;
  if (platformIp) return platformIp;
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function tooMany(error: string, retryAfterSec: number) {
  return NextResponse.json(
    { error, message: '請求太頻繁，請稍後再試' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  );
}

/**
 * 在 route 一開始呼叫；回傳 429 response 表示應直接回傳，回傳 null 表示放行。
 * - kind 'test-key'：另外套用較嚴格的 key 驗證次數上限。
 * - usesKey：這個請求會用到使用者的 key 時，檢查該 IP 的 key 驗證失敗次數。
 */
export function checkRateLimit(
  req: NextRequest,
  opts: { kind: 'api' | 'test-key'; usesKey: boolean },
  now = Date.now(),
): NextResponse | null {
  const id = clientId(req);
  if (opts.usesKey && authFailureCounter.peek(id, now) >= AUTH_FAILURE_LIMIT) {
    return tooMany('TOO_MANY_AUTH_FAILURES', Math.ceil(AUTH_FAILURE_WINDOW_MS / 1000));
  }
  if (apiCounter.hit(id, now) > apiLimitPerMinute()) {
    return tooMany('RATE_LIMITED', Math.ceil(API_WINDOW_MS / 1000));
  }
  if (opts.kind === 'test-key' && keyCheckCounter.hit(id, now) > KEY_CHECK_LIMIT) {
    return tooMany('RATE_LIMITED', Math.ceil(KEY_CHECK_WINDOW_MS / 1000));
  }
  return null;
}

/** key 驗證失敗（上游 401／403）時記一次。 */
export function recordAuthFailure(req: NextRequest, now = Date.now()) {
  authFailureCounter.hit(clientId(req), now);
}
