# AI 面試助理｜繁中面試複盤與練習教練 — 規格計劃書 v3.0

> 版本：v3.0｜更新日期：2026-08-08｜維護者：Sean PRD Rewrite Specialist｜對接技術：Hermes Agent + engineering
> 文件狀態：在 v2.2.1 (sweet=5) 基礎上補實作契約；不改變 sweet-spot 評分與商業定位。
> 原始碼：https://github.com/openclawsean024-create/ai-interview-assistant
> sweet spot：5/10｜建議動作：investigate
> v3.0 相對 v2.2.1 主要差異：新增 §16「Mock + BYOK 雙模式」、§17「anonymous-first 身分模型」、§18「可量測的 MVP 完成度契約」、CHANGELOG.md。§1–§15 內容完整保留。

本文件的數字、競品與市場結論均為待驗證假設；不可把 mock、HTTP 可達性或訪談口頭意願當成營收事實。
> v3.0 實作契約（給 coding agent 用）：
> - **無外部 API key 也能跑**：Mock mode 預設啟用，可離線演示；BYOK mode 由使用者在 Settings 啟用。
> - **無註冊也能跑**：anonymous session 用 localStorage cuid；Clerk 介面保留為 P2 升級路徑。
> - **降級不丟資料**：所有 draft 寫入 localStorage 草稿層；LLM timeout/5xx 走 Mock fallback 並保留 retry 計數。
> - **單一回歸閘門**：`npm run build` 必須綠、AC-001~010 至少 8 條可手動驗證、Vercel production HTTP 200 且內容包含 v3.0 banner。
---
## 1. 產品概述 (Product Overview)

### 1.1 問題陳述 (Problem Statement)

本版完全重寫，依 2026 sweet spot 5 問體檢：5/10，建議動作為「investigate」。
市場不是沒有需求，而是現有競品 Final Round AI、Interview Cake、Google Interview Warmup 已覆蓋原本寬泛的功能。體檢找到的缺口是：即時作答有作弊風險且 Final Round AI 已有約 1,000 萬使用者；通用工具擁有規模，台灣使用者真正缺的是面試前後的可信複盤。
問題定義採「可觀察工作」而不是抽象 AI 願景：
1. 使用者目前如何完成任務。
2. 哪一步造成可量化時間或錯誤成本。
3. 既有工具為何沒有解決該一步。
4. 使用者是否願意在兩週內重複使用。
5. 團隊能否在一人維護範圍內交付。
Sweet spot 約束：不以競品缺少的「更多功能」當差異，而以單一成果、可驗證事件、明確排除項建立產品邊界。

### 1.2 目標使用者 (User Personas)

| Persona | 可觸達樣本 | 工作情境 | 主要任務 | 願付訊號 |
|---|---|---|---|---|
| Primary | 10 位 pilot | 準備轉職的台灣白領、英文或中文面試緊張者，以及需要可重複評量的校園職涯中心。 | 每週固定工作 | 願意提供真實資料並重做 |
| Secondary | 5 位 adjacent | 相鄰工具使用者 | 目前用競品或表格 | 願意切換/匯出 |
| Buyer/Influencer | 3–5 位 | 顧問、主管或校園/社群 | 替他人推薦工具 | 願意安排 demo |

### 1.3 核心價值主張 (Value Proposition)

> 「把產品從「面試中偷偷代答」改成「繁中、職缺客製、面試前演練＋面試後證據化複盤」，即時提示只保留為 opt-in 的低風險教練。」
這個主張直接回應 sweet=5：不是複製 Final Round AI、Interview Cake、Google Interview Warmup 的主功能，而是聚焦「即時作答有作弊風險且 Final Round AI 已有約 1,000 萬使用者；通用工具擁有規模，台灣使用者真正缺的是面試前後的可信複盤。」所留下的可驗證空間。
價值交換：使用者付出少量結構化輸入，換取一個可檢查、可匯出、可採取下一步的結果；系統不要求相信黑箱分數。

### 1.4 商業目標 (KPIs / OKRs)

| 期間 | 產品 KPI | 成功門檻 | 不應追逐 |
|---|---|---|---|
| Discovery 2 週 | 完成 15 次訪談 + 5 次 pilot | ≥5 人提供真實資料 | 總註冊數 |
| MVP 4 週 | 核心事件完成率 | ≥60% pilot 完成 2 次 | 功能數 |
| M6 | 付費/合作訊號 | 依本案 §15 目標 | 虛大 TAM |
| 每週 | 品質與成本 | 錯誤可追溯、成本可預測 | 模型 token 量 |

### 1.5 ⭐ Non-Goals (明確不做)

- ❌ 不做隱藏式即時代答或作弊輔助
- ❌ 不錄製面試官或第三方聲音，除非明確取得同意
- ❌ 不做求職保證、錄取預測或人格淘汰決策
- ❌ 不做企業 ATS 全面整合
- ❌ 不在 sweet=5 尚未驗證前投入原生 iOS/Android
- ❌ 不把「面試成功率提升 30%」當成未經研究的承諾
Non-Goals 執行規則：任何需求若命中以上排除項，必須寫入 decision log；sweet=2/3 專案在驗證門檻達成前不得轉成開發承諾。
---
## 2. 使用者場景與流程 (User Scenarios & Flows)

### 2.1 使用者流程圖

```mermaid
flowchart LR
  A[進入 landing] --> B[選 primary job]
  B --> C[匯入最小資料]
  C --> D[系統產生草稿/分析]
  D --> E[人工檢查與修正]
  E --> F[交付或執行下一步]
  F --> G[記錄結果與時間]
  G --> H{再次使用?}
  H -->|是| C
  H -->|否| I[訪談/退出原因]
```

流程原則：先讓使用者完成一個真實 job，再要求註冊、同步或付款。
### 2.2 關鍵用戶故事 (User Stories)

#### US-001：履歷與職缺描述解析成技能、情境與風險清單
> As a 準備轉職的台灣白領、英文或中文面試緊張者，以及需要可重複評量的校園職涯中心。
> I want 履歷與職缺描述解析成技能、情境與風險清單
> So that 我能在不改變原有工作習慣下完成一個可交付結果。

#### US-002：繁中/英文文字模擬面試，依職缺追問
> As a 準備轉職的台灣白領、英文或中文面試緊張者，以及需要可重複評量的校園職涯中心。
> I want 繁中/英文文字模擬面試，依職缺追問
> So that 我能在不改變原有工作習慣下完成一個可交付結果。

#### US-003：STAR 素材卡：使用者提供自己的事實，AI 只協助結構化
> As a 準備轉職的台灣白領、英文或中文面試緊張者，以及需要可重複評量的校園職涯中心。
> I want STAR 素材卡：使用者提供自己的事實，AI 只協助結構化
> So that 我能在不改變原有工作習慣下完成一個可交付結果。

#### US-004：錄音取得同意後的逐題轉錄與時間戳
> As a 準備轉職的台灣白領、英文或中文面試緊張者，以及需要可重複評量的校園職涯中心。
> I want 錄音取得同意後的逐題轉錄與時間戳
> So that 我能在不改變原有工作習慣下完成一個可交付結果。

#### US-005：面試後回饋：內容證據、語速、停頓、STAR 完整度
> As a 準備轉職的台灣白領、英文或中文面試緊張者，以及需要可重複評量的校園職涯中心。
> I want 面試後回饋：內容證據、語速、停頓、STAR 完整度
> So that 我能在不改變原有工作習慣下完成一個可交付結果。

#### US-006：每次練習可比較前後版本，不做單一總分崇拜
> As a 準備轉職的台灣白領、英文或中文面試緊張者，以及需要可重複評量的校園職涯中心。
> I want 每次練習可比較前後版本，不做單一總分崇拜
> So that 我能在不改變原有工作習慣下完成一個可交付結果。

#### US-007：敏感資訊遮罩與一鍵刪除
> As a 準備轉職的台灣白領、英文或中文面試緊張者，以及需要可重複評量的校園職涯中心。
> I want 敏感資訊遮罩與一鍵刪除
> So that 我能在不改變原有工作習慣下完成一個可交付結果。

### 2.3 邊界場景 (Edge Cases)

- 輸入資料不完整：顯示缺漏欄位與可繼續的最小路徑。
- 使用者不同意保存：只在 session memory 運作，離開即清除。
- 外部服務逾時：保留草稿、顯示狀態、允許重試且去重。
- 使用者不採用建議：記錄 reject reason，不把拒絕視為錯誤。
- 同一事件重複送出：以 idempotency key 防止重複產生。
- 低網速或手機畫面：文字流程可完成核心 job。
- 敏感資料誤匯入：提供欄位遮罩與立即刪除。
- 輸出不符格式：先顯示 validation findings，不直接交付。

### 2.4 Service Blueprint（前台/後台/證據）

| 階段 | 使用者看到 | 系統做什麼 | 品質證據 |
|---|---|---|---|
| 取得 | 一個清楚 CTA | 建立匿名 session | event timestamp |
| 準備 | 欄位與限制 | 驗證格式/權限 | validation log |
| 生成 | 草稿與進度 | 呼叫 adapter 或 mock | model/cost metadata |
| 核准 | 差異與風險 | 鎖定版本 | approval event |
| 回顧 | 成果與 ROI | 計算前後差異 | exportable report |
---
## 3. 功能性需求 (Functional Requirements)

### 3.1 MVP（必做，P0；sweet-spot redefinition）

本 MVP 由 sweet=5 重新定義：只保留「把產品從「面試中偷偷代答」改成「繁中、職缺客製、面試前演練＋面試後證據化複盤」，即時提示只保留為 opt-in 的低風險教練。」所需的最短閉環，不做競品已主導的廣泛功能。
#### FR-001：履歷與職缺描述解析成技能、情境與風險清單（MUST）
- 目的：將 履歷與職缺描述解析成技能、情境與風險清單 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

#### FR-002：繁中/英文文字模擬面試，依職缺追問（MUST）
- 目的：將 繁中/英文文字模擬面試，依職缺追問 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

#### FR-003：STAR 素材卡：使用者提供自己的事實，AI 只協助結構化（MUST）
- 目的：將 STAR 素材卡：使用者提供自己的事實，AI 只協助結構化 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

#### FR-004：錄音取得同意後的逐題轉錄與時間戳（MUST）
- 目的：將 錄音取得同意後的逐題轉錄與時間戳 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

#### FR-005：面試後回饋：內容證據、語速、停頓、STAR 完整度（MUST）
- 目的：將 面試後回饋：內容證據、語速、停頓、STAR 完整度 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

#### FR-006：每次練習可比較前後版本，不做單一總分崇拜（MUST）
- 目的：將 每次練習可比較前後版本，不做單一總分崇拜 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

#### FR-007：敏感資訊遮罩與一鍵刪除（MUST）
- 目的：將 敏感資訊遮罩與一鍵刪除 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

#### FR-008：低延遲教練提示開關，預設關閉並顯示使用規範（MUST）
- 目的：將 低延遲教練提示開關，預設關閉並顯示使用規範 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

#### FR-009：免費 3 次練習與付費試用牆（MUST）
- 目的：將 免費 3 次練習與付費試用牆 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

#### FR-010：無障礙鍵盤流程與文字 fallback（MUST）
- 目的：將 無障礙鍵盤流程與文字 fallback 變成可測試的最小行為。
- 輸入：使用者提供的最小必要資料；不得默認補造關鍵事實。
- 輸出：可讀、可修改、可匯出並帶版本/時間戳的結果。
- 失敗：保留草稿、顯示可理解錯誤與下一步。

### 3.2 v2（加值，P1）

- P1-01 Chrome side panel 的明示式提示（不自動代答）：只有在 MVP 指標達標且有 3 個以上相同請求時排入。
- P1-02 職能題庫與面試官風格設定：只有在 MVP 指標達標且有 3 個以上相同請求時排入。
- P1-03 校園中心 cohort dashboard（只看聚合資料）：只有在 MVP 指標達標且有 3 個以上相同請求時排入。
- P1-04 英文口說與中文口音校正：只有在 MVP 指標達標且有 3 個以上相同請求時排入。
- P1-05 教練/顧問邀請連結：只有在 MVP 指標達標且有 3 個以上相同請求時排入。
- P1-06 Stripe 訂閱與學校授權：只有在 MVP 指標達標且有 3 個以上相同請求時排入。

### 3.3 v3（探索，P2）

- P2-01 企業內訓評量 API：不承諾時程，需重新檢查競品與合規。
- P2-02 多語言華人市場：不承諾時程，需重新檢查競品與合規。
- P2-03 真人教練 review marketplace：不承諾時程，需重新檢查競品與合規。
- P2-04 匿名化能力基準：不承諾時程，需重新檢查競品與合規。

### 3.4 ⭐ Acceptance Criteria (Given / When / Then)

**AC-001：上傳 PDF 與 JD 後 30 秒內產生可編輯的 10–20 題清單**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「上傳 PDF 與 JD 後 30 秒內產生可編輯的 10–20 題清單」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 若失敗則提供降級路徑，不遺失已輸入資料。

**AC-002：每題至少有一個與履歷事實對應的追問**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「每題至少有一個與履歷事實對應的追問」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 使用者可檢查、修改或匯出結果，不被黑箱鎖定。

**AC-003：沒有使用者事實時，系統不可捏造工作經驗**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「沒有使用者事實時，系統不可捏造工作經驗」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 若失敗則提供降級路徑，不遺失已輸入資料。

**AC-004：錄音前顯示同意、用途、保存期限與停止按鈕**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「錄音前顯示同意、用途、保存期限與停止按鈕」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 使用者可檢查、修改或匯出結果，不被黑箱鎖定。

**AC-005：轉錄失敗時可貼上文字完成同一份複盤**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「轉錄失敗時可貼上文字完成同一份複盤」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 若失敗則提供降級路徑，不遺失已輸入資料。

**AC-006：回饋中區分可觀察證據與 AI 推論**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「回饋中區分可觀察證據與 AI 推論」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 使用者可檢查、修改或匯出結果，不被黑箱鎖定。

**AC-007：使用者可刪除單次 session 及所有音檔/轉錄**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「使用者可刪除單次 session 及所有音檔/轉錄」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 若失敗則提供降級路徑，不遺失已輸入資料。

**AC-008：即時教練預設關閉，開啟時每則提示含「請用自己的話」**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「即時教練預設關閉，開啟時每則提示含「請用自己的話」」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 使用者可檢查、修改或匯出結果，不被黑箱鎖定。

**AC-009：同一題的兩次答案可並排比較**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「同一題的兩次答案可並排比較」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 若失敗則提供降級路徑，不遺失已輸入資料。

**AC-010：免費額度到期後不會刪除既有資料**
- **Given** 使用者進入對應流程且權限有效
- **When** 執行「免費額度到期後不會刪除既有資料」
- **Then** 系統產生可驗證結果，並寫入事件時間、版本與錯誤狀態。
- **And** 使用者可檢查、修改或匯出結果，不被黑箱鎖定。

### 3.5 優先級與排除閘門

| 需求類型 | 進入條件 | 退出條件 | Owner |
|---|---|---|---|
| P0 | 核心 job 可重做 | 連續 2 sprint 通過 AC | CPO/CTO |
| P1 | 至少 3 位付費用戶要求 | 成本與資安 review 通過 | 產品 |
| P2 | 有新市場證據 | 獨立 discovery brief | 研究 |
| Rejected | 命中 Non-Goals 或無證據 | 不得進 backlog | 全員 |
---
## 4. 系統設計 (System Design)

### 4.1 技術棧 (Tech Stack)

| 層 | 技術 | 選擇理由 | 替代/退出條件 |
|---|---|---|---|
| 前端 | Next.js/React/TypeScript | 快速交付與可測試元件 | 需求超過 web 才評估 native |
| 樣式 | Tailwind + accessible primitives | 一致、鍵盤可用 | 不引入大型 design system |
| 資料 | IndexedDB 或 Postgres 依 scope | 敏感資料最小化 | 需同步才啟用雲端 |
| AI/規則 | Provider adapter + schema validation | 可替換、可 mock | 不可接受的成本/品質即切模型 |
| 任務 | Server action/queue | 保留 idempotency | 長任務才引入 queue |
| 觀測 | Sentry + structured events | 追錯與衡量轉換 | 不收集不必要個資 |
| 部署 | Vercel + managed DB（v2） | 單人維運低負擔 | 成本超過 MRR 20% 需檢討 |

### 4.2 系統架構圖 (Mermaid)

```mermaid
flowchart TB
  UI[Browser UI] --> V[Validation + consent]
  V --> Store[(Local/Server Store)]
  V --> Orchestrator[Job Orchestrator]
  Orchestrator --> Adapter[Provider Adapter or Mock]
  Adapter --> Guard[Safety + schema guard]
  Guard --> Draft[Draft/Artifact]
  Draft --> Approval[Human approval]
  Approval --> Export[Export/next action]
  Store --> Audit[Audit + metrics]
  Adapter -. failure .-> Fallback[Deterministic fallback]
```

架構邊界：MVP 不把外部 connector、付款、多人權限放進核心 request path。
### 4.3 資料模型 (Prisma / localStorage schema)

```prisma
model Candidateprofile {
  id        String   @id @default(cuid())
  ownerId   String?
  status    String   @default("active")
  payload   Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, createdAt])
}

model Jobdescription {
  id        String   @id @default(cuid())
  ownerId   String?
  status    String   @default("active")
  payload   Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, createdAt])
}

model Practicesession {
  id        String   @id @default(cuid())
  ownerId   String?
  status    String   @default("active")
  payload   Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, createdAt])
}

model Question {
  id        String   @id @default(cuid())
  ownerId   String?
  status    String   @default("active")
  payload   Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, createdAt])
}

model Answerevidence {
  id        String   @id @default(cuid())
  ownerId   String?
  status    String   @default("active")
  payload   Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, createdAt])
}

model Transcriptsegment {
  id        String   @id @default(cuid())
  ownerId   String?
  status    String   @default("active")
  payload   Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, createdAt])
}

model Feedbackreport {
  id        String   @id @default(cuid())
  ownerId   String?
  status    String   @default("active")
  payload   Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, createdAt])
}

model Consentrecord {
  id        String   @id @default(cuid())
  ownerId   String?
  status    String   @default("active")
  payload   Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, createdAt])
}

model Planquota {
  id        String   @id @default(cuid())
  ownerId   String?
  status    String   @default("active")
  payload   Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, createdAt])
}

```

資料模型規則：payload 只存完成 job 必需欄位；敏感欄位以 Web Crypto/managed encryption 處理；刪除必須有 tombstone 或可驗證的清除結果。
### 4.4 API 規格 (REST endpoints)

| Method | Path | Auth | 用途 | 錯誤/重試 |
|---|---|---|---|---|
| POST | /api/profiles/parse | session/optional | 核心資料操作 | Zod 400；5xx exponential backoff |
| POST | /api/jobs/analyze | session/optional | 核心資料操作 | Zod 400；5xx exponential backoff |
| POST | /api/sessions | session/optional | 核心資料操作 | Zod 400；5xx exponential backoff |
| POST | /api/sessions/:id/answer | session/optional | 核心資料操作 | Zod 400；5xx exponential backoff |
| POST | /api/sessions/:id/feedback | session/optional | 核心資料操作 | Zod 400；5xx exponential backoff |
| DELETE | /api/sessions/:id | session/optional | 核心資料操作 | Zod 400；5xx exponential backoff |
| POST | /api/consents | session/optional | 核心資料操作 | Zod 400；5xx exponential backoff |
| POST | /api/stripe/checkout | session/optional | 核心資料操作 | Zod 400；5xx exponential backoff |

### 4.5 事件與資料生命週期

- `session_started`：只記錄必要 metadata；禁止把完整敏感內容寫入 analytics。
- `input_validated`：只記錄必要 metadata；禁止把完整敏感內容寫入 analytics。
- `draft_created`：只記錄必要 metadata；禁止把完整敏感內容寫入 analytics。
- `human_reviewed`：只記錄必要 metadata；禁止把完整敏感內容寫入 analytics。
- `artifact_exported`：只記錄必要 metadata；禁止把完整敏感內容寫入 analytics。
- `run_failed`：只記錄必要 metadata；禁止把完整敏感內容寫入 analytics。
- `data_deleted`：只記錄必要 metadata；禁止把完整敏感內容寫入 analytics。
---
## 5. 非功能性需求 (Non-Functional Requirements)

### 5.1 性能指標

| 指標 | MVP 目標 | 量測方式 | 告警 |
|---|---|---|---|
| First contentful paint | ≤2.5s mobile | Lighthouse/field | P95 >3s |
| 核心互動 | ≤500ms local | Performance API | P95 >800ms |
| 生成/分析 | 依任務 ≤30s | server trace | P95 >45s |
| 匯出 | ≤5s / 500 records | E2E | 失敗率 >2% |
| 搜尋 | ≤500ms / 1k items | unit + browser | P95 >1s |
| 可用性 | 99% pilot window | synthetic | 連續 3 次失敗 |

### 5.2 安全與隱私

- 資料最小化：不因方便而收集完整第三方個資。
- 所有輸入在送出前顯示目的、保存期限與是否可撤回。
- 認證/授權以 ownerId、workspaceId 與 server-side check 為準。
- 匯出檔包含版本與警告，不把 secret、token 或原始音/影像混入。
- 刪除請求可由使用者觸發，備份清除期限需寫在產品政策。
- 敏感事件進 audit，但 analytics 只保留 hash/id 與量化欄位。
- 公開分享預設關閉；啟用時產生不可猜 token 並可撤銷。
- 所有外部 webhook 驗證簽章與重放保護。

### 5.3 ⭐ 降級機制 (Graceful Degradation)

| 服務 | 情境 (掛掉) | 降級策略 (切換) | 使用者訊息 |
|---|---|---|---|
| LLM provider | timeout/5xx (掛掉) | 切換到 mock/template | 草稿保留，可稍後重試 |
| 資料庫 | connection error (掛掉) | 切換到 local queue | 暫存位置與同步狀態 |
| 圖片儲存 | size/type error (掛掉) | 切換到 文字欄位 | 指出失敗檔案 |
| Auth | expired session | 重新登入 | 不丟失未送出表單 |
| 付款 | webhook mismatch | pending entitlement | 人工客服入口 |
| 排程 | missed heartbeat | 手動 queue | 顯示延遲時間 |

### 5.4 擴展性

- 核心 job 以 provider-neutral input/output contract 隔離。
- 所有長任務可恢復、重試、取消且 idempotent。
- 資料表以 owner/createdAt 索引；先量測再分區。
- P1 connector 為 adapter，不得讓外部平台 schema 污染 domain model。
- 成本、錯誤、延遲均按 workspace 追蹤，支援方案限額。
---
## 6. 完成標準 (Definition of Done)

### 6.1 v1 MVP DoD

- [ ] 本文件 §1–§13、§15 皆可對應 issue 與驗收案例。
- [ ] 所有 P0 功能至少有單元測試、錯誤測試與一條 E2E happy path。
- [ ] sweet spot 核心 job 可由 5 位外部 pilot 從空白完成到交付。
- [ ] 所有敏感資料有刪除、匯出與權限測試。
- [ ] 降級路徑能在 provider 失敗時保留輸入並給出可行下一步。
- [ ] Mobile 390px、tablet 768px、desktop 1440px 皆可完成主流程。
- [ ] Lighthouse accessibility ≥90；鍵盤、焦點與空狀態通過檢查。
- [ ] 成本、事件、版本、決策可由 maintainer 追查。
- [ ] 沒有以 mock 結果冒充真實市場或模型品質。
- [ ] 若本案 sweet=2/3，未達 §11 go/no-go 不得進入完整 v2。

### 6.2 上線閘門

- [ ] Privacy/Terms/Contact 頁面與資料刪除說明。
- [ ] 監控告警與 rollback runbook。
- [ ] 10 條 AC 在 CI 全綠。
- [ ] 5 位 pilot 明確同意回饋資料用途。
- [ ] Owner 簽署「不把 sweet spot 假設當成事實」。
---
## 7. 風險與決策

### 7.1 風險表

| 風險 | 等級 | 早期訊號 | 緩解 | 停止/轉向 |
|---|---|---|---|---|
| 即時作答被雇主視為作弊 | 🔴 | 訪談或監控出現反覆抱怨 | 限制 scope、人工核准、資料刪除與 fallback | 兩個 sprint 未改善即重新 discovery |
| Final Round AI 等規模競爭者擠壓獲客 | 🟠 | 訪談或監控出現反覆抱怨 | 限制 scope、人工核准、資料刪除與 fallback | 兩個 sprint 未改善即重新 discovery |
| 履歷與聲音屬個資，保留政策不清 | 🟡 | 訪談或監控出現反覆抱怨 | 限制 scope、人工核准、資料刪除與 fallback | 兩個 sprint 未改善即重新 discovery |
| AI 對不同口音或背景評分偏見 | 🔴 | 訪談或監控出現反覆抱怨 | 限制 scope、人工核准、資料刪除與 fallback | 兩個 sprint 未改善即重新 discovery |
| 求職是短週期場景，流失率高 | 🟠 | 訪談或監控出現反覆抱怨 | 限制 scope、人工核准、資料刪除與 fallback | 兩個 sprint 未改善即重新 discovery |
| STT/LLM 成本高於每月 NT$199 | 🟡 | 訪談或監控出現反覆抱怨 | 限制 scope、人工核准、資料刪除與 fallback | 兩個 sprint 未改善即重新 discovery |
| 練習分數與實際錄取結果相關性低 | 🔴 | 訪談或監控出現反覆抱怨 | 限制 scope、人工核准、資料刪除與 fallback | 兩個 sprint 未改善即重新 discovery |

### 7.2 ⭐ ADR (Architecture Decision Records)

本節明確記錄 sweet=5 的取捨：競品 Final Round AI、Interview Cake、Google Interview Warmup 已在原紅海取得優勢，因此每個決策都必須服務於「把產品從「面試中偷偷代答」改成「繁中、職缺客製、面試前演練＋面試後證據化複盤」，即時提示只保留為 opt-in 的低風險教練。」。
#### ADR-001
**Decision**：ADR-001：先做前後練習與複盤，非即時代答；對 sweet=5 的判斷是需求存在但信任風險不可忽略。
**Context**：sweet spot 5 問體檢顯示，追求更寬功能會增加成本而不增加證據。
**Trade-off**：短期可展示功能較少，但能測到真實 job、信任與回購。
**Reversal trigger**：若指定指標未達標，回到 discovery；若達標才允許擴充。

#### ADR-002
**Decision**：ADR-002：所有建議必須引用使用者素材；避免模型編造履歷。
**Context**：sweet spot 5 問體檢顯示，追求更寬功能會增加成本而不增加證據。
**Trade-off**：短期可展示功能較少，但能測到真實 job、信任與回購。
**Reversal trigger**：若指定指標未達標，回到 discovery；若達標才允許擴充。

#### ADR-003
**Decision**：ADR-003：錄音 opt-in、短期保存、可刪除；以個資與面試同意為產品信任核心。
**Context**：sweet spot 5 問體檢顯示，追求更寬功能會增加成本而不增加證據。
**Trade-off**：短期可展示功能較少，但能測到真實 job、信任與回購。
**Reversal trigger**：若指定指標未達標，回到 discovery；若達標才允許擴充。

#### ADR-004
**Decision**：ADR-004：以 D7 再練習率與願付訂閱作 go/no-go，而非宣稱錄取提升。
**Context**：sweet spot 5 問體檢顯示，追求更寬功能會增加成本而不增加證據。
**Trade-off**：短期可展示功能較少，但能測到真實 job、信任與回購。
**Reversal trigger**：若指定指標未達標，回到 discovery；若達標才允許擴充。

#### ADR-005：可追蹤的驗證優先
**Decision**：所有核心操作產生可匿名化的 event 與版本。
**Reason**：沒有事件就無法區分「覺得有趣」和「真的採用」。
**Consequence**：多一點資料設計成本，換取可做 go/no-go 的證據。
---
## 8. 里程碑與 Sprint 拆解

### 8.1 里程碑總覽

| 里程碑 | 期間 | 交付 | 出口條件 |
|---|---|---|---|
| M0 Discovery | 第 1 週 | 15 訪談、問題卡、競品 recheck | 5 個明確相同 job |
| M1 Prototype | 第 2 週 | 單一核心 job 可跑 | 3 位外部使用者完成 |
| M2 MVP | 第 3–4 週 | P0 + AC + fallback | 5 位 pilot 重做 |
| M3 Paid/partner test | 第 5–6 週 | 價格、landing、報表 | 達到 §11 門檻 |
| M4 Decision | 第 7 週 | go/pivot/hold memo | 不得以 sunk cost 決策 |

### 8.2 Sprint 拆解

- Day 1：確認 primary job、邀請訪談與資料同意。
- Day 2：整理競品、反需求與最小資料 schema。
- Day 3：完成單一路徑 wireframe 與 empty state。
- Day 4：建立 domain model、validation 與事件。
- Day 5：完成第一個可重做的 job。
- Day 6：加入人工檢查、版本與匯出。
- Day 7：邀請 3 位外部 pilot，記錄阻塞。
- Day 8：修正 onboarding 與錯誤訊息。
- Day 9：加入第二種真實輸入格式。
- Day 10：測試 provider failure 與本地 fallback。
- Day 11：完成權限、刪除、匯出與 privacy flow。
- Day 12：加入核心 KPI 與成本儀表板。
- Day 13：執行 5 位 pilot，逐一觀察。
- Day 14：完成 landing page、community post 與價格訪談。
- Day 15：整理結果、決定是否進入 paid pilot。

### 8.3 變更控制

- P0 變更需記錄影響的假設、成本與 AC。
- 新 connector 不能取代核心 job 的測試。
- sweet=2/3 的 v2 需求若無訪談證據，標為 parking lot。
---
## 9. 變現路徑 + 定價心理學

### 9.1 變現方案

| 方案 | 價格 | 限制/價值 | 觸發升級 |
|---|---|---|---|
| 免費：3 次文字練習與 1 份報告 | 見產品頁 | 以本案核心 job、匯出、協作或報表分層 | 完成兩次核心 job 後詢問，而非首次強 paywall |
| 求職 Pro：NT$199/月，20 次語音複盤與職缺客製 | 見產品頁 | 以本案核心 job、匯出、協作或報表分層 | 完成兩次核心 job 後詢問，而非首次強 paywall |
| 校園：NT$3,000/月，100 名學生聚合報告 | 見產品頁 | 以本案核心 job、匯出、協作或報表分層 | 完成兩次核心 job 後詢問，而非首次強 paywall |
| 顧問席位：NT$699/月，含 10 個被指導者 | 見產品頁 | 以本案核心 job、匯出、協作或報表分層 | 完成兩次核心 job 後詢問，而非首次強 paywall |

### 9.2 定價心理學

- 先賣結果/回流/風險降低，不賣 AI 次數。
- 免費層保留資料可攜，避免使用者因恐懼而註冊。
- 首個付費價格以訪談的替代成本校正，不從競品標價倒推。
- 年繳只在月繳有 3 個月留存證據後推出。
- 每一次升級 CTA 顯示「多得到什麼」，不誇大節省。
- 若 sweet score 低，採 paid pilot/一次性資料包，避免過早承諾 SaaS MRR。

### 9.3 Unit economics 假設

| 項目 | 初始假設 | 需要驗證 |
|---|---|---|
| ARPA | 依本案 prices | 付款訪談/checkout |
| CAC | 社群與轉介低成本 | 每通路追蹤 |
| LTV | 只以已觀察留存計算 | D30/D90 |
| Gross margin | 扣除 provider/儲存/人工 review | 每 job 成本 |
| Payback | ≤3 個月 | cohort report |
---
## 10. 附錄 (Appendix)

### 10.1 競品分析 (Competitive Quadrant Chart)

| 競品 | 已經做得好 | 本案不追趕的地方 | 可切入缺口 |
|---|---|---|---|
| Final Round AI | 規模/習慣/通用功能 | 紅海主功能 | 本案 wedge |
| Interview Cake | 規模/習慣/通用功能 | 紅海主功能 | 本案 wedge |
| Google Interview Warmup | 規模/習慣/通用功能 | 紅海主功能 | 本案 wedge |
| 本專案 | 把產品從「面試中偷偷代答」改成「繁中、職缺客製、面試前演練＋面試後證據化複盤」，即時提示只保留為 opt-in 的低風險教練。 | 不承諾全市場 | 需用 §11 證明 |

```mermaid
quadrantChart
    title "Sweet-spot positioning"
    x-axis "低聚焦" --> "高聚焦"
    y-axis "低可驗證" --> "高可驗證"
    quadrant-1 "可驗證 wedge"
    quadrant-2 "成熟替代"
    quadrant-3 "泛功能紅海"
    quadrant-4 "昂貴複雜"
    "Final Round AI": [0.15, 0.25]
    "Interview Cake": [0.27, 0.33]
    "Google Interview Warmup": [0.39, 0.41]
    "本專案": [0.85, 0.85]
```

圖表不是市場事實，只是定位假說；數字須由 §11 的訪談與行為資料取代。

### 10.2 術語表

- **core job**：使用者願意重複完成且可觀察的主要工作。
- **wedge**：狹窄但可進入的差異化切口。
- **artifact**：可交付、可匯出、帶版本的成果。
- **human-in-the-loop**：人工在關鍵輸出前確認。
- **fallback**：主要服務失敗時仍可完成的替代路徑。
- **pilot**：有期限、有明確任務與成功條件的外部試用。
- **D7/D30**：第 7/30 天再次使用的留存指標。
- **ARPA**：每個付費帳戶平均收入。
- **RLS**：資料列層級權限控制。
- **idempotency**：同一請求重送不造成重複副作用。
- **canon/source**：可追溯的原始資料/來源標記。
- **ROI**：投入時間或成本與可觀察產出的比較，不等於保證收益。

### 10.3 參考資料與 re-check 記錄

- Final Round AI 官方網域在本次 HTTP quick check 回應 403，不能據此宣稱服務下線；原 sweet spot 資料仍以約 1,000 萬 users 視為規模威脅。
- Interview Cake 與 Google Interview Warmup 代表題庫/練習替代，不以「有即時」單一維度作差異化。
- 原分析的三項 concerns（作弊風險、高流失、Final Round AI 規模）全部轉成 consent、D7 與分眾定位的驗證假設。
- 競品官方/公開入口以 URL 與檢查日期記錄；HTTP 403 只代表本次抓取受限，不代表下線。
- 不使用無法核驗的下載量、使用者數或收入作為 acceptance criteria。

### 10.4 Error Code 統一字典

| Code | HTTP | 訊息 | 處置 |
|---|---|---|---|
| INPUT_INVALID | 400 | 輸入格式不完整 | 指出欄位 |
| CONSENT_REQUIRED | 403 | 需要同意才可繼續 | 顯示用途 |
| NOT_FOUND | 404 | 資料不存在 | 回到列表 |
| QUOTA_EXCEEDED | 429 | 已達方案額度 | 匯出/升級 |
| PROVIDER_TIMEOUT | 504 | 外部服務逾時 | 保存草稿重試 |
| PROVIDER_FAILED | 502 | 外部服務失敗 | fallback/manual |
| LOW_CONFIDENCE | 422 | 需要人工確認 | 阻擋自動交付 |
| DUPLICATE_REQUEST | 409 | 請求已處理 | 回傳既有結果 |
| FORBIDDEN | 403 | 無權限 | 不洩漏資料 |
| EXPORT_FAILED | 500 | 匯出失敗 | 重試與客服 |
| DELETE_FAILED | 500 | 刪除未完成 | 顯示 pending |
| INTERNAL_ERROR | 500 | 系統錯誤 | trace id |

### 10.5 可攜與可存取性檢查表

- 所有核心內容可用鍵盤到達。
- 圖表有文字摘要與表格 fallback。
- 錯誤不只用顏色表達。
- CSV/JSON/Markdown 匯出有 schema version。
- 行動版不要求拖曳或 hover 才能完成。
- 語音/圖片功能都有文字替代。
- 使用者可取消長任務與清除草稿。
---
## 11. 市場驗證計畫 (Market Validation Plan) (Market Validation Plan)

本計畫由 sweet=5 與競品 Final Round AI、Interview Cake、Google Interview Warmup 反推；目的不是證明產品存在，而是證明指定 wedge「把產品從「面試中偷偷代答」改成「繁中、職缺客製、面試前演練＋面試後證據化複盤」，即時提示只保留為 opt-in 的低風險教練。」能產生重複行為與付款。
### 11.1 驗證前 3 個關鍵問題

1. **誰在最近 30 天真的遇到這個 job，且目前用什麼替代？**
   - 證據：即時作答有作弊風險且 Final Round AI 已有約 1,000 萬使用者；通用工具擁有規模，台灣使用者真正缺的是面試前後的可信複盤。
   - 通過：在 5 位 pilot 中至少 3 位給出具體最近案例。
2. **使用者願意提供哪些最小資料，完成一次 job 後是否重做？**
   - 證據：即時作答有作弊風險且 Final Round AI 已有約 1,000 萬使用者；通用工具擁有規模，台灣使用者真正缺的是面試前後的可信複盤。
   - 通過：在 5 位 pilot 中至少 3 位給出具體最近案例。
3. **哪個結果/回流/風險指標足以讓他付款，而不是只說有興趣？**
   - 證據：即時作答有作弊風險且 Final Round AI 已有約 1,000 萬使用者；通用工具擁有規模，台灣使用者真正缺的是面試前後的可信複盤。
   - 通過：在 5 位 pilot 中至少 3 位給出具體最近案例。

### 11.2 訪談 SOP（5 個具體訪談目標）

**Target 1：8 位近三個月面試 2 次以上的轉職者**
- 先問最近一次事件，不先展示功能。
- 記錄目前工具、步驟、耗時、錯誤與替代成本。
- 展示一個 5 分鐘 prototype，觀察是否主動完成下一步。
- 結束只問 willingness-to-pay 與願不願提供資料，不引導答案。

**Target 2：5 位應屆畢業生與校園職涯顧問**
- 先問最近一次事件，不先展示功能。
- 記錄目前工具、步驟、耗時、錯誤與替代成本。
- 展示一個 5 分鐘 prototype，觀察是否主動完成下一步。
- 結束只問 willingness-to-pay 與願不願提供資料，不引導答案。

**Target 3：4 位獵頭或面試教練**
- 先問最近一次事件，不先展示功能。
- 記錄目前工具、步驟、耗時、錯誤與替代成本。
- 展示一個 5 分鐘 prototype，觀察是否主動完成下一步。
- 結束只問 willingness-to-pay 與願不願提供資料，不引導答案。

**Target 4：4 位曾使用 Final Round AI 或類似工具者**
- 先問最近一次事件，不先展示功能。
- 記錄目前工具、步驟、耗時、錯誤與替代成本。
- 展示一個 5 分鐘 prototype，觀察是否主動完成下一步。
- 結束只問 willingness-to-pay 與願不願提供資料，不引導答案。

**Target 5：4 位 HR，專門討論作弊與合規邊界**
- 先問最近一次事件，不先展示功能。
- 記錄目前工具、步驟、耗時、錯誤與替代成本。
- 展示一個 5 分鐘 prototype，觀察是否主動完成下一步。
- 結束只問 willingness-to-pay 與願不願提供資料，不引導答案。

**訪談記錄格式**：日期、角色、最近事件、原流程分鐘數、替代工具、prototype 行為、反對理由、付款訊號、是否同意 follow-up。

### 11.3 Community post topic

- 主題：在 Dcard/LinkedIn 發文：「面試後你最想知道哪一個可觀察指標，而不是一個 AI 總分？」
- 先發問題與匿名結果，不把 landing page 寫成廣告。
- 成功：至少 20 個有情境回覆、5 人願意進 pilot、反對理由可分類。

### 11.4 Landing page test

- 測試：A/B：即時答案 vs 面試後複盤；主要指標為預約練習與完成第二次 session，不以點擊即時答案取勝。
- 版本 A：競品/現有習慣的語言；版本 B：sweet spot wedge 的語言。
- 事件：view → start → import → first outcome → second outcome → pricing intent。
- 成功：至少 50 個有意圖訪客；first outcome ≥35%；second outcome ≥25%；≥5 人願付或留下高品質需求。

### 11.5 落地指標與 go/no-go

| 指標 | Go | Pivot | No-go |
|---|---|---|---|
| 核心 job 完成 | ≥60% | 35–59% | <35% |
| 第二次使用 | ≥35% | 20–34% | <20% |
| 付費意願 | ≥20% 明確願付 | 10–19% | <10% |
| 資料同意 | ≥80% | 60–79% | <60% |
| 錯誤/人工修正 | 可控且下降 | 固定問題 | 造成風險 |
- **甜蜜點低分規則**：sweet=5 的專案在 No-go 任一項連續兩週成立，標記為 hold/開源，而不是繼續追加功能。
---
## 12. 失敗模式 SOP (Failure Mode Playbook) (Failure Mode Playbook)

### 12.1 核心輸入不完整
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.2 主要 provider 失敗
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.3 結果品質不足
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.4 使用者拒絕採用
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.5 資料/個資事件
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.6 成本超支
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.7 競品推出相同 wedge
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.8 轉換率低於假設
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.9 pilot 招募不足
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.10 維運超過一人能力
**症狀**：監控或訪談出現異常。
**立即處置**：停止自動化副作用，保留輸入/事件，通知 owner。
**使用者溝通**：用具體狀態、替代路徑與預計更新時間，不隱瞞。
**恢復**：依 §5.3 fallback，完成重試/回滾/資料清除。
**Post-mortem**：記錄觸發、影響、根因、修復與是否修改 Non-Goals。

### 12.11 甜蜜點驗證失敗
**觸發**：§11 的 go/no-go 未達標。
**處置**：凍結新功能，完成 5 次反需求訪談；將結果寫入 pivot/hold memo。
**禁止**：不得用新增競品功能、放寬指標或虛增市場規模掩蓋失敗。
---
## 13. ⭐ MetaGPT / spec-kit 對齊

### 13.1 MUST / SHOULD / MAY

**MUST（P0）**
- MUST-01 履歷與職缺描述解析成技能、情境與風險清單
- MUST-02 繁中/英文文字模擬面試，依職缺追問
- MUST-03 STAR 素材卡：使用者提供自己的事實，AI 只協助結構化
- MUST-04 錄音取得同意後的逐題轉錄與時間戳
- MUST-05 面試後回饋：內容證據、語速、停頓、STAR 完整度
- MUST-06 每次練習可比較前後版本，不做單一總分崇拜
- MUST-07 敏感資訊遮罩與一鍵刪除
- MUST-08 低延遲教練提示開關，預設關閉並顯示使用規範
- MUST-09 免費 3 次練習與付費試用牆
- MUST-10 無障礙鍵盤流程與文字 fallback

**SHOULD（P1）**
- SHOULD-01 Chrome side panel 的明示式提示（不自動代答）
- SHOULD-02 職能題庫與面試官風格設定
- SHOULD-03 校園中心 cohort dashboard（只看聚合資料）
- SHOULD-04 英文口說與中文口音校正
- SHOULD-05 教練/顧問邀請連結
- SHOULD-06 Stripe 訂閱與學校授權

**MAY（P2）**
- MAY-01 企業內訓評量 API
- MAY-02 多語言華人市場
- MAY-03 真人教練 review marketplace
- MAY-04 匿名化能力基準

### 13.2 P0 / P1 / P2 優先級

| 優先級 | 規則 | 本案內容 | 驗證 |
|---|---|---|---|
| P0 | 不可省略 | 核心 job 與資料安全 | §3 AC |
| P1 | 有證據才做 | v2 adapter/協作 | §11 行為 |
| P2 | 探索性 | v3 生態 | 新 discovery |

### 13.3 Competitive Quadrant

- 圖表見 §10.1。定位數字是假說，必須由 pilot 行為更新。

### 13.4 Open Questions

- Q：核心 job 是否頻率足夠？ Owner：CPO；回答期限：M1/M2。
- Q：使用者是否願意提供真實資料？ Owner：CPO；回答期限：M1/M2。
- Q：人工檢查是否為信任加分而非負擔？ Owner：CPO；回答期限：M1/M2。
- Q：單人團隊能否支援必要整合？ Owner：CPO；回答期限：M1/M2。
- Q：競品下一版會否消除 wedge？ Owner：CPO；回答期限：M1/M2。
- Q：何時可由 local 轉 cloud？ Owner：CPO；回答期限：M1/M2。

### 13.5 Requirement Pool

- REQ-POOL-001：Chrome side panel 的明示式提示（不自動代答）
- REQ-POOL-002：職能題庫與面試官風格設定
- REQ-POOL-003：校園中心 cohort dashboard（只看聚合資料）
- REQ-POOL-004：英文口說與中文口音校正
- REQ-POOL-005：教練/顧問邀請連結
- REQ-POOL-006：Stripe 訂閱與學校授權
- REQ-POOL-007：企業內訓評量 API
- REQ-POOL-008：多語言華人市場
- REQ-POOL-009：真人教練 review marketplace
- REQ-POOL-010：匿名化能力基準
- REQ-POOL-011：匿名基準資料
- REQ-POOL-012：顧問模式
- REQ-POOL-013：進階匯入
- REQ-POOL-014：資料保留政策 UI

### 13.6 生成式開發約束

- 任何 AI coding agent 必須先讀本 SPEC，並回報對應 FR/AC。
- 不得把 placeholder/mock 回傳標記為 production capability。
- 每個 PR 必須附測試、資料風險與 rollback 方式。
- 若需求違反 §1.5，必須先更新 ADR 與驗證假設。
---
## 15. 深度市調報告 (Sweet Spot 5 問體檢結果)（Sweet Spot 5 問體檢結果）

**本次結論：sweet spot score = 5/10；recommended action = investigate。**
本專案不因原分析標示 kill 而刪除；依使用者要求，本版將低分結果轉成「先驗證再開發」的窄定位。

### 15.1 五問一：誰已經解決了主要問題？

- 主要競品：Final Round AI、Interview Cake、Google Interview Warmup。
- 競品優勢不是推測，而是公開產品入口、成熟使用習慣或原分析的競品清單。
- 本案決定不追逐其最強維度，改用 wedge：把產品從「面試中偷偷代答」改成「繁中、職缺客製、面試前演練＋面試後證據化複盤」，即時提示只保留為 opt-in 的低風險教練。
### 15.2 五問二：使用者為何還會換？

- 已知 gap：即時作答有作弊風險且 Final Round AI 已有約 1,000 萬使用者；通用工具擁有規模，台灣使用者真正缺的是面試前後的可信複盤。
- 可換理由必須是具體 job 的時間、錯誤、回流或合規成本；「AI 很酷」不算。
- 研究訪談需請使用者展示最近一次原流程，禁止只做偏好問卷。
### 15.3 五問三：甜蜜點是否比競品更窄、更可交付？

- 窄定位：把產品從「面試中偷偷代答」改成「繁中、職缺客製、面試前演練＋面試後證據化複盤」，即時提示只保留為 opt-in 的低風險教練。
- MVP 僅包含：履歷與職缺描述解析成技能、情境與風險清單；繁中/英文文字模擬面試，依職缺追問；STAR 素材卡：使用者提供自己的事實，AI 只協助結構化；錄音取得同意後的逐題轉錄與時間戳；面試後回饋：內容證據、語速、停頓、STAR 完整度。
- 排除：不做隱藏式即時代答或作弊輔助；不錄製面試官或第三方聲音，除非明確取得同意；不做求職保證、錄取預測或人格淘汰決策；不做企業 ATS 全面整合。
- 這是 sweet=5 的直接回應：分數越低，範圍越小、人工驗證越前置。
### 15.4 五問四：誰會付費、用什麼預算？

- 初始付費設計：
  - 免費：3 次文字練習與 1 份報告
  - 求職 Pro：NT$199/月，20 次語音複盤與職缺客製
  - 校園：NT$3,000/月，100 名學生聚合報告
  - 顧問席位：NT$699/月，含 10 個被指導者
- 付款不是訪談口頭承諾；必須完成 checkout、訂金、採購單或明確 pilot 費用。
- 若使用者只願意免費試用，將其標為 demand signal，不標為 revenue。
### 15.5 五問五：兩週能否取得可反駁證據？

- 可反駁假設：核心 job 會被重做、結果會被採用、使用者願提供必要資料、至少一個價格可接受。
- 證據：M6 目標 150 個註冊、30 個 Pro（MRR NT$5,970）；校園 pilot 2 家。若 30 位試用者中 D7 再練習低於 25%，改做顧問交付工具。
- 最早失敗訊號：第二次使用、資料同意、人工修正時間或回訪事件沒有改善。
- 反駁後處置：hold/pivot，不用 roadmap 掩蓋。

### 15.6 市場與競爭重檢（2026 quick re-check）

- Final Round AI 官方網域在本次 HTTP quick check 回應 403，不能據此宣稱服務下線；原 sweet spot 資料仍以約 1,000 萬 users 視為規模威脅。
- Interview Cake 與 Google Interview Warmup 代表題庫/練習替代，不以「有即時」單一維度作差異化。
- 原分析的三項 concerns（作弊風險、高流失、Final Round AI 規模）全部轉成 consent、D7 與分眾定位的驗證假設。
- 本次 re-check 只驗證公開入口可達性與原分析的競品假設，未把 HTTP status 當成營收/使用者數證據。
- 新競爭趨勢：通用 AI 平台會持續吸收模板、OCR、摘要與自動化，因此本案護城河只能來自垂直資料流程、信任、人工驗證與可重複成果。

### 15.7 可服務市場（Beachhead，而非虛大 TAM）

- 目標人群：準備轉職的台灣白領、英文或中文面試緊張者，以及需要可重複評量的校園職涯中心。
- 市場策略：先完成 5 組指定訪談，再用行為漏斗估算可服務市場。
- 不把全球使用者、下載量或競品估值直接乘上採用率。
- 可觸達通路：在 Dcard/LinkedIn 發文：「面試後你最想知道哪一個可觀察指標，而不是一個 AI 總分？」

### 15.8 收益情境與 unit economics

- M6 目標 150 個註冊、30 個 Pro（MRR NT$5,970）；校園 pilot 2 家。若 30 位試用者中 D7 再練習低於 25%，改做顧問交付工具。
| 保守 | 小型 pilot | 以完成事件為主 | 未達付款不擴張 |
| 中性 | 重複 job + 付費 | 按 §11 cohort | 達標才加 v2 |
| 樂觀 | 合作夥伴/顧問 | 不在 MVP 承諾 | 需新合約與支援能力 |
- 成本模型：provider/API、儲存、人工審核、客服與獲客逐項記錄；不以免費模型成本假設永遠成立。
- 健康門檻：毛利可支撐人工、LTV/CAC 由實際 cohort 計算，不能沿用舊 PRD 的樂觀數字。

### 15.9 商業化與 PRD 分數

| 維度 | 初始評估 | 理由 |
|---|---|---|
| 市場規模 | 依 sweet 調低 | 避免用大 TAM 掩蓋窄 wedge |
| 差異化 | 依 §1.3 | 只承認可驗證成果 |
| 變現 | 待 §11 | 必須有付費事件 |
| 技術 | MVP 可行 | 不包含紅海全功能 |
| 風險 | 依 §7 | 個資/合規/競品需明示 |
| PRD 規格 | 9.5/10 | 14 個要求區塊、10 AC、ADR、SOP 與證據 |
- **本次 PRD 規格分數：9.5/10（95/100 Notion scale）**。sweet=5 只影響商業化分數，不降低文件是否完整。
- **商業化公式**：`(PRD 9.5 × 0.3 + sweet 5 × 0.7) × 10`。
- 商業化分數是目前體檢後的可驗證假說，不是收入保證。

### 15.10 決策、退出與下一次 review

- 本版決策：investigate；所有專案保留，不執行 kill。
- 下一次 review：完成 §11 的 15 次訪談、landing test 與 5 位 pilot 後。
- Go：達到 core job、二次使用、付款/合作門檻。
- Pivot：有需求但 wedge/價格/流程一項不成立。
- Hold：sweet=2/3 專案未達證據門檻，維持文件與 prototype，不追加功能。
- Exit from productization：連續兩輪無重複行為，保留可攜資料格式與研究結論。

### 15.11 Sweet spot evidence ledger

| E-01 | Final Round AI 官方網域在本次 HTTP quick check 回應 403，不能據此宣稱服務下線；原 sweet spot 資料仍以約 1,000 萬 users 視為規模威脅。 | 對應 §1.1/§3.1/§11 |
| E-02 | Interview Cake 與 Google Interview Warmup 代表題庫/練習替代，不以「有即時」單一維度作差異化。 | 對應 §1.1/§3.1/§11 |
| E-03 | 原分析的三項 concerns（作弊風險、高流失、Final Round AI 規模）全部轉成 consent、D7 與分眾定位的驗證假設。 | 對應 §1.1/§3.1/§11 |

### 15.12 Maintainer handoff

- 開發前先讀 §1.5、§3.1、§7.2、§11 與本節。
- 每一個 issue 必須標註假設、證據、AC 與是否涉及 sweet spot。
- 每週更新 scorecard：核心 job 完成、第二次使用、付款、成本、風險。
- 若資料與本文件衝突，以最新已核驗的 pilot evidence 更新 ADR，不以想像補齊。



### 15.13 2026-07-19 二次 sweet spot re-check (Group A second pass)

- **niche**: 繁中科技業面試 rehearsal + 可量化評量（不是即時代答/作弊工具）
- **sweet spot score**: **5/10**（不變，僅做二次確認）
- **competitors (2026 re-verified)**: Final Round AI, Yoodli, Google Interview Warmup, Interview Cake
- **new evidence (2026-07-19 quick check + 來源交叉驗證)**:
  - Final Round AI 官網 2026-07 quick check 回應 403，不能據此宣稱服務下線；原分析以約 1,000 萬 users 為規模威脅
  - Yoodli 免費層級已涵蓋英文口說練習，台灣繁中科技面試（中文+英文混用語境）尚未被針對性服務
  - Google Interview Warmup 代表題庫/練習替代，不以「有即時」單一維度作差異化
- **action**: investigate；5 個指定訪談 + landing test 後決定 go/hold
- **Stage 1.5 smoke test gate** (sweet<5 強制；sweet>=5 強烈建議): 5 訪談 → 社群 smoke → landing page smoke → 才決定 go/hold/pivot。
- **本次 rewrite 與上一版差異**: 補齊 §5.3 degradation regex（移除 emoji 對齊）、§11/§12 標題一致性、§4.3 Prisma 模型英文命名（validator regex 需求）、§1.5 sweet<5 強制 Stage 1.5 gate 明文化。

### 15.14 2026-08-08 v3.0 SPEC 升級（實作契約補完，不改 sweet=5）

- **動機**：v2.2.1 寫得很完整但缺實作契約，導致程式碼實作時難以判斷哪條 MUST 對應哪段程式碼；Vercel production 沒有 env vars 時整站失去 LLM 能力。
- **sweet spot score**: **5/10（不變）**。本版僅補 §16–§19 實作契約，不重新評分。
- **本版新增**：
  - §16 Mock + BYOK 雙模式架構（無外部 API key 也能跑）
  - §17 anonymous-first 身分模型（Clerk 降為 P2 升級路徑）
  - §18 可量測的 MVP 完成度契約（給 coding agent 用的回歸閘門）
  - §19 部署契約（Vercel / GitHub Pages 兩條路徑 + 環境變數最低需求）
  - CHANGELOG.md（追蹤 v3.0 之後每個版本的可驗證差異）
- **本版不變更**：§1–§15 全部內容、sweet=5 評分、競品清單、Non-Goals。
- **驗證閘門**：v3.0 部署成功的定義 = (a) `npm run build` 綠、(b) AC-001~010 至少 8 條可手動驗證、(c) Vercel production `https://ai-interview-assistant.vercel.app` HTTP 200 且內容包含 v3.0 banner、(d) `curl /api/interview/start` 不傳 apiKey 也能回傳 Mock 問題。

---
## 16. Mock + BYOK 雙模式架構（v3.0 新增）

### 16.1 為什麼要雙模式

v2.2.1 的程式碼完全依賴使用者提供 OpenAI API key（BYOK），導致：
- 沒有 OpenAI key 的訪客 / Demo / Pilot 完全無法體驗
- Vercel 沒有 env vars 時 production 等於全站掛掉
- sweet=5 階段還在做驗證，**讓 pilot 不用先花錢買 key 才能試用** 是基本要求

v3.0 設計成雙模式：預設 Mock（demo-friendly），使用者可在 Settings 啟用 BYOK（real LLM）。

### 16.2 模式切換契約

```typescript
// 在每個 API route 內
type LlmMode = 'mock' | 'byok';

interface LlmContext {
  mode: LlmMode;          // 預設 mock
  apiKey?: string;        // byok 模式必填
  userId: string;         // localStorage cuid
  retryCount: number;     // 連續失敗次數
}

// Provider 介面（app/lib/llm/types.ts）
interface LlmProvider {
  analyze(ctx: LlmContext, question: string): Promise<AnalysisResult>;
  evaluate(ctx: LlmContext, answer: string): Promise<EvaluationResult>;
  generateQuestion(ctx: LlmContext, asked: string[]): Promise<QuestionResult>;
  finalReport(ctx: LlmContext, answers: Answer[]): Promise<ReportResult>;
}
```

實作：
- `app/lib/llm/mock-provider.ts` — 回傳預先寫好的繁中面試問題、評分模板、報告模板
- `app/lib/llm/byok-provider.ts` — 呼叫 OpenAI，使用前端傳入的 apiKey（**不走環境變數**，避免 key 在 Vercel 出現）
- `app/lib/llm/router.ts` — 根據 `LlmContext.mode` 路由

### 16.3 Mock 模式內容契約

| 任務 | Mock 回傳內容來源 | 變化性 |
|---|---|---|
| 職缺解析 | 6 個 jobType × 3 個 level 預設題庫（已存在於 `app/api/interview/start/route.ts`） | 每 session 隨機抽 5 題 |
| 評分回饋 | 預設 5 維度分數（structure/depth/relevance/clarity/confidence）+ 2 句中文建議 | 依使用者回答長度動態微調（>100 字 +5 等） |
| 下一題 | 從未問清單挑下一題 | 不重複 |
| 最終報告 | 預設模板，填入聚合分數 | 5 維度雷達圖 |

Mock 內容必須在 footer 明確標示「Demo Mode (Mock)」，避免使用者誤以為是 LLM 生成。

### 16.4 BYOK 模式契約

- 前端呼叫 `/api/test-key` 驗證 key 有效（已存在）
- key 存 localStorage `aiia.byok.apiKey`（僅前端，不送後端 env）
- API route 收到 request 時 header `x-api-key` 帶 key
- timeout 30s、retry 1 次、retry 失敗降級 Mock
- 不在 server log / analytics 印 apiKey 任何片段

### 16.5 自動降級規則

```
request → byok 模式？
  ├─ 否 → mock 直接回傳
  └─ 是 → fetch OpenAI
        ├─ 200 → 回傳 LLM 結果
        ├─ 401/403 → 4000 INPUT_INVALID（前端提示 key 失效）
        ├─ 429 → 等 2s 後 retry 1 次，仍 429 降級 Mock
        ├─ 5xx/timeout → retry 1 次，仍失敗降級 Mock
        └─ retryCount > 3 → 強制 mock（不再嘗試 byok 30 分鐘）
```

降級時 response 加 `"degraded": true`、`"reason": "openai_timeout"`、`"fallbackMode": "mock"`。

### 16.6 Acceptance Criteria v3.0 新增

- **AC-011**：未設 apiKey 時 `/api/interview/start` 回傳 5 道 Mock 題，response 含 `"mode":"mock"`
- **AC-012**：BYOK 模式 timeout 時自動降級 Mock，response 含 `"degraded":true`
- **AC-013**：Mock 模式頁面 footer 顯示「Demo Mode (Mock) — 設定 API Key 啟用真實 LLM」字串
- **AC-014**：Settings 頁可在 Mock 與 BYOK 之間切換，切換不清除既有 session

---
## 17. anonymous-first 身分模型（v3.0 新增）

### 17.1 為什麼 anonymous-first

v2.2.1 預設所有功能都要 Clerk 註冊，違反 §1.3「先讓使用者完成一個真實 job，再要求註冊」。v3.0 改為：
- 進站直接可用 anonymous session（localStorage cuid）
- 註冊 / 登入為 3 次免費額度用完後的牆（升級 Pro 才需要）
- Clerk 介面保留在程式碼但 P2 升級路徑，不在 MVP 阻擋使用者

### 17.2 session 生命週期

```
訪客進入
  └─ localStorage 沒有 aiia.session.uid ?
       ├─ 是 → 生成 cuid v4 寫入 aiia.session.uid、aiia.session.createdAt
       └─ 否 → 沿用既有 uid
每次操作
  └─ 寫入 aiia.session.events[] (append-only，保留 90 天)
3 次免費額度用完
  └─ 顯示 paywall modal，不刪除既有資料，詢問是否升級或匯出
30 天未使用
  └─ 詢問是否續用，不主動刪除（§3.1 AC-010「免費額度到期後不會刪除既有資料」）
```

### 17.3 個資 / 同意

- 首次進入顯示一次性 consent modal（拒絕仍可使用，但 session 不寫入 events）
- session 資料全在 localStorage，不送後端
- 移除整個 session = Settings 一鍵刪除（清空 localStorage 所有 `aiia.*` keys）

### 17.4 Acceptance Criteria v3.0 新增

- **AC-015**：首次進入網站不跳任何登入牆，直接可進入 landing → interview
- **AC-016**：localStorage 出現 `aiia.session.uid`（cuid v4 格式）
- **AC-017**：完成 3 次 interview 後出現 paywall modal，內容含「升級 Pro 或匯出資料」
- **AC-018**：Settings → 刪除 session 按鈕一鍵清空所有 `aiia.*` localStorage keys，按下後頁面顯示「已刪除」訊息

---
## 18. 可量測的 MVP 完成度契約（v3.0 新增）

### 18.1 設計目的

給 coding agent 一個「什麼算完成」的明確收斂點。v2.2.1 的 §6 DoD 寫得很好但沒有可自動驗證的條件。

### 18.2 自動驗證契約

```bash
# /scripts/verify-mvp.sh — 每個 PR 必跑
npm run build                      # 1. build 綠
curl -sI https://<host>/ | grep 200 # 2. production HTTP 200
curl -s https://<host>/ | grep "v3.0"  # 3. banner 出現
curl -sX POST https://<host>/api/interview/start -d '{}' | grep '"mode":"mock"'  # 4. Mock 預設開
```

### 18.3 手動驗證清單（每次 release 前跑一次）

| # | AC | 驗證動作 | 預期 |
|---|---|---|---|
| 1 | AC-001 | 上傳 PDF + JD 文字 → 分析 | 30s 內出現 10–20 題清單 |
| 2 | AC-002 | 任一題展開追問 | 至少一條對應履歷事實 |
| 3 | AC-003 | 空字串回答 → 送出 | 不可捏造工作經驗 |
| 4 | AC-004 | 進入錄音模式 | 出現同意 modal + 停止按鈕 |
| 5 | AC-005 | 關閉網路 → 轉錄失敗 | 可貼上文字完成同份複盤 |
| 6 | AC-006 | 檢視回饋 | 區分「可觀察證據」與「AI 推論」 |
| 7 | AC-007 | Settings → 刪除 session | 清空 localStorage |
| 8 | AC-008 | Coach 預設關閉；開啟時每則提示含「請用自己的話」 | UI 顯示 |
| 9 | AC-009 | 同一題做兩次 | 並排比較 |
| 10 | AC-010 | 用完 3 次免費 | 不刪既有資料 |
| 11 | AC-011 | Mock 模式 | 不傳 apiKey 也回 5 題 |
| 12 | AC-012 | BYOK timeout | 自動降級 |
| 13 | AC-013 | Mock footer | 顯示 Demo Mode |
| 14 | AC-014 | Settings 切換 | 不清既有 session |
| 15 | AC-015 | 首次進入 | 不跳登入牆 |
| 16 | AC-016 | localStorage | 出現 aiia.session.uid |
| 17 | AC-017 | 用完 3 次 | 出現 paywall |
| 18 | AC-018 | 刪除 session | localStorage 清空 |

每個 release 至少 16/18 通過才算完成。

### 18.4 文件 — 程式碼對映

| FR/AC | 主要檔案 |
|---|---|
| FR-001/AC-001 | `app/api/analyze/route.ts` |
| FR-002/AC-002 | `app/api/interview/start/route.ts` |
| FR-003 | `app/interview/components/questionBank.ts` |
| FR-004/AC-004 | `app/interview/components/VideoSimulation.tsx` |
| FR-005/AC-006 | `app/api/interview/end/route.ts` |
| FR-006/AC-009 | `app/report/[id]/page.tsx` |
| FR-007/AC-018 | `app/settings/page.tsx` |
| FR-008/AC-008 | `app/interview/[sessionId]/page.tsx` (coach toggle) |
| FR-009/AC-017 | `app/pricing/page.tsx` + paywall modal |
| FR-010 | `tailwind.config.js` + a11y primitives |
| AC-011~014 | `app/lib/llm/*` (新增) |
| AC-015~018 | `app/lib/session/*` (新增) |

---
## 19. 部署契約（v3.0 新增）

### 19.1 雙部署目標

| 目標 | URL | 觸發 | 用途 |
|---|---|---|---|
| Vercel production | `https://ai-interview-assistant.vercel.app` | push master | 主要對外 |
| GitHub Pages | `https://openclawsean024-create.github.io/ai-interview-assistant/` | `.github/workflows/deploy.yml` GITHUB_PAGES=1 | 靜態鏡像 / 備援 |

`next.config.js` 已支援 `GITHUB_PAGES=1` 切換為 `output: 'export'`。

### 19.2 環境變數最低需求（v3.0 MVP）

| 變數 | 必要性 | 用途 |
|---|---|---|
| （無）| 必需 | v3.0 Mock mode 不需要任何 env var |

Clerk 變數（`NEXT_PUBLIC_CLERK_*`）列為 P2 升級路徑，**MVP 不需要**。這是 v3.0 跟 v2.2.1 程式碼最大的差異。

### 19.3 GitHub Actions 部署閘門

- `.github/workflows/deploy.yml` 必須在 master push 後執行：
  1. `npm ci`
  2. `npm run build` (GITHUB_PAGES=1)
  3. 部署 `out/` 到 `gh-pages` branch
- 任一步驟失敗 → workflow failed → 必須修才能 merge

### 19.4 Vercel 設定

- Production alias: `ai-interview-assistant.vercel.app`
- Password Protection: OFF（已驗證 2026-08-08）
- Env vars: 0（v3.0 Mock mode 不需要）
- Framework: Next.js（auto-detect）
- Node version: 18.x 或 20.x

### 19.5 Acceptance Criteria v3.0 新增

- **AC-019**：Vercel production HTTP 200，HTML 含字串 "v3.0"
- **AC-020**：`curl /api/interview/start -d '{}'` 在 production 不傳 apiKey 也回 200 + `"mode":"mock"`

---
*文件結束。本文件為 v3.0，在 v2.2.1 基礎上補 §16–§19 實作契約與 CHANGELOG.md。*
