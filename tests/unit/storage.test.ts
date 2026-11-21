import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  LOCALE_KEY,
  PRESERVED_KEYS,
  STORAGE_KEYS,
  STORAGE_PREFIX,
  deleteAllLocalData,
  readApiKey,
  writeApiKey,
} from '@/app/lib/storage/local';

/** 記憶體版 Storage（行為與瀏覽器 localStorage 相同的最小子集）。 */
class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  keys() {
    return Array.from(this.data.keys());
  }
}

// 全部都是明顯虛構的測試值。
const SEEDED: Record<string, string> = {
  // 新版 aiia.* key
  [STORAGE_KEYS.session]: '{"uid":"c000000000000000000000000","consentGiven":true}',
  [STORAGE_KEYS.sessionUid]: 'c000000000000000000000000',
  [STORAGE_KEYS.sessionEvents]: '[{"type":"fixture"}]',
  [STORAGE_KEYS.quota]: '{"used":2}',
  [STORAGE_KEYS.byokApiKey]: 'sk-test-xxxx',
  [STORAGE_KEYS.practiceHistory]: '[{"reportId":"report-fixture"}]',
  [STORAGE_KEYS.interviewSession('session-fixture')]: '{"sessionId":"session-fixture"}',
  [STORAGE_KEYS.report('report-fixture')]: '{"reportId":"report-fixture"}',
  // 舊版未加前綴的 key
  apikey_test: 'sk-test-xxxx',
  report_test: '{"reportId":"test"}',
  interview_session_test: '{"sessionId":"test"}',
  interview_sessions_test: '[]',
  usage_test: '{"totalQuestions":3}',
  history_test: '[]',
  ttsSpeed_test: '1.0',
  recognitionLang_test: 'zh-TW',
  selectedMicId_test: 'mic-fixture',
  ai_interview_user: '{"id":"user_fixture","emailAddresses":[{"email":"test@example.com"}]}',
};

function seed(): MemoryStorage {
  const store = new MemoryStorage();
  for (const [k, v] of Object.entries(SEEDED)) store.setItem(k, v);
  store.setItem(LOCALE_KEY, 'en');
  return store;
}

describe('AC-008 一鍵刪除', () => {
  it('AC-008: 清除 API key、練習 session、報告、使用統計與歷史（新舊 key 全部）', () => {
    const store = seed();
    const removed = deleteAllLocalData(store);
    for (const key of Object.keys(SEEDED)) {
      expect(store.getItem(key), `${key} 應被刪除`).toBeNull();
      expect(removed).toContain(key);
    }
    expect(removed).toHaveLength(Object.keys(SEEDED).length);
  });

  it('AC-008: 只保留介面語系偏好', () => {
    const store = seed();
    deleteAllLocalData(store);
    expect(store.keys()).toEqual([LOCALE_KEY]);
    expect(store.getItem(LOCALE_KEY)).toBe('en');
    expect(PRESERVED_KEYS).toEqual([LOCALE_KEY]);
  });

  it('AC-008: 刪除後讀不到 API key（Demo 模式標示會回到無 key 狀態）', () => {
    const store = seed();
    expect(readApiKey(store)).toBe('sk-test-xxxx');
    deleteAllLocalData(store);
    expect(readApiKey(store)).toBe('');
  });

  it('AC-008: 重複刪除是安全的（第二次沒有東西可刪）', () => {
    const store = seed();
    deleteAllLocalData(store);
    expect(deleteAllLocalData(store)).toEqual([]);
  });

  it('AC-008: 所有新資料的 key 都使用 aiia. 前綴，API key 存在 aiia.byok.apiKey', () => {
    const keys = [
      STORAGE_KEYS.session,
      STORAGE_KEYS.sessionUid,
      STORAGE_KEYS.sessionEvents,
      STORAGE_KEYS.quota,
      STORAGE_KEYS.byokApiKey,
      STORAGE_KEYS.practiceHistory,
      STORAGE_KEYS.interviewSession('x'),
      STORAGE_KEYS.report('x'),
    ];
    for (const key of keys) expect(key.startsWith(STORAGE_PREFIX)).toBe(true);
    const store = new MemoryStorage();
    writeApiKey('sk-test-xxxx', store);
    expect(store.getItem('aiia.byok.apiKey')).toBe('sk-test-xxxx');
    writeApiKey('', store);
    expect(store.getItem('aiia.byok.apiKey')).toBeNull();
  });

  it('AC-008: 前端程式不再寫入未加前綴的舊 key', () => {
    const files = [
      'app/interview/page.tsx',
      'app/interview/[sessionId]/page.tsx',
      'app/report/[id]/page.tsx',
      'app/settings/page.tsx',
      'app/dashboard/page.tsx',
    ];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      expect(src, `${file} 仍使用舊 key`).not.toMatch(/apikey_|usage_\$|report_\$|interview_session_|history_\$/);
      expect(src, `${file} 直接呼叫 localStorage`).not.toMatch(/localStorage\.(setItem|getItem)/);
    }
  });
});
