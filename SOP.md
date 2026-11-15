# AI 面試演練與複盤 — 開發 SOP

## 規格對齊狀態（2026-11-16）

- ✅ `PRD/SPEC.md` v4.0、`GOAL.md` 定義 M1；評分規則見 `PRD/RUBRIC.md`。
- ✅ M1 已配置 `typecheck`、`test`、`e2e` scripts 與 CI（`.github/workflows/ci.yml`）。
- ✅ web 端代答型流程已移除；Chrome 擴充功能不隨 web 部署（原始檔處置待 Sean 決定）。
- ⚠️ GitHub Pages workflow（`deploy.yml`）仍會在 push 到 `master` 時執行且先前持續失敗；Vercel 正式網址待確認。兩者都不在 M1 範圍。

## 環境

- Node.js：`package.json` `engines` 要求 ≥ 20；CI 使用 Node 20。本機以 Node v26.13.1 + npm 11 驗證。
- 不需要任何環境變數。所有測試都以 Mock 或假 `fetch` 執行，不需要也不得使用真實 AI key。
- E2E 第一次執行前需安裝瀏覽器：`npx playwright install chromium`。

## 驗證指令（皆在 repo 根目錄執行）

| 類型 | 指令 | 說明 |
|---|---|---|
| 安裝 | `npm ci` | 會出現 install-scripts 警告，可忽略 |
| Lint | `npm run lint` | ESLint（`next/core-web-vitals`） |
| Typecheck | `npm run typecheck` | `tsc --noEmit`（含測試與 E2E 檔） |
| 單元／契約測試 | `npm test` | Vitest；`tests/setup/network-guard.ts` 會讓任何真實 `fetch` 直接拋錯 |
| Build | `npm run build` | Next.js production build |
| E2E | `npm run e2e` | Playwright（Chromium）；自動 build 並啟動 `next start`（port 3100，可用 `E2E_PORT` 更改）；攔截並統計所有非 localhost 請求，必須為 0 |
| Whitespace | `git diff --check` | 提交前執行；CI 以 `git diff --check origin/master...HEAD` 檢查整個分支 |
| 憑證掃描 | `bash scripts/check-credentials.sh` | 掃描 git 追蹤檔案中的 `sk-…`、`sk_live`、`pk_live` 樣式 |
| API smoke（選用） | `bash scripts/verify-mvp.sh http://localhost:3000` | 需先 `npm run build && npm run start`；**務必帶本機 host**，不帶參數會打正式環境 |
| 本機啟動 | `npm run dev` | 開發用 |

注意：

- 本機 API 位於 `trailingSlash: true`，直接 curl 時需加 `-L` 或在路徑尾端加 `/`。
- 測試失敗時修正程式；不得刪除測試、加 `.skip` 或放寬斷言。

## 標準驗證流程（M1）

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
git diff --check
bash scripts/check-credentials.sh
```

每次執行後把各指令的 exit code 與摘要更新到 `STATUS.md`。CI 會在每個 PR 與非 `master` 分支的 push 上執行同一組檢查，任一步驟失敗即整體失敗。

## AC 與測試對照

| AC | 單元／契約測試（`tests/unit/`） | E2E（`e2e/`） |
|---|---|---|
| AC-001 | `network-guard.test.ts` | — |
| AC-002 | `provider-contract.test.ts`、`api-routes.test.ts` | — |
| AC-003 | `router-degrade.test.ts`、`api-routes.test.ts`、`network-guard.test.ts` | — |
| AC-004 | `question-bank.test.ts` | `practice-loop.spec.ts`（題庫篩選） |
| AC-005 | `rubric.test.ts`、`api-routes.test.ts` | `practice-loop.spec.ts`（報告頁證據／建議區塊） |
| AC-006 | `api-routes.test.ts` | `practice-loop.spec.ts` |
| AC-007 | `repo-hygiene.test.ts`、`api-routes.test.ts` | `anti-proxy.spec.ts` |
| AC-008 | `storage.test.ts` | `delete-data.spec.ts` |
| AC-009 | `repo-hygiene.test.ts` | `consent.spec.ts` |
| AC-010 | `repo-hygiene.test.ts` | — |

測試名稱一律以 `AC-xxx:` 開頭，可用 `npx vitest run -t "AC-005"` 或 `npx playwright test -g "AC-006"` 只跑單一 AC。

## 故意不做（M1）

- ❌ 面試中即時代答、會議軟體內的提示或朗讀。
- ❌ 正式付費 AI API 呼叫、真實金流、真實帳號、雲端資料庫。
- ❌ 真實履歷、錄音、逐字稿或任何真實個資。
- ❌ Production 部署與部署設定修改（需另行人審）。
