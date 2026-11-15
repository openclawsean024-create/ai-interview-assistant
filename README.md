# AI 面試演練與複盤（AI Interview Assistant）

> 繁中、面試前演練 + 面試後證據化複盤。**不做面試進行中的即時代答**。
> 規格：[`PRD/SPEC.md`](PRD/SPEC.md)｜目前里程碑：[`GOAL.md`](GOAL.md)（M1）｜驗證流程：[`SOP.md`](SOP.md)｜現況與證據：[`STATUS.md`](STATUS.md)

## 這個產品做什麼

- **模擬面試**：選擇職務與職級 → 5 題文字作答 → 每題顯示分數、可觀察證據與建議 → 結束後產生複盤報告（總分、5 維雷達圖、逐題回饋，可匯出 Markdown）。
- **題庫**：單一題庫（通用題 + 職務 × 職級題），可依題型、語言、職務、職級篩選；只提供題目與答題提示，不產生示範答案。
- **預設 Mock 模式**：不需要 API key、不需要註冊或登入即可完成一次完整練習。評分依明文 rubric（[`PRD/RUBRIC.md`](PRD/RUBRIC.md)），同樣的回答必得同樣的分數。
- **自備 API key（選填）**：在設定頁貼上自己的 OpenAI key 後，出題與評分改由 AI 供應商處理；失敗時自動降級回 Mock 並標示。

### 不做的事

- 不聆聽真實面試、不在面試中產生或朗讀答案、不提供「下一句可以怎麼接」。
- 不做錄取預測或人格評斷，不宣稱提升錄取率。
- M1 不接正式付費 AI API、不做真實帳號與金流。

## 資料流與隱私

| 模式 | 資料存在哪裡 | 會送到哪裡 |
|---|---|---|
| Mock 模式（預設） | 練習資料只存在本機瀏覽器（localStorage 的 `aiia.*` key） | 作答內容會送到本站伺服器即時評分，不會轉送給任何 AI 供應商 |
| 自備 API key | 同上；key 也存在本機瀏覽器（`aiia.byok.apiKey`） | 題目、回答與 key 會經本站伺服器轉送給 AI 供應商（OpenAI） |

- 本站不會在伺服器保存回答、報告或 API key。
- 設定頁的「刪除資料」會清除本產品在這個瀏覽器的全部資料（API key、練習 session、報告、使用統計與歷史），只保留介面語系偏好。
- 首次進入時的同意說明與上表一致；修改資料流時必須同步修改同意文案（`app/components/session-init.tsx`）與本段。

## Quick Start

```bash
npm ci
npm run dev        # http://localhost:3000
```

不需要任何環境變數。完整驗證指令見 [`SOP.md`](SOP.md)：

```bash
npm run lint
npm run typecheck
npm test           # Vitest：單元與契約測試（零真實網路請求）
npm run build
npm run e2e        # Playwright：無 key、無登入的練習閉環
```

## Pages

| Route | 說明 | 需要登入 |
|---|---|---|
| `/` | Landing | 否 |
| `/interview` | 開始模擬面試、瀏覽題庫、練習工具（計時器、鏡頭預覽、自評） | 否 |
| `/interview/[sessionId]` | 逐題作答與即時評分 | 否 |
| `/report/[id]` | 複盤報告、匯出 Markdown | 否 |
| `/settings` | 選填 API key、額度、練習紀錄、一鍵刪除 | 否 |
| `/dashboard` | 練習紀錄與統計 | 否 |
| `/pricing` | 靜態方案說明（尚無金流） | 否 |
| `/sign-in` `/sign-up` `/login` `/register` | localStorage 假登入（示意用，主要流程不需要） | — |

## Architecture

```
Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
app/lib/llm/         LlmProvider 介面、router（單一工廠、重試、降級、冷卻）、Mock／BYOK provider
app/lib/questions/   單一題庫與 schema 驗證
app/lib/scoring/     rubric 評分（純函式）
app/lib/practice/    模擬面試的瀏覽器端資料模型
app/lib/storage/     localStorage key 規則與一鍵刪除
app/lib/session/     匿名 session、同意、免費額度計數
tests/               Vitest 單元／契約測試（測試名稱標 AC 編號）
e2e/                 Playwright E2E
```

API routes（全部只透過 `LlmProvider` 取得結果，route 內不直接呼叫外部 AI 端點）：

- `POST /api/interview/start` — 開始 5 題模擬面試
- `POST /api/interview/answer` — 評分一題並回傳下一題；回饋分為 `evidence` 與 `suggestions`
- `POST /api/interview/end` — 產生複盤報告
- `POST /api/test-key` — 驗證使用者自備的 key

## Chrome 擴充功能

舊版 Chrome 擴充功能（在會議軟體中聆聽題目、產生並朗讀答案）屬於「面試中即時代答」型態，與本產品定位衝突，已在 M1 從本 repo 移除，原檔案未經修改封存於 private、archived（唯讀）的 [`openclawsean024-create/ai-interview-assistant-chrome-extension`](https://github.com/openclawsean024-create/ai-interview-assistant-chrome-extension)。它不隨網站部署、不再維護，請勿安裝或散布。

## Deployment

M1 不包含 production 部署與部署設定變更。Vercel 正式網址與 GitHub Pages workflow 的狀態見 `STATUS.md` 與 `PRD/SPEC.md` §13。

## License

MIT
