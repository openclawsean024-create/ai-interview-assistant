# Status — ai-interview-assistant

- Project：AI 面試演練與複盤
- Repo：`openclawsean024-create/ai-interview-assistant`（預設分支 `master`）
- State：🟡 **文件重建完成、M1 尚未開發** — 2026-11-16
- Spec：`PRD/SPEC.md` v4.0；Goal：`GOAL.md`（M1）
- Stack：Next.js 14.2.5 + React 18 + TypeScript 5 + Tailwind 3；localStorage；Mock／BYOK AI provider

## Notion 商品資料庫對應

| Notion 欄位（「可產品化商品」） | 值 | 本 repo 對應 |
|---|---|---|
| 產品名稱 | AI 面試演練與複盤 | 本 repo |
| 優先順序 | P3 | — |
| 開發順位 | 第 9 個 | — |
| 主 repo | openclawsean024-create/ai-interview-assistant | 本 repo |
| 要併入的 repo | 無 | 無合併工作 |
| 獲利潛力／模式 | 中／免費增值、SaaS 訂閱 | SPEC §3 |
| 目標客群 | 求職者、大學就業輔導處、企業招募 | SPEC §2 |
| 現況完成度 | 50 | 見下方 FR 對照（P0 九項中無一項完整實作） |
| 上市前要補 | 補測試、接真實 AI 取代假資料、題庫與評分 | GOAL AC-001～AC-005（真實 AI 正式接入屬 M2） |
| 主要風險 | 避免被當作面試代答工具；AI 成本 | SPEC §9、GOAL AC-007 |

## 本次增量（chore/prd-rebuild）

- 本次為**文件重建**，未修改任何功能程式碼、設定或測試。
- 依 `master` @ `53a79b2` 實際程式重寫 `PRD/SPEC.md`、`GOAL.md`、`AGENTS.md`、`SOP.md`、`STATUS.md`。
- `PRD/CHANGELOG.md`、README 未修改（README 與程式不一致處列於 SPEC §12）。

## FR 實作對照

| FR | 需求 | 優先 | 狀態 |
|---|---|---|---|
| FR-001 | 題庫篩選 | P0 | 部分 |
| FR-002 | 結構化模擬面試閉環 | P0 | 部分（API 可用，UI 無法走通） |
| FR-003 | rubric 評分與證據式回饋 | P0 | 部分（Mock 依字數評分） |
| FR-004 | 複盤報告與匯出 | P0 | 部分（頁面可用，無法從 UI 產生） |
| FR-005 | AI 供應商抽象與降級 | P0 | 部分（`/api/analyze` 繞過抽象層） |
| FR-006 | 反代答設計 | P0 | 未實作（現有代答型流程待移除） |
| FR-007 | 匿名使用與一鍵刪除 | P0 | 部分（需假登入、刪除不完整） |
| FR-008 | 資料使用告知 | P0 | 部分（文案與資料流不符） |
| FR-009 | 自動化測試 | P0 | 未實作 |
| FR-010 | 雙語介面 | P1 | 已實作 |
| FR-011 | BYOK key 設定與驗證 | P1 | 已實作 |
| FR-012 | 免費額度與付費牆 | P1 | 部分（不實際限制） |
| FR-013 | 履歷／職缺解析 | P1 | 未實作 |
| FR-014 | STAR 素材卡 | P1 | 未實作 |
| FR-015 | 語音作答逐字稿 | P1 | 未實作 |
| FR-016 | 前後版本比較 | P1 | 未實作 |
| FR-017 | 計時器、鏡頭預覽、自評 | P2 | 已實作 |
| FR-018 | 個人使用統計 | P2 | 已實作 |
| FR-019 | 帳號系統 | P2 | 部分（假登入） |
| FR-020 | 訂閱金流 | P2 | 未實作 |
| FR-021 | 校園／企業後台 | P2 | 未實作 |

## Deterministic checks（2026-11-16，`master` @ `53a79b2`，Node v26.13.1）

| Command | Exit | Evidence |
|---|---:|---|
| `npm ci` | 0 | 安裝完成 |
| `npm run lint` | 0 | No ESLint warnings or errors |
| `npx tsc --noEmit` | 0 | 無型別錯誤（`strict: false`） |
| `npm run build` | 0 | 15 routes 建置完成 |
| `bash scripts/verify-mvp.sh http://localhost:<port>` | 0 | 本機 `next start` 下 8 passed／0 failed（Mock 模式 start／answer 回 `mode:"mock"`） |
| `npm test`／`npm run typecheck`／`npm run e2e` | — | 尚未配置 |
| GitHub Actions「Deploy to GitHub Pages」 | failure | 最近 5 次 run（最後一次 2026-09-05）皆失敗 |
| Vercel production | 未驗證 | 本次未檢查正式環境 |

## 已知問題（摘要，詳見 SPEC §12）

- web `/interview` 語音聆聽 → 自動建議答案 → 朗讀；Chrome 擴充功能在 Zoom／Teams／Meet／Webex／Slack 運作：與「不做代答」定位衝突。
- 無 API key 時 UI 無法完成模擬面試；主要頁面要求假登入。
- 一鍵刪除未清除 API key 與報告；同意文案稱資料不送伺服器，與實際不符。
- `/interview` 讀取 `/api/analyze` 回應的欄位路徑錯誤（依程式閱讀，未以真實 key 實測）。
- 憑證掃描：目前與歷史 commit 中的 `sk-` 字串皆為 `sk-xxxx` 類佔位符；`.env.local.example` 為佔位值；未發現真實憑證或個資。

## 下一步

1. Sean 確認 SPEC §13 待確認事項（尤其 Chrome 擴充功能處置、`/api/analyze` 去留）。
2. 依 `GOAL.md` 開始 M1 開發。
