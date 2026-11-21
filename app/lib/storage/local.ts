// app/lib/storage/local.ts
// 本產品在瀏覽器 localStorage 的 key 規則與一鍵刪除（AC-008）。
//
// - 新資料一律使用 `aiia.` 前綴。
// - 一鍵刪除會清掉這個網站在 localStorage 的「全部」key（含舊版未加前綴的
//   apikey_*、report_*、interview_session_*、usage_*、history_*、ai_interview_user 等），
//   只保留介面語系偏好。

export const STORAGE_PREFIX = 'aiia.';

export const STORAGE_KEYS = {
  session: 'aiia.session',
  sessionUid: 'aiia.session.uid',
  sessionEvents: 'aiia.session.events',
  quota: 'aiia.session.quota',
  byokApiKey: 'aiia.byok.apiKey',
  practiceHistory: 'aiia.practice.history',
  interviewSession: (sessionId: string) => `aiia.interview.session.${sessionId}`,
  report: (reportId: string) => `aiia.report.${reportId}`,
} as const;

/** 介面語系偏好：一鍵刪除時保留。 */
export const LOCALE_KEY = 'ai_interview_locale';
export const PRESERVED_KEYS: readonly string[] = [LOCALE_KEY];

type StorageLike = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 刪除本產品在 localStorage 的全部資料（保留語系偏好）。回傳被刪除的 key。 */
export function deleteAllLocalData(storage?: StorageLike): string[] {
  const store = getStorage(storage);
  if (!store) return [];
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k !== null && !PRESERVED_KEYS.includes(k)) keys.push(k);
  }
  for (const k of keys) store.removeItem(k);
  return keys;
}

export function readJson<T>(key: string, fallback: T, storage?: StorageLike): T {
  const store = getStorage(storage);
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown, storage?: StorageLike): void {
  const store = getStorage(storage);
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage 可能被停用或已滿；忽略 */
  }
}

export function readApiKey(storage?: StorageLike): string {
  const store = getStorage(storage);
  if (!store) return '';
  try {
    return store.getItem(STORAGE_KEYS.byokApiKey) ?? '';
  } catch {
    return '';
  }
}

export function writeApiKey(apiKey: string, storage?: StorageLike): void {
  const store = getStorage(storage);
  if (!store) return;
  try {
    if (apiKey) store.setItem(STORAGE_KEYS.byokApiKey, apiKey);
    else store.removeItem(STORAGE_KEYS.byokApiKey);
  } catch {
    /* ignore */
  }
}
