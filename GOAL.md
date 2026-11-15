# Goal — AI 面試演練與複盤 M1

## Objective

在不呼叫任何付費 AI API、不接觸真實個資、不涉及真實金流的前提下，把現有程式整理成一個**可自動化測試、無面試代答風險、AI 供應商可替換**的文字模擬面試閉環：使用者不需 API key、不需註冊，即可在 Mock 模式完成「開始 → 5 題作答 → 逐題評分 → 結束 → 複盤報告」。

Notion「上市前要補」三項在 M1 的落點：

- 補測試 → AC-001、AC-006，並貫穿所有 AC。
- 接真實 AI 取代假資料 → M1 只做到「可替換的介面 + Mock／假 HTTP provider 驗證」（AC-002、AC-003）；正式付費 API 呼叫屬 M2。
- 題庫與評分 → AC-004、AC-005。

## Acceptance criteria

- AC-001：測試與型別檢查基礎建設。`package.json` 新增 `typecheck`、`test`、`e2e` scripts（工具由 Developer 選定，例如 Vitest、Playwright），且 `npm run lint`、`npm run typecheck`、`npm test`、`npm run build` 全部 exit 0。
  - 驗證：依序執行上述四個指令並記錄 exit code 於 `STATUS.md`。

- AC-002：AI 呼叫統一經可替換介面。所有 AI 相關 API route（`/api/interview/*`，以及 `/api/analyze` 若保留）只透過 `LlmProvider` 取得結果，不在 route 內直接呼叫外部 AI 端點；provider 由單一工廠／router 依設定選擇。同一組契約測試對 `MockProvider` 與「以攔截 `fetch` 回應的假 HTTP provider」皆通過（回傳結構符合 `app/lib/llm/types.ts`）。
  - 驗證：`npm test` 中的 provider 契約測試通過；`grep -rn "api.openai.com" app/api` 無結果（外部端點只能出現在 `app/lib/llm/` 的 provider 檔案）。

- AC-003：降級與錯誤處理可測。以假 `fetch` 模擬：timeout、429、500／502／503／504 → 重試至多 1 次後降級 Mock，回應含 `degraded: true` 與 `degradedReason`；401／403 → 不降級，API 回 `OPENAI_AUTH_FAILED`。連續失敗的冷卻機制改為在伺服器端也能生效（或移除並更新文件），並有測試覆蓋。測試全程不得發出真實網路請求（測試 setup 中對非 localhost 的 `fetch` 一律拋錯）。
  - 驗證：`npm test` 中降級與錯誤處理測試通過；測試 setup 的網路阻擋機制有一條自我測試（呼叫外部 URL 必定失敗）。

- AC-004：題庫單一來源與 schema 驗證。`app/interview/components/questionBank.ts` 與 `mock-provider.ts` 內的職務／職級題目整合為單一題庫資料來源；每題具備唯一 `id`、合法 `type`、`language`（zh／en），職務題另有 `jobType`、`jobLevel`；題數不少於現有 46 題通用題 + 60 題職務題。
  - 驗證：`npm test` 中題庫 schema 測試通過（檢查 id 唯一、欄位合法、題數下限、每個職務 × 職級至少 5 題）。

- AC-005：評分 rubric 明文化且可重現。Mock 評分改為依文件化 rubric（至少包含：STAR 四要素是否出現、是否含量化數字、長度區間）計算 5 維分數；同一輸入必得相同輸出；空白回答得 0 分且回饋不捏造任何經歷；回饋分為 `evidence`（從回答中可觀察到的事實，如偵測到的數字、STAR 要素）與 `suggestions`（建議）兩個欄位，報告頁分開顯示。rubric 說明寫入 `PRD/SPEC.md` 或專屬文件。
  - 驗證：`npm test` 中以至少 5 則虛構答案 fixture（空白、極短、無量化、完整 STAR、含數字）斷言分數區間、確定性與 `evidence` 內容；E2E 斷言報告頁同時出現「可觀察證據」與「建議」區塊。

- AC-006：無 key、無登入的 UI 練習閉環。清空 localStorage 的瀏覽器中，從 `/interview` 可選擇職務與職級並開始模擬面試（呼叫 `/api/interview/start`），逐題作答 5 題、每題顯示分數與回饋、結束後導向 `/report/[id]` 顯示總分、雷達圖與逐題回饋，並可匯出 Markdown；全程不出現登入牆、不要求 API key。
  - 驗證：`npm run e2e`（Playwright 或同等）中的閉環測試通過；測試攔截所有非 localhost 請求並斷言次數為 0。

- AC-007：移除面試代答型流程。web 端不再提供「語音聆聽題目 → 自動產生建議答案 → 朗讀答案」；不再有產生「下一句可以怎麼接」或替使用者撰寫答案的功能（若保留 `/api/analyze`，只能回傳答題結構提示且每則含「請用自己的話」）。Chrome 擴充功能檔案不得出現在 `public/`（即不隨 web 部署發佈）；擴充功能原始檔與 zip 的最終處置（刪除或封存）依 Sean 決定。
  - 驗證：E2E 斷言 `/interview` 無「語音聆聽」自動答案按鈕與「朗讀答案」按鈕；`git ls-files public | grep -E "manifest.json|sidePanel|content.js|background.js|popup"` 無結果；`npm test` 中若 `/api/analyze` 仍存在，斷言其回應不含完整答案段落且含「請用自己的話」。

- AC-008：一鍵刪除完整。設定頁「刪除資料」會清除本產品在 localStorage 的全部 key（或先將所有 key 統一為 `aiia.` 前綴再清除），包含 API key、練習 session、報告、使用統計與歷史（介面語系偏好可保留）；刪除後頁面顯示「已刪除」，Demo 模式標示正確反映「無 key」狀態。
  - 驗證：E2E 先寫入一組虛構的各類 key（如 `apikey_test`、`report_test`、`interview_session_test`、`usage_test`、`aiia.session`），點擊 `delete-session-btn` 後斷言上述 key 全部不存在。

- AC-009：同意文案與實際資料流一致。首次進入的同意 modal 明確說明：Mock 模式資料只存在本機瀏覽器；若使用自備 API key，題目、回答與 key 會經本站伺服器轉送給 AI 供應商；不會在伺服器保存回答。README 對應段落同步修正。
  - 驗證：E2E 斷言 modal 文字包含上述三個要點的關鍵句；`grep -n "不上 server\|不送伺服器" README.md app/components/session-init.tsx` 無結果。

- AC-010：文件、證據與憑證衛生。`SOP.md` 列出的每個指令皆可執行並在 `STATUS.md` 記錄 exit code；repo 中不得新增任何真實憑證或個資，測試 fixture 只用明顯虛構資料；`git diff --check` 通過。
  - 驗證：`git diff --check` exit 0；`git grep -nE "sk-[A-Za-z0-9_-]{20,}|sk_live|pk_live" -- . ':!*lock*'` 除 `sk-xxxx` 類佔位字串外無結果；人工覆核 fixture。

## Out of scope

- 任何正式付費 AI API 呼叫（含在 CI 或測試中使用真實 OpenAI 或其他供應商 key）；正式 provider 的接入、成本量測與額度設定屬 M2。
- 真實金流與訂閱（Stripe 等，含測試模式）、付費牆實際阻擋使用。
- 真實帳號系統（Clerk 或其他）、雲端資料庫、跨裝置同步。
- 真實個資：真實履歷、真實錄音、真實面試逐字稿、真實客戶或學校資料。
- 履歷／職缺上傳與解析、STAR 素材卡、語音作答錄音與逐字稿、前後版本比較（M2）。
- 校園／企業管理後台（M3）。
- Chrome 擴充功能的任何新功能。
- Production 部署、Vercel／GitHub Pages 設定修正、網域變更（需另行人審）。

## Exit gate

M1 完成前需由 Sean 覆審 scope 與 AC-007 的擴充功能處置決定，並以同一個 commit 重跑 `npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、`npm run e2e`、`git diff --check` 全部 exit 0，證據寫入 `STATUS.md`。測試必須證明零真實外部網路呼叫。未通過不得接入正式 AI API、金流或任何真實個資，也不得進行 production release。
