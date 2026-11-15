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
  interview/page.tsx          練習頁（題庫、工具側欄；含待移除的代答型流程，見 SPEC §9）
  interview/[sessionId]/      模擬面試逐題作答
  interview/components/       questionBank.ts（題庫）、Timer、VideoSimulation（鏡頭預覽）、RatingForm（自評）
  report/[id]/                複盤報告（雷達圖、Markdown 匯出）
  settings/                   BYOK key、語音設定、一鍵刪除
  dashboard/  pricing/        個人統計、靜態定價頁
  sign-in/ sign-up/ login/ register/   localStorage 假登入
  api/interview/{start,answer,end}/    模擬面試 API（經 LlmProvider）
  api/analyze/                單題建議答案（繞過 LlmProvider，M1 需處理）
  api/test-key/               BYOK key 驗證
  lib/llm/                    LlmProvider 介面、router、mock-provider、byok-provider
  lib/session/                匿名 session、consent、免費額度
  components/  i18n/          UI primitives、session-init、語系
components/                   auth-provider（假登入）、clerk-provider（未使用）
middleware.ts                 安全 headers
scripts/verify-mvp.sh         curl smoke test
PRD/SPEC.md  PRD/CHANGELOG.md
manifest.json sidePanel.* content.js background.js popup.* public/（同名複本）  Chrome 擴充功能（處置待 Sean 決定）
```

## 3. 技術棧

- Next.js 14.2.5（App Router）、React 18、TypeScript 5（`tsconfig.json` 目前 `strict: false`）、Tailwind CSS 3、ESLint 8（`next/core-web-vitals`）。
- 資料：瀏覽器 localStorage；無資料庫。
- AI：`app/lib/llm/` 自訂 `LlmProvider`；Mock 為預設，BYOK 以 `fetch` 呼叫 OpenAI Chat Completions。`openai`、`@clerk/nextjs` 套件已安裝但主要流程未使用。
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

見 [`SOP.md`](./SOP.md)。目前可用：`npm run lint`、`npx tsc --noEmit`、`npm run build`、`bash scripts/verify-mvp.sh <host>`；`test`、`typecheck`、`e2e` scripts 尚未配置（M1 AC-001）。

## 6. Commit 規則

使用 `<type>(scope): <說明或 FR/AC 編號>`，例如 `test(llm): AC-003 降級契約測試`、`docs: 重建 PRD`。
