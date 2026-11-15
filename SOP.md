# AI 面試演練與複盤 — 開發 SOP

## 規格對齊狀態（2026-11-16）

- ✅ `PRD/SPEC.md` v4.0 已依 `master` @ `53a79b2` 實際程式重建；`GOAL.md` 定義 M1。
- ⚠️ 尚無任何自動化測試；`test`、`typecheck`、`e2e` scripts 尚未配置（M1 AC-001）。
- ⚠️ 現有 web 練習頁與 Chrome 擴充功能含面試代答型流程，M1 必須處理（AC-007）。
- ⚠️ GitHub Pages workflow 最近 5 次執行皆失敗；Vercel 正式網址有兩個版本說法，待確認。

## 環境

- Node.js：repo 未指定 `engines`；CI 使用 Node 20。本次文件重建在 Node v26.13.1 + npm 驗證可安裝與建置。
- 不需要任何環境變數即可以 Mock 模式執行。`.env.local.example` 只含 Clerk 佔位值，目前主要流程未使用。

## 驗證指令（皆在 repo 根目錄執行）

| 類型 | 指令 | 狀態 | 2026-11-16 實測 |
|---|---|---|---|
| 安裝 | `npm ci` | 可用 | exit 0（有 install-scripts 警告） |
| Lint | `npm run lint` | 可用 | exit 0，無 warning／error |
| Typecheck | `npx tsc --noEmit` | 可用（無對應 npm script） | exit 0 |
| Typecheck script | `npm run typecheck` | **尚未配置** | — |
| Unit／契約測試 | `npm test` | **尚未配置** | — |
| E2E | `npm run e2e` | **尚未配置** | — |
| Build | `npm run build` | 可用 | exit 0，15 個 routes |
| 本機啟動 | `npm run dev`（開發）、`npm run start`（需先 build） | 可用 | `start` 實測可回應 |
| API smoke | `bash scripts/verify-mvp.sh http://localhost:3000` | 可用（需先啟動本機 server） | 對本機 server 8 passed／0 failed |
| Whitespace | `git diff --check` | 可用 | — |

注意：

- `scripts/verify-mvp.sh` 不帶參數時預設打 `https://ai-interview-assistant.vercel.app`（正式環境），一般開發請一律帶本機 host。
- 本機 API 位於 `trailingSlash: true`，直接 curl 時需加 `-L` 或在路徑尾端加 `/`。
- 不得把「尚未配置」的指令視為通過。

## 標準驗證流程

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run build
# 另開終端機：npm run start
bash scripts/verify-mvp.sh http://localhost:3000
git diff --check
```

M1 完成後應改為：

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
git diff --check
```

## M1 開發順序建議

1. AC-001：加入測試框架與 scripts，先讓空測試跑起來；測試 setup 阻擋外部網路。
2. AC-002、AC-003：`/api/analyze` 處置（移除或改經 `LlmProvider`）、provider 契約與降級測試。
3. AC-004、AC-005：整合題庫、rubric 評分與 fixture 測試。
4. AC-007：移除 web 端代答型流程、把擴充功能移出 `public/`。
5. AC-006、AC-008、AC-009：UI 閉環、一鍵刪除、同意文案，以 E2E 驗證。
6. AC-010：更新 `STATUS.md` 證據。

## 故意不做（M1）

- ❌ 面試中即時代答、會議軟體內的提示或朗讀。
- ❌ 正式付費 AI API 呼叫、真實金流、真實帳號、雲端資料庫。
- ❌ 真實履歷、錄音、逐字稿或任何真實個資。
- ❌ Production 部署與部署設定修改（需另行人審）。
