// tests/setup/network-guard.ts
// AC-003：測試全程不得發出真實網路請求。
// 在每個測試檔載入前把 globalThis.fetch 換成守門版本：
//   - 目標不是 localhost／127.0.0.1／[::1] → 一律拋 ExternalNetworkBlockedError，並記錄嘗試。
//   - 目標是 localhost → 仍拋錯（單元測試不需要任何真實連線），避免誤打到本機其他服務。
// 需要模擬 HTTP 回應的測試，請用 tests/setup/fake-fetch.ts 注入假 fetch，不得還原真實 fetch。

import { afterEach, beforeEach } from 'vitest';

export class ExternalNetworkBlockedError extends Error {
  readonly url: string;
  constructor(url: string) {
    super(`EXTERNAL_NETWORK_BLOCKED: 測試中禁止真實網路請求 → ${url}`);
    this.name = 'ExternalNetworkBlockedError';
    this.url = url;
  }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function isLocalUrl(input: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(input).hostname);
  } catch {
    return false;
  }
}

function toUrlString(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (input && typeof (input as { url?: unknown }).url === 'string') return (input as { url: string }).url;
  return String(input);
}

/** 被守門機制擋下的真實 fetch 嘗試（外部與本機分開記錄）。 */
export const blockedAttempts: { external: string[]; local: string[] } = { external: [], local: [] };

export const guardedFetch: typeof fetch = async (input) => {
  const url = toUrlString(input);
  if (isLocalUrl(url)) {
    blockedAttempts.local.push(url);
    throw new Error(`LOCAL_NETWORK_BLOCKED: 單元測試不應連線本機服務 → ${url}`);
  }
  blockedAttempts.external.push(url);
  throw new ExternalNetworkBlockedError(url);
};

beforeEach(() => {
  blockedAttempts.external.length = 0;
  blockedAttempts.local.length = 0;
  globalThis.fetch = guardedFetch;
});

afterEach(() => {
  // 任何測試結束後都換回守門版本，避免假 fetch 外洩到下一個測試。
  globalThis.fetch = guardedFetch;
});

globalThis.fetch = guardedFetch;
