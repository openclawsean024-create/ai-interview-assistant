# AI 面試演練與複盤 — 產品需求規格書（PRD）v4.0

> 版本：v4.0（文件重建）｜更新日期：2026-11-16｜Repo：`openclawsean024-create/ai-interview-assistant`（預設分支 `master`）
> 商業依據：Notion 資料庫「可產品化商品」中「AI 面試演練與複盤」一列（唯一商業依據）。
> 程式依據：本文件「實作狀態」一律以 `master` @ `53a79b2` 的實際程式碼為準；v3.0 SPEC、README、CHANGELOG 與程式不一致之處列於 §12。
> v3.0 的 sweet-spot 評分、訪談 SOP、失敗模式 playbook 等研究內容不再逐字保留，需查閱請看 git 歷史（commit `53a79b2` 之前的 `PRD/SPEC.md`）。

---

## 0. Notion 商品資料對照

| 欄位 | 值 |
|---|---|
| 產品名稱 | AI 面試演練與複盤 |
| 優先順序 | P3 |
| 開發順位 | 第 9 個 |
| 主 repo | `openclawsean024-create/ai-interview-assistant` |
| 要併入的 repo | 無（單一 repo） |
| 獲利潛力 | 中 |
| 獲利模式 | 免費增值、SaaS 訂閱 |
| 目標客群 | 求職者、大學就業輔導處、企業招募 |
| 現況完成度 | 50 |
| 上市前要補 | 補測試、接真實 AI 取代假資料、題庫與評分 |
| 主要風險 | 需避免被當作面試代答工具；AI 成本 |

### 0.1 合併清單

無。本產品為單一 repo，沒有要併入的其他 repo。

---

## 1. 問題

1. 求職者在面試前缺少「能重複練習、且回饋可檢查」的演練環境；朋友陪練不易安排，通用聊天機器人的回饋常是無依據的總分或空泛建議。
2. 面試後缺少結構化複盤：回答是否符合 STAR、是否有量化成果、哪一題最弱、這次和上次比有沒有進步，都沒有被記錄下來。
3. 大學就業輔導處需要可規模化的模擬面試，但真人輔導員時數有限，也需要聚合（非個人隱私）層級的成效報告。
4. 企業招募端若要提供候選人練習工具，必須確保工具不會被當成「面試中即時代答」的作弊工具，也不能變成錄取預測或人格評斷。

本產品的定位：**面試前演練 + 面試後證據化複盤**。不做面試進行中的隱藏式即時代答。

---

## 2. 目標客群

| 客群 | 角色 | 核心任務 | 付費者 |
|---|---|---|---|
| 求職者（主要） | 轉職白領、應屆畢業生、中英文面試緊張者 | 依職缺練題、取得可檢查的回饋、追蹤進步 | 個人（免費增值 → Pro 訂閱） |
| 大學就業輔導處 | 職涯輔導員、承辦人 | 讓學生在輔導前先自練，取得聚合成效報告 | 學校（校園授權，SaaS 訂閱） |
| 企業招募 | HR、招募團隊 | 提供候選人面試前練習資源、雇主品牌 | 企業（SaaS 訂閱）；**不得用於篩選或評斷候選人** |

---

## 3. 獲利模式

依 Notion：**免費增值 + SaaS 訂閱**。

| 方案 | 內容（草案） | 價格 |
|---|---|---|
| 免費 | 有限次數文字模擬面試與複盤報告（程式目前額度常數為 3 次，見 `app/lib/session/quota.ts`） | 免費 |
| 求職 Pro | 更多練習次數、職缺客製題目、語音作答複盤 | 待確認（v3.0 草案為 NT$199/月，僅為內部假設，未經市場驗證） |
| 校園授權 | 多名學生帳號、聚合報告 | 待確認（v3.0 草案為 NT$3,000/月，未經驗證） |
| 企業招募 | 候選人練習入口、品牌客製 | 待確認 |

AI 成本是 Notion 列出的主要風險之一：訂閱價格必須在 M2 以實測的每次練習 AI 成本反推，不得沿用未驗證草案價。

---

## 4. 競品與差異

> 以下競品名稱沿用 v3.0 SPEC 的清單；其使用者數、價格與功能細節**本次未重新查證，一律標「待確認」**，不得作為對外宣稱。

| 競品 | 類型 | 公開規模／價格 | 本產品不追趕的地方 |
|---|---|---|---|
| Final Round AI | 面試 AI 助理（含面試中即時輔助） | 待確認（v3.0 曾引用「約 1,000 萬使用者」，無可靠出處） | 面試中即時代答（本產品明確不做） |
| Yoodli | 口說／簡報練習 | 待確認 | 英文口說教練廣度 |
| Google Interview Warmup | 免費面試練習 | 待確認 | 免費題庫廣度 |
| Interview Cake | 程式面試題庫 | 待確認 | 演算法題庫深度 |

**差異化（待驗證假設）**

1. 繁體中文、台灣職場情境、中英混用的題庫與回饋。
2. 回饋區分「可觀察證據」（例如回答中是否出現量化數字、STAR 要素）與「AI 推論／建議」，不只給單一總分。
3. 明確的反作弊立場：只做面試前練習與面試後複盤，可作為學校與企業可以放心推薦的工具。
4. AI 供應商可替換、預設 Mock，降低 AI 成本風險。

---

## 5. 現況實作盤點（以程式為準，`master` @ `53a79b2`）

**技術棧**：Next.js 14.2.5（App Router）、React 18、TypeScript 5、Tailwind CSS 3、ESLint（`next/core-web-vitals`）。`openai`、`@clerk/nextjs` 有安裝但未被主要流程使用（AI 呼叫以 `fetch` 直打 OpenAI REST；登入為 localStorage 假帳號）。無資料庫，所有使用者資料存在瀏覽器 localStorage。無任何自動化測試。

| 區塊 | 實際檔案 | 實際行為 |
|---|---|---|
| Landing | `app/page.tsx` | 行銷頁，含 v3.0 banner 與比較表 |
| 練習頁 | `app/interview/page.tsx` | 需先「登入」（假帳號）。兩個分頁：①「練習」：輸入或語音聆聽一個面試問題 → 呼叫 `/api/analyze` 取得**建議答案**、參考連結、「下一句可以怎麼接」，並可 TTS 朗讀答案；②「題庫」：46 題（technical 18 / behavioral 11 / situational 9 / system-design 8；zh 20 / en 26）可依類型與語言篩選。側欄工具：計時器、鏡頭預覽、自評表 |
| 模擬面試 session | `app/interview/[sessionId]/page.tsx` | 讀 localStorage `interview_session_<id>` 逐題作答、呼叫 `/api/interview/answer`、`/api/interview/end` 並產生報告。**沒有任何 UI 會建立這個 session**（不呼叫 `/api/interview/start`），且送出時要求已設定 API key，因此 Mock 模式下此流程無法從 UI 走通 |
| 報告 | `app/report/[id]/page.tsx` | 讀 localStorage `report_<id>`，顯示總分、5 維雷達圖、優點、改進點、逐題回饋，可匯出 Markdown |
| 設定 | `app/settings/page.tsx` | BYOK OpenAI key 儲存與 `/api/test-key` 驗證、語音辨識語言、TTS 速度、麥克風選擇、歷史匯出 Markdown、「一鍵刪除」`aiia.*` keys |
| Dashboard | `app/dashboard/page.tsx` | 個人使用次數統計（localStorage `usage_<userId>`） |
| 定價 | `app/pricing/page.tsx` | 靜態方案卡，CTA 連到 `/interview` 或 `/settings`，無金流 |
| 登入 | `components/auth-provider.tsx`、`app/sign-in`、`app/sign-up`、`app/login`、`app/register` | 點按鈕即建立假使用者（`demo@example.com`）寫入 localStorage；`components/clerk-provider.tsx` 存在但未掛在 layout |
| AI 抽象層 | `app/lib/llm/types.ts`、`router.ts`、`mock-provider.ts`、`byok-provider.ts` | `LlmProvider` 介面（analyze / evaluate / generateQuestion / finalReport）、Mock 與 BYOK（OpenAI `gpt-4o-mini`）實作、timeout／429／5xx 重試一次後降級 Mock、401/403 拋 `OPENAI_AUTH_FAILED`。Mock 評分依「回答字數」計算，非 rubric |
| API | `app/api/interview/{start,answer,end}`、`app/api/analyze`、`app/api/test-key` | `interview/*` 走 `LlmProvider`；`/api/analyze` 自行直呼 OpenAI（不經抽象層），無 key 時回 Mock 範本答案 |
| 匿名 session／額度 | `app/lib/session/session.ts`、`quota.ts`、`app/components/session-init.tsx` | localStorage cuid、同意 modal、3 次額度計數與 paywall modal（不實際阻擋使用） |
| i18n | `app/i18n/*` | 繁中／英文介面切換 |
| Chrome 擴充功能 | repo 根目錄與 `public/` 的 `manifest.json`、`sidePanel.*`、`content.js`、`background.js`、`popup.*`，及 `ai-interview-assistant-chrome-extension.zip` | Manifest v3「AI Interview Assistant 4.0」：在 Zoom／Teams／Meet／Webex／Slack 網域注入 content script，side panel 以麥克風即時語音轉文字、呼叫 OpenAI 生成答案並 TTS 朗讀。**此即「面試中即時代答」型態，與產品定位衝突（見 §9）** |
| 驗證腳本 | `scripts/verify-mvp.sh` | curl smoke test：首頁 200、含 v3.0、`/api/interview/start` 與 `/answer` 在無 key 時回 `mode:"mock"` |
| 部署 | `vercel.json`、`.github/workflows/deploy.yml` | GitHub Pages workflow 以 `output: 'export'` 建置；最近 5 次執行皆失敗（API routes 與靜態匯出不相容，待確認） |

---

## 6. 功能需求（FR）

狀態定義：**已實作**＝程式中可從 UI 使用且行為符合需求；**部分**＝有程式但不完整、無法從 UI 走通或與需求不符；**未實作**＝無對應程式。

| ID | 需求 | 優先 | 狀態 | 依據／缺口 |
|---|---|---|---|---|
| FR-001 | 題庫：可依題型（技術／行為／情境／系統設計）、語言（zh／en）、職務與職級篩選題目，每題含提示 | P0 | 部分 | `questionBank.ts` 46 題可依題型、語言篩選；職務／職級題目另存在 `mock-provider.ts`（4 職務 × 3 職級 × 5 題），兩份資料未整合、無 schema 驗證 |
| FR-002 | 結構化模擬面試：開始 → 逐題作答（預設 5 題）→ 結束，無 API key、無登入即可完成 | P0 | 部分 | API `start／answer／end` 在 Mock 模式可回應；UI 不會建立 session、作答需 API key、需假登入、`answer` 不回傳下一題，流程無法從 UI 走通 |
| FR-003 | 逐題評分與回饋：依明文 rubric 給 5 維分數（結構、深度、相關性、清晰度、自信），回饋區分「可觀察證據」與「建議」；空回答給 0 分且不捏造內容 | P0 | 部分 | 5 維結構與空回答 0 分已實作；Mock 分數只依字數計算，無 rubric、無證據欄位 |
| FR-004 | 複盤報告：總分、雷達圖、優點、改進點、逐題回饋，可匯出 Markdown | P0 | 部分 | `report/[id]` 已實作顯示與匯出；因 FR-002 未走通，實際無法從 UI 產生報告 |
| FR-005 | AI 供應商抽象：所有 AI 呼叫經可替換介面；預設 Mock；正式供應商失敗時降級並標示 `degraded` | P0 | 部分 | `LlmProvider` + router 已實作於 `interview/*`；`/api/analyze` 繞過抽象層直呼 OpenAI；router 的「連續失敗強制 Mock 30 分鐘」在伺服器端讀寫 `window.localStorage`，實際不生效；無測試 |
| FR-006 | 反代答設計：產品不提供「聆聽面試官提問 → 自動產生答案 → 朗讀」的面試中輔助；任何練習提示必須在練習情境、使用者主動觸發，並提醒「請用自己的話」 | P0 | 未實作 | 目前 `/interview` 語音聆聽會自動觸發建議答案並可朗讀；Chrome 擴充功能在會議網域運作。需移除或停用（見 §9） |
| FR-007 | 匿名使用與一鍵刪除：無需註冊即可練習；設定頁一鍵刪除本產品在瀏覽器中的全部資料（含 API key、報告、session、歷史） | P0 | 部分 | 匿名 cuid 已實作；但主要頁面要求假登入；一鍵刪除只清 `aiia.*`，未清 `apikey_*`、`usage_*`、`report_*`、`interview_session_*`、`history_*` 等 |
| FR-008 | 資料使用告知：首次使用顯示同意說明，文案需與實際資料流一致 | P0 | 部分 | 同意 modal 已實作；文案稱「資料只存在你的瀏覽器，不送伺服器」，但 BYOK 與 `/api/analyze` 會把題目、回答與 API key 送到本站 API 再轉送 OpenAI，文案不正確 |
| FR-009 | 自動化測試：單元測試、API 契約測試、E2E 流程測試，可在 CI 重跑 | P0 | 未實作 | 無測試檔、無 `test` script |
| FR-010 | 雙語介面（繁中／英文） | P1 | 已實作 | `app/i18n/*`、`language-switcher.tsx` |
| FR-011 | BYOK：使用者自備 AI key、可驗證 key 有效性 | P1 | 已實作 | `settings` + `/api/test-key`；key 以明文存 localStorage |
| FR-012 | 免費額度與付費牆：免費次數用完顯示升級／匯出選項，不刪除既有資料 | P1 | 部分 | 計數與 modal 已實作；未實際限制使用 |
| FR-013 | 履歷與職缺描述解析 → 產生客製題目、技能與風險清單 | P1 | 未實作 | 只有 `LlmProvider.analyze` 介面與 Mock，無路由、無 UI、無檔案上傳 |
| FR-014 | STAR 素材卡：使用者提供自己的事實，AI 只協助結構化 | P1 | 未實作 | — |
| FR-015 | 語音作答與逐字稿：使用者錄自己的回答（明示同意、可停止、可刪除），轉文字後進入同一份複盤；轉錄失敗可改貼文字 | P1 | 未實作 | 現有語音辨識是聽「題目」而非使用者回答；無錄音儲存 |
| FR-016 | 進步追蹤：同一題的前後兩次回答並排比較 | P1 | 未實作 | — |
| FR-017 | 練習輔助工具：計時器、鏡頭預覽（不錄影）、自評表 | P2 | 已實作 | `Timer.tsx`、`VideoSimulation.tsx`（僅預覽，`audio:false`、不錄製）、`RatingForm.tsx`（只存在元件 state） |
| FR-018 | 個人使用統計 | P2 | 已實作 | `dashboard/page.tsx` |
| FR-019 | 帳號系統（真實登入、跨裝置） | P2 | 部分 | 只有 localStorage 假登入；Clerk 套件未接 |
| FR-020 | 訂閱金流 | P2 | 未實作 | 定價頁為靜態 |
| FR-021 | 校園／企業管理後台：聚合報告（不顯示個人逐字內容），不提供錄取預測 | P2 | 未實作 | — |

---

## 7. 非功能需求

| 類別 | 需求 |
|---|---|
| 可測試性 | 所有 AI 呼叫可被 Mock 取代；測試中禁止真實網路呼叫；`lint`、`typecheck`、`test`、`build`、`e2e` 皆可本機與 CI 重跑 |
| 成本控制 | 預設 Mock；正式 AI 呼叫需有每次練習 token 上限、timeout（現為 30 秒）、重試上限（現為 1 次）與降級；M2 前需量測每次練習成本 |
| 效能 | 單題評分 Mock 模式即時回應；正式 AI 模式目標 p95 < 10 秒（待 M2 實測校正） |
| 可用性 | 無 API key、無註冊即可完成一次完整練習；鍵盤可操作；行動版寬度可用 |
| 安全 | 不在 repo 提交任何憑證；API key 不寫入 log；伺服器端不持久化使用者回答 |
| 可靠性 | 外部 AI 失敗時保留使用者已輸入內容並標示降級狀態 |
| 可維護性 | 單一 lockfile 政策（目前同時存在 `package-lock.json` 與 `pnpm-lock.yaml`，待確認）；題庫為單一資料來源 |

---

## 8. 資料與個資處理

### 8.1 資料清單（現況）

| 資料 | 現況存放 | 是否送出瀏覽器 | 風險 |
|---|---|---|---|
| 使用者文字回答 | localStorage（`interview_session_*`、`report_*`） | 會：送到本站 `/api/interview/*`；BYOK 時再轉送 OpenAI | 回答可能含真實姓名、公司、經歷 |
| 面試題目文字 | localStorage（`usage_*` 歷史） | 會：送到 `/api/analyze` | 低 |
| 語音 | 不儲存；由瀏覽器 Web Speech API 即時轉文字 | 依瀏覽器實作，部分瀏覽器可能送雲端辨識（待確認） | 可能錄到第三方（面試官）聲音 |
| 鏡頭畫面 | 不儲存、不上傳（僅本機預覽） | 否 | 低 |
| 履歷 | 未實作上傳 | — | M2 實作時為高敏感資料 |
| BYOK API key | localStorage 明文（`apikey_<userId>`）；Chrome 擴充功能存 `chrome.storage.sync` | 會：每次請求送到本站 API 再轉 OpenAI | key 外洩風險 |
| 匿名 session、事件 | localStorage `aiia.*`（事件保留 90 天，拒絕同意則不記錄） | 否 | 低 |

### 8.2 規則

1. **最小蒐集**：不要求真名、Email 才能練習；履歷上傳（M2）前先提供遮罩欄位（姓名、電話、Email、身分證字號、地址）並預設遮罩後才送 AI。
2. **錄音**：只錄使用者本人的練習回答；錄音前顯示用途、保存期限與停止按鈕；不得錄製面試官或第三方；預設不上傳原始音檔，只保留逐字稿（M2 決定實作方式）。
3. **履歷**：僅用於產生題目；不得用於訓練模型；保存期限與刪除方式需在上傳前告知；預設不在伺服器持久化。
4. **刪除**：使用者可一鍵刪除本產品在瀏覽器中的全部資料；若 M3 有雲端帳號，需提供帳號層級刪除。
5. **告知一致性**：同意文案必須與實際資料流一致（含「BYOK 時內容會經本站伺服器轉送 AI 供應商」）。
6. **開發與測試**：只使用明顯虛構的假資料（例如「王小明」、`test@example.com`、`0900-000-000`）；不得放入真實履歷、真實錄音或真實客戶資料。
7. 台灣《個人資料保護法》與各 AI 供應商資料使用條款的具體適用方式，**待法務確認**。

---

## 9. 法規與風險

| 風險 | 說明 | 處置 |
|---|---|---|
| 被當作面試代答／作弊工具（Notion 主要風險） | 現有 `/interview` 語音聆聽 → 自動產生建議答案 → TTS 朗讀，以及在 Zoom／Teams／Meet／Webex／Slack 注入的 Chrome 擴充功能，構成「面試中即時代答」型態 | **產品紅線：不得做隱藏式即時代答。** M1 必須移除或停用 web 端自動答案流程，並讓 Chrome 擴充功能不再隨 web 部署發佈（AC-007）；擴充功能最終要刪除或封存，待 Sean 決定 |
| AI 成本（Notion 主要風險） | 每次練習多次 LLM 呼叫；BYOK 把成本轉給使用者，但正式平台付費 API 需自擔 | M1 只用 Mock；M2 量測每次練習成本、設 token 上限與每日額度後才開正式 API |
| 招募用途的公平性 | 企業端若把練習分數用於篩選，可能涉及就業歧視與 AI 招募相關法規（各地規範待確認） | 產品條款禁止企業以練習結果做錄取決策；企業後台只提供聚合資料，不提供個人分數排名 |
| 錄音與第三方同意 | 錄到面試官或他人聲音 | 只錄使用者本人練習回答；錄音前同意 |
| AI 幻覺 | 建議答案捏造經歷、虛構參考連結（現有 `/api/analyze` prompt 要求 AI 給 3 個「真實」連結，無法保證） | 不提供「替你寫答案」；回饋只針對使用者自己的回答；不生成外部連結或標示未驗證 |
| 憑證外洩 | BYOK key 明文存瀏覽器並經伺服器轉送 | 不記 log；M2 評估改為伺服器端平台 key + 額度，或僅前端直連（需評估 CORS 與暴露風險） |
| 錄取保證誤導 | 行銷文案暗示提升錄取率 | 不得宣稱錄取率提升或錄取預測 |

---

## 10. 里程碑

### M1 — 可測試、無代答風險的 Mock 練習閉環（詳見 `GOAL.md`）

- 補齊測試基礎建設（unit、API 契約、E2E）與 `typecheck`／`test`／`e2e` scripts。
- 所有 AI 呼叫統一經 `LlmProvider`；以 Mock 與「攔截網路的假 HTTP provider」驗證介面、降級與錯誤處理。
- 題庫整合為單一來源並有 schema 驗證；Mock 評分改為明文、可重現的 rubric，回饋區分證據與建議。
- UI 在無 key、無登入下走通「開始 → 5 題作答 → 結束 → 報告」。
- 移除／停用代答型流程；Chrome 擴充功能不隨 web 部署。
- 一鍵刪除與同意文案與實際資料流一致。
- 對應 FR：FR-001～FR-009。

### M2 — 真實 AI 小規模試用與個人化

- 在受控環境接上正式 AI 供應商（伺服器端金鑰、token 上限、每日額度、成本記錄）；量測每次練習成本。
- FR-013 履歷／職缺解析（含遮罩）、FR-014 STAR 素材卡、FR-015 語音作答逐字稿、FR-016 前後比較。
- FR-012 免費額度實際生效。
- 以虛構或經同意的 pilot 資料驗證回饋品質。

### M3 — 商業化

- FR-019 真實帳號、FR-020 訂閱金流（先測試模式再正式）、FR-021 校園／企業聚合後台。
- 隱私權政策、服務條款（含禁止企業用於錄取決策）經法務確認。
- 正式定價依 M2 成本與試用回饋決定。

---

## 11. 成功指標

> 以下目標值為內部假設（部分沿用 v3.0 SPEC），**待 Sean 確認**；不得作為對外宣稱。

| 階段 | 指標 | 目標 |
|---|---|---|
| M1 | AC-001～AC-010 全數通過；`lint`／`typecheck`／`test`／`build`／`e2e` exit 0 | 100% |
| M1 | 測試中真實外部網路呼叫次數 | 0 |
| M2 | 試用者完成一次完整練習的比例 | ≥ 60%（假設） |
| M2 | 試用者 7 日內再次練習比例（D7） | ≥ 25%（v3.0 假設值） |
| M2 | 每次練習平均 AI 成本 | 量測後訂上限，需低於 Pro 方案單次收入的一定比例（待定） |
| M3 | 付費轉換、校園 pilot 數 | 待確認（v3.0 曾設「M6 150 註冊、30 Pro、校園 pilot 2 家」，未經驗證） |
| 全期 | 被回報為面試作弊用途的事件 | 0；出現即檢討功能 |

---

## 12. 文件與程式不一致處（以程式為準）

| # | 文件說法 | 實際程式 |
|---|---|---|
| 1 | README：所有頁面不需登入 | `/interview`、`/interview/[sessionId]`、`/settings`、`/report/[id]`、`/dashboard` 未登入時顯示登入提示（登入為 localStorage 假帳號） |
| 2 | README／v3.0 SPEC：Mock 預設，無 key 即可完整跑 3 次面試 | `/interview` 分析問題時若無 API key 直接 alert 中止；`[sessionId]` 作答需 API key；沒有 UI 呼叫 `/api/interview/start` |
| 3 | README：BYOK key「不上 server」；同意 modal：「資料不送伺服器」 | key 與題目／回答經 `x-api-key` header 或 request body 送到本站 API，再轉送 OpenAI |
| 4 | 設定頁：一鍵刪除會清除 BYOK API key | key 存在 `apikey_<userId>`，不在 `aiia.*` 範圍，不會被刪除；`DemoModeBadge` 檢查的 `aiia.byok.apiKey` 從未被寫入 |
| 5 | v3.0 SPEC／README：不做即時代答 | `/interview` 語音聆聽自動產生建議答案並可朗讀；Chrome 擴充功能在會議網域運作 |
| 6 | v3.0 SPEC §18.4：FR-001（履歷解析）對應 `/api/analyze` | `/api/analyze` 是單題「建議答案」產生器，與履歷解析無關 |
| 7 | v3.0 SPEC §18.4：FR-004（錄音轉錄）對應 `VideoSimulation.tsx` | 該元件只做鏡頭預覽，不錄音、不錄影 |
| 8 | CHANGELOG：新增 `app/lib/session/consent.ts` | 該檔不存在，consent 邏輯在 `session.ts` 與 `session-init.tsx` |
| 9 | README Production URL `ai-interview-assistant-eosin.vercel.app`；SPEC／`verify-mvp.sh` 為 `ai-interview-assistant.vercel.app` | 兩者不一致，哪一個為正式網址待確認 |
| 10 | v3.0 SPEC §19：GitHub Pages workflow 為部署閘門 | 最近 5 次 workflow run 皆為 failure |
| 11 | （程式內部）`/interview` 讀取 `data.answer` | `/api/analyze` 回傳結構為 `{ success, data: { answer } }`，依程式閱讀 BYOK 答案會顯示為空（未以真實 key 實測） |
| 12 | （程式內部）router 強制 Mock 冷卻、API routes 的 `logEvent` | 在伺服器端執行時 `window` 不存在，皆為 no-op |
| 13 | 舊 `AGENTS.md` 稱「This is NOT the Next.js you know」並要求讀 `node_modules/next/dist/docs/` | 實際為 Next.js 14.2.5，該目錄不存在；已於本次重寫 |

---

## 13. 待確認事項

1. Chrome 擴充功能：刪除、封存到獨立 repo，或改造成「僅練習模式」？（M1 至少要讓它不隨 web 發佈）
2. `/api/analyze`（單題建議答案）是否整個移除，或改為「只給答題結構提示、不給內容」？
3. 正式網址以哪一個 Vercel domain 為準；GitHub Pages 是否保留（目前持續失敗）。
4. Lockfile 政策：保留 npm 或 pnpm 其一。
5. 定價、成功指標目標值、企業招募方案內容。
6. 競品規模與價格需重新查證後才可使用。
7. repo 中的二進位檔（`AI_Interview_Assistant.pptx`、擴充功能 zip、`index.html.bak`）是否清理。
