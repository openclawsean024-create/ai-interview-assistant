// app/lib/session/quota.ts
// v3.0 SPEC §17.2 session 生命週期 — 3 次免費額度

export const FREE_TIER_LIMIT = 3;

export interface QuotaState {
  used: number;
  lastUpdated: number;
}

export function readQuota(): QuotaState {
  if (typeof window === 'undefined') return { used: 0, lastUpdated: 0 };
  try {
    const raw = window.localStorage.getItem('aiia.session.quota');
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { used: 0, lastUpdated: 0 };
}

export function writeQuota(q: QuotaState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('aiia.session.quota', JSON.stringify(q));
  } catch {
    /* ignore */
  }
}

export function incrementQuota(): QuotaState {
  const q = readQuota();
  const next: QuotaState = { used: q.used + 1, lastUpdated: Date.now() };
  writeQuota(next);
  return next;
}

export function isQuotaExceeded(): boolean {
  return readQuota().used >= FREE_TIER_LIMIT;
}

export function remainingFree(): number {
  return Math.max(0, FREE_TIER_LIMIT - readQuota().used);
}
