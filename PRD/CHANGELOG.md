# CHANGELOG — AI 面試助理

依 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/) 格式，本檔追蹤規格書 v3.0 之後的**可驗證差異**。規格書的 sweet-spot 評分紀錄在 §15，**這裡不放評分**，只放「改了什麼 / 為什麼 / 怎麼驗證」。

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
