import { expect, test } from '@playwright/test';
import { readLocalStorage, trackNetwork } from './helpers';

// 全部是明顯虛構的測試值。
const SEEDED: Record<string, string> = {
  // GOAL AC-008 指定的各類 key
  apikey_test: 'sk-test-xxxx',
  report_test: '{"reportId":"test"}',
  interview_session_test: '{"sessionId":"test"}',
  usage_test: '{"totalQuestions":3,"history":[]}',
  'aiia.session': '{"uid":"c000000000000000000000000","createdAt":0,"consentGiven":true}',
  // 其他舊版與新版 key
  history_test: '[]',
  interview_sessions_test: '[]',
  ai_interview_user: '{"id":"user_fixture","firstName":"王小明","emailAddresses":[{"email":"test@example.com"}]}',
  'aiia.session.uid': 'c000000000000000000000000',
  'aiia.session.quota': '{"used":2,"lastUpdated":0}',
  'aiia.session.events': '[{"type":"fixture","ts":0}]',
  'aiia.byok.apiKey': 'sk-test-xxxx',
  'aiia.practice.history':
    '[{"reportId":"report-fixture","sessionId":"session-fixture","jobType":"sales","jobLevel":"mid","overallScore":50,"questionCount":5,"completedAt":"2026-01-01T00:00:00.000Z"}]',
  'aiia.report.report-fixture': '{"reportId":"report-fixture"}',
  'aiia.interview.session.session-fixture': '{"sessionId":"session-fixture"}',
};

test.describe('AC-008 一鍵刪除完整', () => {
  test('AC-008: 點擊 delete-session-btn 後，API key、練習 session、報告、使用統計與歷史全部清除；語系偏好保留', async ({
    page,
    context,
  }) => {
    const network = await trackNetwork(context);

    await page.goto('/settings');
    await page.evaluate((seeded) => {
      window.localStorage.clear();
      for (const [key, value] of Object.entries(seeded)) window.localStorage.setItem(key, value);
      window.localStorage.setItem('ai_interview_locale', 'zh');
    }, SEEDED);
    await page.reload();

    // 刪除前：有 key → 標示為自備 key 模式，額度已用 2 次，練習紀錄有 1 筆
    await expect(page.getByTestId('consent-modal')).toHaveCount(0);
    await expect(page.getByTestId('aiia-settings-mode')).toHaveAttribute('data-mode', 'byok');
    await expect(page.getByTestId('aiia-settings-quota')).toHaveAttribute('data-free-left', '1');
    await expect(page.getByTestId('settings-history')).toContainText('50 / 100');
    const before = await readLocalStorage(page);
    for (const key of Object.keys(SEEDED)) expect(before[key], `${key} 應已寫入`).toBeDefined();

    // 刪除
    await page.getByTestId('open-delete-modal-btn').click();
    await page.getByTestId('delete-session-btn').click();

    // 頁面顯示「已刪除」
    await expect(page.getByTestId('session-deleted-toast')).toContainText('已刪除');

    // 所有 key 都不存在，只保留語系偏好
    const after = await readLocalStorage(page);
    for (const key of Object.keys(SEEDED)) expect(after[key], `${key} 應被刪除`).toBeUndefined();
    expect(after).toEqual({ ai_interview_locale: 'zh' });

    // Demo 模式標示反映「無 key」狀態；額度重置；歷史清空；輸入框清空
    await expect(page.getByTestId('aiia-settings-mode')).toHaveAttribute('data-mode', 'mock');
    await expect(page.getByTestId('aiia-settings-mode')).toContainText('Demo');
    await expect(page.getByTestId('aiia-settings-quota')).toHaveAttribute('data-free-left', '3');
    await expect(page.getByTestId('settings-history')).not.toContainText('50 / 100');
    await expect(page.locator('#api-key-input')).toHaveValue('');

    // 其他頁面的 Demo 模式標示也回到 mock
    await page.goto('/interview');
    await expect(page.getByTestId('aiia-mode-badge')).toHaveAttribute('data-mode', 'mock');

    // 被刪除的報告已讀不到
    await page.goto('/report/report-fixture');
    await expect(page.getByTestId('report-not-found')).toBeVisible();

    expect(network.external).toEqual([]);
  });

  test('AC-008: 取消刪除不會動到任何資料', async ({ page }) => {
    await page.goto('/settings');
    await page.evaluate((seeded) => {
      window.localStorage.clear();
      for (const [key, value] of Object.entries(seeded)) window.localStorage.setItem(key, value);
    }, SEEDED);
    await page.reload();
    await page.getByTestId('open-delete-modal-btn').click();
    await page.getByRole('button', { name: '取消' }).click();
    const after = await readLocalStorage(page);
    for (const key of Object.keys(SEEDED)) expect(after[key]).toBe(SEEDED[key]);
    await expect(page.getByTestId('session-deleted-toast')).toHaveCount(0);
  });
});
