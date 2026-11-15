// e2e/helpers.ts
// E2E 共用工具。所有輸入都是明顯虛構的資料（王小明、範例科技公司）。

import { expect, type BrowserContext, type Page } from '@playwright/test';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export interface NetworkLog {
  /** 被攔截並中止的非 localhost 請求 */
  external: string[];
  /** 送到本站的請求路徑 */
  local: string[];
}

/** 攔截 context 內所有請求：非 localhost 一律記錄並中止。 */
export async function trackNetwork(context: BrowserContext): Promise<NetworkLog> {
  const log: NetworkLog = { external: [], local: [] };
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (LOCAL_HOSTS.has(url.hostname)) {
      log.local.push(url.pathname);
      await route.continue();
    } else {
      log.external.push(url.toString());
      await route.abort();
    }
  });
  return log;
}

export async function acceptConsent(page: Page) {
  const modal = page.getByTestId('consent-modal');
  await expect(modal).toBeVisible();
  await page.getByTestId('consent-accept').click();
  await expect(modal).toBeHidden();
}

export async function readLocalStorage(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)!;
      out[key] = window.localStorage.getItem(key) ?? '';
    }
    return out;
  });
}

/** 5 則虛構回答（對應 rubric 的不同情況）。 */
export const E2E_ANSWERS = [
  // 完整 STAR + 量化（對應第 1 題：資料分析師／資深「建立組織資料策略」）
  '去年我在範例科技公司擔任資料分析主管，當時各部門的報表定義不一致。我的任務是在 3 個月內建立組織的資料策略。' +
    '我先分析 12 份既有報表的指標定義，接著我設計了統一的資料字典，並且我主動協調 4 個部門每 2 週對齊一次。' +
    '最後報表產出時間縮短 40%，指標爭議從每月 9 件降低到 1 件，這套資料策略後來成為公司的標準流程。',
  // 無量化
  '當時我在範例科技公司負責客服系統的維護，團隊常收到客戶抱怨等待太久。我的任務是改善工單處理流程。' +
    '我先分析工單類型，接著我設計新的分流規則，並協調同事一起上線。最後客戶的等待時間明顯縮短，主管也給了正面回饋。',
  // 極短
  '我做過很多專案。',
  // 含數字但沒有結構
  '營收多了 30%，成本少了 20 萬，總共花 3 個月。',
  // 不確定語氣
  '我大概是在前公司做過類似的事，可能是負責一部分的優化，好像有變快一些，但我不太確定實際的數字。',
];
