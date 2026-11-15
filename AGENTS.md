# AGENTS.md — AI 面試演練與複盤

## 1. 權威規格與範圍

- Single Source of Truth：[`PRD/SPEC.md`](./PRD/SPEC.md) v4.0；目前里程碑：[`GOAL.md`](./GOAL.md)（M1）。
- 實作必須能對應到 SPEC §6 的 FR 編號與 GOAL 的 AC 編號。
- **產品紅線：不得做隱藏式或面試進行中的即時代答**（聆聽面試官提問 → 自動產生答案 → 提示或朗讀）。任何練習提示必須由使用者在練習情境主動觸發，並提醒「請用自己的話」。
- 不得做錄取預測、人格評斷，或宣稱提升錄取率。
- M1 只用 Mock AI；正式付費 AI API、真實金流、真實帳號、雲端資料庫、真實個資一律不在 M1 範圍。

## 2. 專案結構

```
app/
  page.tsx                    Landing
  interview/page.tsx          練習頁：開始模擬面試（職務／職級）、題庫瀏覽、練習工具
  interview/[sessionId]/      模擬面試逐題作答（分數、可觀察證據、建議）
  interview/components/       Timer、VideoSimulation（鏡頭預覽）、RatingForm（自評）
  report/[id]/                複盤報告（雷達圖、證據／建議、Markdown 匯出）
  settings/                   選填 API key、額度、練習紀錄、一鍵刪除
  dashboard/  pricing/        練習紀錄統計、靜態定價頁
  sign-in/ sign-up/ login/ register/   localStorage 假登入（主要流程不需要）
  api/interview/{start,answer,end}/    模擬面試 API（只經 LlmProvider）
  api/analyze/                只回傳答題結構提示；介面入口已停用，去留待 Sean 決定
  api/test-key/               自備 key 驗證（經 LlmProvider.validateKey）
  lib/llm/                    LlmProvider 介面、router（工廠／重試／降級／冷卻）、mock-provider、byok-provider
  lib/questions/              單一題庫（bank.ts）與 schema 驗證
  lib/scoring/                rubric 評分（規則文件：PRD/RUBRIC.md）
  lib/practice/               模擬面試的瀏覽器端資料模型、報告 Markdown
  lib/storage/                localStorage key 規則（aiia.*）與一鍵刪除
  lib/session/                匿名 session、consent、免費額度
  components/  i18n/          UI primitives、session-init（同意 modal）、語系
components/                   auth-provider（假登入）、clerk-provider（未使用）
tests/                        Vitest：unit/（測試名稱標 AC 編號）、setup/（網路守門、假 fetch）、fixtures/、helpers/
e2e/                          Playwright E2E
middleware.ts                 安全 headers
scripts/                      verify-mvp.sh（curl smoke）、check-credentials.sh（憑證掃描）
PRD/SPEC.md  PRD/RUBRIC.md  PRD/CHANGELOG.md
manifest.json sidePanel.* content.js background.js popup.* *.zip   舊版 Chrome 擴充功能原始檔（不在 public/、不隨 web 部署；處置待 Sean 決定，勿修改）
```

## 3. 技術棧

- Next.js 14.2.5（App Router）、React 18、TypeScript 5（`tsconfig.json` 目前 `strict: false`）、Tailwind CSS 3、ESLint 8（`next/core-web-vitals`）。
- 資料：瀏覽器 localStorage；無資料庫。
- AI：`app/lib/llm/` 自訂 `LlmProvider`；Mock 為預設，BYOK 以 `fetch` 呼叫 OpenAI Chat Completions。`openai`、`@clerk/nextjs` 套件已安裝但主要流程未使用。
- 測試：Vitest 2（單元／契約）、Playwright（E2E，Chromium）。CI：`.github/workflows/ci.yml`。
- 部署：Vercel（`vercel.json`）、GitHub Pages workflow（`.github/workflows/deploy.yml`，目前持續失敗）。
- 套件管理：`package-lock.json` 與 `pnpm-lock.yaml` 並存，以 npm 為準（`vercel.json`、CI 皆用 npm），政策待確認。

## 4. 開發規則

1. 修改前先讀本檔、`GOAL.md`、`SOP.md`、`STATUS.md` 與 SPEC 對應章節。
2. **只用假資料**：測試 fixture、範例、截圖一律使用明顯虛構內容（例如「王小明」、`test@example.com`、`0900-000-000`、`sk-test-xxxx`）。不得放入真實履歷、錄音、逐字稿、客戶或學校資料。
3. **不得提交憑證**：API key、token、`.env*`（`.env.local.example` 佔位檔除外）不得進 repo；不得把 API key 寫入 log 或錯誤訊息。
4. **測試不可為了通過而刪改斷言**：測試失敗時修正程式；若確認是需求變更，須在 PR 說明並同步更新 SPEC／GOAL，不得刪除、跳過（`.skip`）或放寬斷言來讓 CI 變綠。
5. 測試不得發出真實外部網路請求；所有 AI 呼叫在測試中以 Mock 或攔截的假 `fetch` 取代。
6. 所有 AI 呼叫必須經 `LlmProvider`；不得在 API route 內直接呼叫外部 AI 端點。
7. 每個增量須附可重跑的驗證指令與 exit code（記錄於 `STATUS.md`）。
8. 不得在 agent session 內 push 到 `master`、merge、部署 production、修改 repo 設定或旋轉 secrets。
9. 金流、帳號、個資儲存、正式 AI API 接入需 Sean 人審後才能開工。

## 5. 驗證命令

見 [`SOP.md`](./SOP.md)：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、`npm run e2e`、`git diff --check`、`bash scripts/check-credentials.sh`。每條 AC 至少對應一個測試，測試名稱以 `AC-xxx:` 開頭。

## 6. Commit 規則

使用 `<type>(scope): <說明或 FR/AC 編號>`，例如 `test(llm): AC-003 降級契約測試`、`docs: 重建 PRD`。
