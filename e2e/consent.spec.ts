import { expect, test } from '@playwright/test';
import { trackNetwork } from './helpers';

test.describe('AC-009 同意文案與實際資料流一致', () => {
  test('AC-009: 首次進入的同意 modal 包含三個要點的關鍵句', async ({ page, context }) => {
    const network = await trackNetwork(context);
    await page.goto('/interview');
    const modal = page.getByTestId('consent-modal');
    await expect(modal).toBeVisible();

    // 1. Mock 模式資料只存在本機瀏覽器
    await expect(modal).toContainText('Mock 模式');
    await expect(modal).toContainText('練習資料只存在本機瀏覽器');
    // 2. 自備 API key 時，題目、回答與 key 會經本站伺服器轉送給 AI 供應商
    await expect(modal).toContainText('若使用自備 API key');
    await expect(modal).toContainText('題目、回答與 key 會經本站伺服器轉送給 AI 供應商');
    // 3. 不會在伺服器保存回答
    await expect(modal).toContainText('不會在伺服器保存回答');

    // 不得出現與資料流不符的舊說法
    await expect(modal).not.toContainText('不送伺服器');
    await expect(modal).not.toContainText('不上 server');
    await expect(page.getByTestId('consent-points').locator('li')).toHaveCount(3);

    // 同意後不再出現
    await page.getByTestId('consent-accept').click();
    await expect(modal).toBeHidden();
    await page.reload();
    await expect(page.getByTestId('start-mock-interview')).toBeVisible();
    await expect(page.getByTestId('consent-modal')).toHaveCount(0);

    expect(network.external).toEqual([]);
  });

  test('AC-009: 文案與實際行為一致 — Mock 模式作答只送到本站 API，不帶 key、不送到任何外部主機', async ({
    page,
    context,
  }) => {
    const network = await trackNetwork(context);
    await page.goto('/interview');
    await page.getByTestId('consent-accept').click();
    await page.getByTestId('start-mock-interview').click();
    await page.waitForURL(/\/interview\/[0-9a-f-]{36}\/?$/);

    const [answerRequest] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/interview/answer') && req.method() === 'POST'),
      (async () => {
        await page.getByTestId('answer-input').fill('當時我負責一個（虛構的）專案，我先整理需求，最後如期完成。');
        await page.getByTestId('submit-answer').click();
      })(),
    ]);
    expect(new URL(answerRequest.url()).hostname).toBe('localhost');
    expect(answerRequest.headers()['x-api-key']).toBeUndefined();
    await expect(page.getByTestId('feedback-panel')).toBeVisible();
    expect(network.external).toEqual([]);
  });

  test('AC-009: 拒絕同意仍可練習，且不記錄練習事件', async ({ page }) => {
    await page.goto('/interview');
    await page.getByTestId('consent-decline').click();
    await expect(page.getByTestId('consent-modal')).toBeHidden();
    await expect(page.getByTestId('start-mock-interview')).toBeEnabled();
    expect(await page.evaluate(() => window.localStorage.getItem('aiia.session.events'))).toBeNull();
  });

  test('AC-009: 設定頁對自備 key 的說明與資料流一致', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('consent-accept').click();
    await expect(page.getByText('題目、回答與 key 會經本站伺服器轉送給 AI 供應商').first()).toBeVisible();
    await expect(page.getByText('不送伺服器')).toHaveCount(0);
  });
});
