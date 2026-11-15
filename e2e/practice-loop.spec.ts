import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { acceptConsent, E2E_ANSWERS, readLocalStorage, trackNetwork } from './helpers';

test.describe('AC-006 無 key、無登入的 UI 練習閉環', () => {
  test('AC-006: 從 /interview 選職務與職級 → 作答 5 題 → 每題顯示分數與回饋 → 報告頁 → 匯出 Markdown；全程零外部請求', async ({
    page,
    context,
  }) => {
    const network = await trackNetwork(context);

    // 乾淨的瀏覽器：localStorage 是空的，沒有 key、沒有登入狀態
    await page.goto('/interview');
    expect(await page.evaluate(() => window.localStorage.getItem('aiia.byok.apiKey'))).toBeNull();
    expect(await page.evaluate(() => window.localStorage.getItem('ai_interview_user'))).toBeNull();

    await acceptConsent(page);

    // 沒有登入牆、Demo 模式標示為 mock
    await expect(page.getByText('請先登入')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /前往登入|Sign in/ })).toHaveCount(0);
    await expect(page.getByTestId('aiia-mode-badge')).toHaveAttribute('data-mode', 'mock');

    // 選擇職務與職級並開始（必須呼叫 /api/interview/start，且不帶 x-api-key）
    await page.getByTestId('job-type-select').selectOption('data-analyst');
    await page.getByTestId('job-level-select').selectOption('senior');
    const [startRequest] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/interview/start') && req.method() === 'POST'),
      page.getByTestId('start-mock-interview').click(),
    ]);
    expect(startRequest.postDataJSON()).toEqual({ jobType: 'data-analyst', jobLevel: 'senior' });
    expect(startRequest.headers()['x-api-key']).toBeUndefined();

    await page.waitForURL(/\/interview\/[0-9a-f-]{36}\/?$/);
    await expect(page.getByTestId('session-mode')).toHaveAttribute('data-mode', 'mock');
    await expect(page.getByText('請先登入')).toHaveCount(0);

    const questions: string[] = [];
    const scores: number[] = [];
    for (let i = 0; i < 5; i++) {
      await expect(page.getByTestId('question-progress')).toHaveText(`第 ${i + 1} / 5 題`);
      const question = (await page.getByTestId('question-text').innerText()).trim();
      expect(question.length).toBeGreaterThan(0);
      expect(questions).not.toContain(question);
      questions.push(question);

      await page.getByTestId('answer-input').fill(E2E_ANSWERS[i]);
      await page.getByTestId('submit-answer').click();

      // 每題顯示分數與回饋（可觀察證據、建議分開）
      const panel = page.getByTestId('feedback-panel');
      await expect(panel).toBeVisible();
      const score = Number(await page.getByTestId('answer-score').innerText());
      expect(Number.isInteger(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      scores.push(score);
      await expect(page.getByTestId('answer-feedback')).not.toBeEmpty();
      await expect(page.getByTestId('feedback-evidence')).toContainText('可觀察證據');
      await expect(page.getByTestId('feedback-evidence').locator('li').first()).toBeVisible();
      await expect(page.getByTestId('feedback-suggestions')).toContainText('建議');
      await expect(page.getByTestId('feedback-suggestions')).toContainText('請用自己的話');
      await expect(page.getByTestId('degraded-notice')).toHaveCount(0);

      if (i < 4) {
        await page.getByTestId('next-question').click();
      }
    }

    // rubric：完整 STAR + 量化的回答分數最高，極短回答最低
    expect(scores[0]).toBeGreaterThanOrEqual(90);
    expect(scores[0]).toBeGreaterThan(scores[1]);
    expect(scores[2]).toBeLessThanOrEqual(20);
    expect(Math.min(...scores)).toBe(scores[2]);

    // 結束 → 導向 /report/[id]
    await page.getByTestId('end-interview').click();
    await page.waitForURL(/\/report\/[0-9a-f-]{36}\/?$/);

    // 總分 = 5 題平均
    const expectedOverall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    await expect(page.getByTestId('report-overall-score')).toHaveText(String(expectedOverall));

    // 雷達圖
    const radar = page.getByTestId('report-radar');
    await expect(radar).toBeVisible();
    for (const label of ['STAR 結構', '深度與量化', '相關性', '表達清晰度', '自信程度']) {
      await expect(radar).toContainText(label);
    }

    // 逐題回饋：5 題，每題都有分數、題目、「可觀察證據」與「建議」區塊（AC-005）
    for (let i = 0; i < 5; i++) {
      const item = page.getByTestId(`report-answer-${i}`);
      await expect(item).toContainText(questions[i]);
      await expect(page.getByTestId(`answer-score-${i}`)).toContainText(String(scores[i]));
      await expect(page.getByTestId(`report-evidence-${i}`)).toContainText('可觀察證據');
      await expect(page.getByTestId(`report-evidence-${i}`).locator('li').first()).toBeVisible();
      await expect(page.getByTestId(`report-suggestions-${i}`)).toContainText('建議');
      await expect(page.getByTestId(`report-suggestions-${i}`)).toContainText('請用自己的話');
    }
    await expect(page.getByTestId('report-evidence-0')).toContainText('偵測到 STAR 要素 4/4');
    await expect(page.getByTestId('report-evidence-0')).toContainText('40%');
    await expect(page.getByTestId('report-evidence-1')).toContainText('未偵測到量化數字');
    await expect(page.getByTestId('report-evidence-3')).toContainText('30%');
    await expect(page.getByTestId('report-strengths')).toBeVisible();
    await expect(page.getByTestId('report-improvements')).toBeVisible();
    await expect(page.getByTestId('report-summary')).toContainText('共作答 5 題');

    // 匯出 Markdown
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-markdown').click()]);
    expect(download.suggestedFilename()).toMatch(/^interview-report-[0-9a-f]{8}\.md$/);
    const markdown = await readFile((await download.path())!, 'utf8');
    expect(markdown).toContain(`整體分數: **${expectedOverall} / 100**`);
    expect(markdown).toContain('**可觀察證據**');
    expect(markdown).toContain('**建議**');
    for (const question of questions) expect(markdown).toContain(question);

    // 全程不要求 API key、沒有登入狀態
    const storage = await readLocalStorage(page);
    expect(storage['aiia.byok.apiKey']).toBeUndefined();
    expect(storage['ai_interview_user']).toBeUndefined();
    expect(Object.keys(storage).some((k) => k.startsWith('aiia.report.'))).toBe(true);

    // API 使用情況：start 1 次、answer 5 次、end 1 次；沒有 /api/analyze、沒有登入頁
    const count = (prefix: string) => network.local.filter((p) => p.startsWith(prefix)).length;
    expect(count('/api/interview/start')).toBe(1);
    expect(count('/api/interview/answer')).toBe(5);
    expect(count('/api/interview/end')).toBe(1);
    expect(count('/api/analyze')).toBe(0);
    expect(count('/sign-in')).toBe(0);

    // 零外部請求
    expect(network.external).toEqual([]);
  });

  test('AC-006: 報告重新整理後仍可從本機讀取；練習紀錄頁不需登入即可看到這次練習', async ({ page, context }) => {
    const network = await trackNetwork(context);
    await page.goto('/interview');
    await acceptConsent(page);
    await page.getByTestId('start-mock-interview').click();
    await page.waitForURL(/\/interview\/[0-9a-f-]{36}\/?$/);

    await page.getByTestId('answer-input').fill(E2E_ANSWERS[0]);
    await page.getByTestId('submit-answer').click();
    await expect(page.getByTestId('feedback-panel')).toBeVisible();

    // 作答中重新整理：進度與回饋仍在
    await page.reload();
    await expect(page.getByTestId('feedback-panel')).toBeVisible();
    await expect(page.getByTestId('question-progress')).toHaveText('第 1 / 5 題');

    // 提前結束也能產生報告
    await page.getByTestId('end-early-btn').click();
    await page.waitForURL(/\/report\/[0-9a-f-]{36}\/?$/);
    const score = await page.getByTestId('report-overall-score').innerText();

    await page.reload();
    await expect(page.getByTestId('report-overall-score')).toHaveText(score);

    await page.goto('/dashboard');
    await expect(page.getByText('請先登入')).toHaveCount(0);
    await expect(page.getByTestId('stat-sessions')).toHaveText('1');
    await expect(page.getByTestId('dashboard-history')).toContainText(`${score} / 100`);

    expect(network.external).toEqual([]);
  });
});

test.describe('AC-004 題庫篩選（單一題庫）', () => {
  test('AC-004: 題庫可依題型、語言、職務、職級篩選，且只顯示提示、不產生答案', async ({ page, context }) => {
    const network = await trackNetwork(context);
    await page.goto('/interview');
    await acceptConsent(page);
    await page.getByTestId('tab-question-bank').click();

    const count = async () => Number((await page.getByTestId('qb-count').innerText()).match(/\d+/)![0]);
    expect(await count()).toBeGreaterThanOrEqual(106);

    await page.getByTestId('qb-filter-job').selectOption('general');
    expect(await count()).toBeGreaterThanOrEqual(46);

    await page.getByTestId('qb-filter-job').selectOption('sales');
    await page.getByTestId('qb-filter-level').selectOption('mid');
    expect(await count()).toBe(5);

    await page.getByTestId('qb-filter-job').selectOption('all');
    await page.getByTestId('qb-filter-level').selectOption('all');
    await page.getByTestId('qb-filter-type').selectOption('system-design');
    await page.getByTestId('qb-filter-lang').selectOption('en');
    const filtered = await count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(46);

    // 點題目只展開提示，不呼叫任何 API
    const before = network.local.filter((p) => p.startsWith('/api/')).length;
    await page.locator('[data-testid^="qb-item-"]').first().click();
    await expect(page.locator('[data-testid^="qb-item-"]').first()).toContainText(/Use your own words|請用自己的話/);
    expect(network.local.filter((p) => p.startsWith('/api/')).length).toBe(before);
    expect(network.external).toEqual([]);
  });
});
