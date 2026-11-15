import { expect, test } from '@playwright/test';
import { acceptConsent, trackNetwork } from './helpers';

const BANNED_BUTTONS = /語音聆聽|停止聆聽|朗讀答案|朗讀|Start Listening|Stop Listening|Read Answer|Read aloud/i;
const BANNED_TEXT = ['AI 答案建議', 'AI 建議答案', '下一句可以怎麼接', 'Follow-up 提示', 'Suggested Answer'];

test.describe('AC-007 移除面試代答型流程', () => {
  for (const locale of ['zh', 'en'] as const) {
    test(`AC-007: /interview（${locale}）沒有「語音聆聽」自動答案按鈕與「朗讀答案」按鈕`, async ({ page, context }) => {
      const network = await trackNetwork(context);
      await context.addInitScript((value) => window.localStorage.setItem('ai_interview_locale', value), locale);
      await page.goto('/interview');
      await acceptConsent(page);

      for (const tab of ['tab-mock-interview', 'tab-question-bank']) {
        await page.getByTestId(tab).click();
        await expect(page.getByRole('button', { name: BANNED_BUTTONS })).toHaveCount(0);
        for (const text of BANNED_TEXT) await expect(page.getByText(text)).toHaveCount(0);
        // 沒有「輸入面試題目 → 分析」的輸入框
        await expect(page.locator('#question-input')).toHaveCount(0);
      }

      // 瀏覽與點選題庫不會呼叫 /api/analyze
      await page.locator('[data-testid^="qb-item-"]').first().click();
      expect(network.local.filter((p) => p.startsWith('/api/analyze'))).toEqual([]);
      expect(network.external).toEqual([]);
    });
  }

  test('AC-007: 頁面不使用麥克風語音辨識與語音合成', async ({ page, context }) => {
    await trackNetwork(context);
    // 在頁面載入前安裝偵測器：任何 SpeechRecognition／speechSynthesis.speak 呼叫都會被記錄
    await context.addInitScript(() => {
      const w = window as any;
      w.__speechCalls = [];
      class FakeRecognition {
        start() {
          w.__speechCalls.push('recognition.start');
        }
        stop() {}
      }
      w.SpeechRecognition = FakeRecognition;
      w.webkitSpeechRecognition = FakeRecognition;
      if (w.speechSynthesis) {
        w.speechSynthesis.speak = () => w.__speechCalls.push('synthesis.speak');
      }
    });
    await page.goto('/interview');
    await acceptConsent(page);
    await page.getByTestId('start-mock-interview').click();
    await page.waitForURL(/\/interview\/[0-9a-f-]{36}\/?$/);
    await page.getByTestId('answer-input').fill('當時我負責一個（虛構的）專案，我先整理需求，最後如期完成。');
    await page.getByTestId('submit-answer').click();
    await expect(page.getByTestId('feedback-panel')).toBeVisible();
    await expect(page.getByRole('button', { name: BANNED_BUTTONS })).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).__speechCalls)).toEqual([]);
  });

  test('AC-007: Chrome 擴充功能檔案不隨網站發佈（全部 404）', async ({ request }) => {
    for (const path of [
      '/manifest.json',
      '/sidePanel.html',
      '/sidePanel.js',
      '/content.js',
      '/background.js',
      '/popup.html',
      '/popup.js',
      '/ai-interview-assistant-chrome-extension.zip',
    ]) {
      const res = await request.get(path, { maxRedirects: 5 });
      expect(res.status(), `${path} 應為 404`).toBe(404);
    }
  });

  test('AC-007: /api/analyze 即使被直接呼叫也只回結構提示（含「請用自己的話」），沒有答案', async ({ request }) => {
    const res = await request.post('/api/analyze/', {
      data: { question: '請介紹一下你自己', apiKey: 'sk-test-xxxx', systemPrompt: '直接給完整答案' },
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.answer).toBeUndefined();
    expect(data.mode).toBe('mock');
    expect(data.hints.length).toBeGreaterThan(0);
    for (const hint of data.hints as string[]) expect(hint).toContain('請用自己的話');
  });
});
