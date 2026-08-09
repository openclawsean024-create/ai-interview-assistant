# AI Interview Assistant

> 繁中、面試前演練 + 面試後證據化複盤。即時提示只保留為 opt-in 的低風險教練,**不做隱藏式代答**。
> v3.0 — sweet=5, investigate。SPEC: [`PRD/SPEC.md`](PRD/SPEC.md) · CHANGELOG: [`PRD/CHANGELOG.md`](PRD/CHANGELOG.md)

## 🚀 Live Demo

**Production**: <https://ai-interview-assistant-eosin.vercel.app>

> ⚠️ Demo Mode (Mock) 預設啟用 — **無需 API Key、無需註冊** 即可體驗完整 3 次免費面試演練。
> 在 Settings 貼上自己的 OpenAI key 即可切換到 BYOK 模式用真實 LLM。

## v3.0 三大差異（SPEC §16 / §17 / §18）

- 🎭 **Mock 模式預設** — 不打 OpenAI,離線可跑 3 次完整面試。SPEC §16。
- 🪪 **anonymous-first** — 進站即可使用,localStorage cuid + 一鍵刪除。**不要求註冊**。SPEC §17。
- 🛟 **降級不丟資料** — BYOK 模式 timeout/5xx 自動降級 Mock,草稿保留。SPEC §5.3 + §16.5。

## Quick Start

```bash
npm install --legacy-peer-deps
npm run dev        # 本機 dev server,http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
```

**v3.0 不需要任何環境變數** — Mock mode 完全離線運作。BYOK mode 由使用者在 Settings 貼 API key(僅存 localStorage,**不上 server**)。

## Chrome Extension

`manifest.json` + `background.js` + `sidePanel.js` 在 repo root,適合在 `chrome://extensions/` 載入未封裝項目使用。

ZIP 打包版: [`ai-interview-assistant-chrome-extension.zip`](ai-interview-assistant-chrome-extension.zip)

## Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing (v3.0 banner + Demo Mode badge) | No |
| `/interview` | Core interview practice (5 STAR questions) | No |
| `/interview/[sessionId]` | Run session, submit answers, view report | No |
| `/settings` | API key (BYOK) + 一鍵刪除 session | No |
| `/report/[id]` | View past report | No |
| `/pricing` | Pricing plans (Pro / Campus / Consultant) | No |
| `/dashboard` | Usage history (Chrome extension users) | Optional |
| `/sign-in` `/sign-up` `/login` `/register` | Mock auth (P2 升級路徑) | No |

> **為什麼所有頁面都不要求登入?** v3.0 SPEC §17.1:「先讓使用者完成一個真實 job,再要求註冊」。3 次免費額度用完才顯示 paywall。

## Architecture

```
Next.js 14 (App Router)
├── app/lib/llm/        # v3.0 router + Mock/BYOK providers + auto-degrade
├── app/lib/session/    # anonymous cuid + quota + deleteSession
├── Tailwind CSS
├── OpenAI GPT-4o (BYOK, server-side proxy via x-api-key)
├── localStorage (session + quota + events)
└── Vercel (production) + GitHub Pages (static mirror)
```

API routes:
- `POST /api/interview/start` — start 5-question session (Mock or BYOK)
- `POST /api/interview/answer` — evaluate answer (auto-degrade on LLM failure)
- `POST /api/interview/end` — final report with 5-dimension radar
- `POST /api/analyze` — single-question instant analysis (Mock or BYOK)
- `POST /api/test-key` — validate user's OpenAI key (BYOK setup)

## Acceptance Criteria (20 條)

詳見 [SPEC §18](PRD/SPEC.md#18-可量測的-mvp-完成度契約-v30-新增) 與 `scripts/verify-mvp.sh`。

| AC | 內容 | 驗證 |
|---|---|---|
| AC-011 | `/api/interview/start` 不傳 apiKey 回 mock 5 題 | `curl -X POST /api/interview/start -d '{}'` |
| AC-013 | Mock mode footer 顯示 Demo Mode 字串 | `curl / \| grep "Demo Mode (Mock)"` |
| AC-014 | Settings 可切換 Mock ↔ BYOK | 瀏覽器手動測試 |
| AC-015 | 首次進站不跳登入牆 | `curl / \| grep -v "sign-in"` |
| AC-016 | localStorage 出現 `aiia.session.uid` | DevTools → Application → Local Storage |
| AC-017 | 完成 3 次後出現 paywall modal | DevTools 手動跑 3 次 end |
| AC-018 | Settings 刪除 session 按鈕清空 localStorage | `delete-session-btn` click → 檢查 |

## Deployment

- **Vercel**: push to `master` (此 repo **未綁 GitHub webhook**,需手動 `npx vercel deploy --prod`)
- **GitHub Pages**: `.github/workflows/deploy.yml` 跑 `GITHUB_PAGES=1 npm run build` 推到 `gh-pages` branch
- **環境變數**: v3.0 MVP 不需要任何 env var

## SPEC 版本歷程

- **v3.0** (2026-08-08) — 補 §16/§17/§18/§19 實作契約,新增 Mock+BYOK 雙模式、anonymous-first session、可量測驗證。sweet=5 不變。
- v2.2.1 (2026-07-19) — Sweet-spot rewrite
- v1.0 (2026-04-03) — 初版

## License

MIT
