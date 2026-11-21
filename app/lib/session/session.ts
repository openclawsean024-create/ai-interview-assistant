// app/lib/session/session.ts
// 匿名 session（anonymous-first）：只在瀏覽器端運作，伺服器端不保存任何使用者資料。

import { deleteAllLocalData } from '@/app/lib/storage/local';

export const SESSION_KEY = 'aiia.session';
export const SESSION_UID_KEY = 'aiia.session.uid';
export const SESSION_EVENTS_KEY = 'aiia.session.events';
export const QUOTA_KEY = 'aiia.session.quota';

const CUID_RE = /^c[a-z0-9]{20,30}$/;

function generateCuid(): string {
  // cuid v4 風格的簡化版（無外部依賴）
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  let s = 'c';
  for (let i = 0; i < 24; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

export function isValidCuid(s: string): boolean {
  return typeof s === 'string' && CUID_RE.test(s);
}

export interface AnonymousSession {
  uid: string;
  createdAt: number;
  consentGiven: boolean;
}

export function getOrCreateSession(): AnonymousSession {
  if (typeof window === 'undefined') {
    return { uid: 'srv', createdAt: Date.now(), consentGiven: false };
  }
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnonymousSession;
      if (parsed?.uid && isValidCuid(parsed.uid)) return parsed;
    }
  } catch {
    /* fall through */
  }
  const fresh: AnonymousSession = {
    uid: generateCuid(),
    createdAt: Date.now(),
    consentGiven: false,
  };
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
    window.localStorage.setItem(SESSION_UID_KEY, fresh.uid);
  } catch {
    /* localStorage may be disabled; session still works in-memory */
  }
  return fresh;
}

export function setConsent(consentGiven: boolean) {
  if (typeof window === 'undefined') return;
  const sess = getOrCreateSession();
  sess.consentGiven = consentGiven;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  } catch {
    /* ignore */
  }
}

export function logEvent(type: string, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const sess = getOrCreateSession();
  if (!sess.consentGiven) return; // §17.3 拒絕仍可使用但不寫 events
  let events: any[] = [];
  try {
    const raw = window.localStorage.getItem(SESSION_EVENTS_KEY);
    events = raw ? JSON.parse(raw) : [];
  } catch {
    events = [];
  }
  events.push({ type, payload, ts: Date.now() });
  // 保留 90 天，砍掉太舊的
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  events = events.filter((e) => e.ts >= cutoff);
  try {
    window.localStorage.setItem(SESSION_EVENTS_KEY, JSON.stringify(events));
  } catch {
    /* ignore */
  }
}

/** 一鍵刪除：清掉本產品在這個瀏覽器的全部資料（AC-008）。回傳被刪除的 key。 */
export function deleteSession(): string[] {
  return deleteAllLocalData();
}
