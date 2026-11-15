# CHANGELOG — AI 面試助理

依 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/) 格式，本檔追蹤規格書 v3.0 之後的**可驗證差異**。規格書的 sweet-spot 評分紀錄在 §15，**這裡不放評分**，只放「改了什麼 / 為什麼 / 怎麼驗證」。

---

## [M1] — 2026-11-16 — 可測試、無代答風險的 Mock 練習閉環（GOAL.md AC-001～AC-010）

### Added
- 測試基礎建設：`typecheck`／`test`／`e2e` scripts、Vitest 單元與契約測試（`tests/`）、Playwright E2E（`e2e/`）、CI（`.github/workflows/ci.yml`）。測試 setup 讓任何真實 `fetch` 直接拋錯。（AC-001、AC-003）
- 單一題庫 `app/lib/questions/bank.ts` 與 schema 驗證；題庫可依職務、職級篩選。（AC-004）
- 明文 rubric 評分 `app/lib/scoring/rubric.ts` 與說明文件 `PRD/RUBRIC.md`；回饋分為 `evidence`（可觀察的證據）與 `suggestions`（建議）。（AC-005）
- `/interview` 可直接開始 5 題模擬面試（選職務與職級），不需 API key、不需登入；`/api/interview/answer` 回傳下一題與 `isComplete`。（AC-006）
- `scripts/check-credentials.sh` 憑證掃描。（AC-010）

### Changed
- 所有 AI 相關 route（`/api/interview/*`、`/api/test-key`）只經 `LlmProvider`；router 成為單一工廠，重試統一為至多 1 次，降級回應欄位為 `degraded`／`degradedReason`；連續失敗冷卻改為伺服器端記憶體。（AC-002、AC-003）
- localStorage key 統一為 `aiia.*`；設定頁「刪除資料」清除本站全部資料（含 API key、報告、session、統計、歷史），只保留語系偏好。（AC-008）
- 同意 modal、README、設定頁與 Landing 的資料流說明改為與實際一致。（AC-009）
- `/interview`、`/interview/[sessionId]`、`/report/[id]`、`/settings`、`/dashboard` 不再要求（假）登入。
- 版面不再載入 Google Fonts，改用系統字型堆疊，頁面本身零外部請求。

### Removed
- web 端「輸入或語音聆聽題目 → 建議答案 → 朗讀 → 下一句提示」流程與其介面文案。（AC-007）
- `/api/analyze`（原單題建議答案端點）：依 Sean 決定整個移除，連同只服務它的 `LlmProvider.structureHint`。（AC-007）
- Chrome 擴充功能（根目錄 7 個原始檔、`icons/`、zip，以及 `public/` 內的複本與 `public/icons/`）：依 Sean 決定封存到 private、archived 的 [`openclawsean024-create/ai-interview-assistant-chrome-extension`](https://github.com/openclawsean024-create/ai-interview-assistant-chrome-extension)，本 repo 移除。（AC-007）
- 設定頁的語音辨識語言／TTS 速度／麥克風選項，以及只在擴充功能環境有效的 `chrome.storage` 分支（對應的代答流程已移除）。
- API route 中在伺服器端無作用的 `logEvent`／`getOrCreateSession` 呼叫。

---

## [3.0.0] — 2026-08-08 — 實作契約補完，不改 sweet=5

### Changed
- §1 header 從 v2.2.1 升級為 v3.0；新增 v3.0 實作契約 banner（給 coding agent 用的「無 API key / 無註冊也能跑 / 降級不丟資料 / 單一回歸閘門」）
- 新增 §15.14 「2026-08-08 v3.0 SPEC 升級」紀錄
- 補上 §16 Mock + BYOK 雙模式架構（§16.1–§16.6）
- 補上 §17 anonymous-first 身分模型（§17.1–§17.4）
- 補上 §18 可量測的 MVP 完成度契約（自動驗證 + 18 條手動清單 + 文件—程式碼對映）
- 補上 §19 部署契約（Vercel + GitHub Pages + env vars 最低需求）

### Added
- `CHANGELOG.md`（本檔）
- `app/lib/llm/types.ts`、`mock-provider.ts`、`byok-provider.ts`、`router.ts`（§16 實作）
- `app/lib/session/session.ts`、`consent.ts`、`quota.ts`（§17 實作）
- `scripts/verify-mvp.sh`（§18.2 自動驗證）

### Acceptance Criteria 新增
- AC-011–AC-014：Mock 模式可離線運作、BYOK timeout 自動降級、Mock footer 標示、Settings 可切換
- AC-015–AC-018：匿名 session、3 次 paywall、一鍵刪除
- AC-019–AC-020：Vercel production 部署驗證

### Verified (2026-08-08)
- [ ] `npm run build` 綠
- [ ] Vercel production HTTP 200，含 "v3.0" 字串
- [ ] `curl /api/interview/start -d '{}'` 回 `"mode":"mock"`
- [ ] 18 條手動 AC 至少 16 條通過

### Not Changed
- sweet spot score = **5/10**（不變）
- §1–§15 全部內容（除 header banner 與 §15.14 新紀錄）
- 競品清單：Final Round AI, Yoodli, Google Interview Warmup, Interview Cake
- Non-Goals：不做即時代答、不錄第三方聲音、不做求職保證、不做 ATS 整合

---

## [2.2.1] — 2026-07-19 — Sweet-spot rewrite (上一版)

### Changed
- 完全重寫，依 sweet=5 investigate 動作縮減 MVP
- 補 §15 完整 sweet-spot 體檢 + 二次 re-check
- 補 §5.3 degradation regex、§11/§12 標題一致性、§4.3 Prisma 英文命名

詳見 v2.2.1 commit `3a47fcfa`。
