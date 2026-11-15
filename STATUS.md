# Status — ai-interview-assistant

- Project：AI 面試演練與複盤
- Repo：`openclawsean024-create/ai-interview-assistant`（預設分支 `master`）
- State：🟢 **M1 開發完成、10 條 AC 皆有通過的測試；等待 Sean 覆審（Exit gate）** — 2026-11-16
- 分支：`feat/m1`（自 `chore/prd-rebuild` @ `fe0e682` 分出；PR #1 尚未合併）
- Spec：`PRD/SPEC.md` v4.0；Goal：`GOAL.md`（M1）；Rubric：`PRD/RUBRIC.md` v1.0.0
- Stack：Next.js 14.2.5 + React 18 + TypeScript 5 + Tailwind 3；localStorage；Mock／BYOK AI provider；Vitest 2 + Playwright

## Notion 商品資料庫對應

| Notion 欄位（「可產品化商品」） | 值 | 本 repo 對應 |
|---|---|---|
| 產品名稱／優先順序／開發順位 | AI 面試演練與複盤／P3／第 9 個 | 本 repo |
| 要併入的 repo | 無 | 無合併工作 |
| 上市前要補 | 補測試、接真實 AI 取代假資料、題庫與評分 | 補測試 → AC-001、AC-006；可替換 AI 介面 → AC-002、AC-003（正式接入屬 M2）；題庫與評分 → AC-004、AC-005 |
| 主要風險 | 避免被當作面試代答工具；AI 成本 | AC-007；M1 全程 Mock、零付費 API 呼叫 |

## 需要 Sean 決定的事項（M1 未代為決定）

| # | 事項 | M1 暫行處置 | 待決定 |
|---|---|---|---|
| 1 | Chrome 擴充功能（面試中即時代答型態） | `public/` 內的 7 個複本（`manifest.json`、`sidePanel.html`、`sidePanel.js`、`content.js`、`background.js`、`popup.html`、`popup.js`）已移除，**不再隨網站部署**（E2E 驗證皆為 404）。repo 根目錄的原始檔（與 `public/` 複本逐位元相同）、`icons/`、`ai-interview-assistant-chrome-extension.zip` **原封不動保留、未修改** | 刪除、封存到獨立 repo，或改造成僅練習模式 |
| 2 | `/api/analyze`（原「單題建議答案」） | **介面上的入口已全部停用**（`/interview` 不再呼叫）。route **未刪除**，但改為只經 `LlmProvider.structureHint` 回傳固定的答題結構提示（每則含「請用自己的話」），忽略 request 中的 `apiKey`／`model`／`systemPrompt`，不呼叫任何外部 AI | 整個移除，或保留為結構提示 API |
| 3 | 設定頁的語音辨識語言／TTS 速度／麥克風選項 | 隨代答流程一併移除（它們只服務「聆聽題目、朗讀答案」）；同時移除只在擴充功能環境有效的 `chrome.storage` 分支 | M2 做「語音作答逐字稿」（FR-015）時是否需要恢復麥克風設定 |
| 4 | Google Fonts | 為了讓頁面零外部請求（AC-006 的驗證條件）而移除 `<link>`，改用系統字型堆疊；外觀字型會依作業系統不同 | 是否改為自行託管字型 |

## M1 驗收條件（GOAL.md）

| AC | 內容 | 狀態 | 測試與證據 |
|---|---|---|---|
| AC-001 | `typecheck`／`test`／`e2e` scripts 與 CI；lint、typecheck、test、build 全部 exit 0 | ✅ | `tests/unit/network-guard.test.ts`（scripts 與 CI 步驟檢查）；`.github/workflows/ci.yml`（任一步驟失敗即失敗，無 `continue-on-error`）；下方 Deterministic checks |
| AC-002 | AI 呼叫統一經 `LlmProvider`；單一工廠；Mock 與假 HTTP provider 通過同一組契約測試 | ✅ | `tests/unit/provider-contract.test.ts`（同一組契約 × 2 個 provider）、`tests/unit/api-routes.test.ts`；`grep -rn "api.openai.com" app/api` 無結果（exit 1） |
| AC-003 | timeout／429／5xx 重試至多 1 次後降級並回 `degraded`、`degradedReason`；401／403 回 `OPENAI_AUTH_FAILED`；冷卻在伺服器端生效；測試零真實網路 | ✅ | `tests/unit/router-degrade.test.ts`、`tests/unit/api-routes.test.ts`、`tests/unit/network-guard.test.ts`（守門機制自我測試：呼叫外部 URL 必定失敗） |
| AC-004 | 題庫單一來源與 schema 驗證；通用題 ≥ 46、職務題 ≥ 60、每個職務 × 職級 ≥ 5 | ✅ | `tests/unit/question-bank.test.ts`；題庫 111 題（通用 51、職務 60）；E2E 題庫篩選 |
| AC-005 | 明文、可重現的 rubric；空白 0 分且不捏造；回饋分 `evidence`／`suggestions`；報告頁分開顯示 | ✅ | `tests/unit/rubric.test.ts`（8 則虛構 fixture：空白、只有空白、極短、無量化、完整 STAR、含數字、不確定語氣、英文）；`PRD/RUBRIC.md`；E2E 報告頁「可觀察證據」「建議」區塊 |
| AC-006 | 無 key、無登入，從 `/interview` 走完 5 題 → `/report/[id]`（總分、雷達圖、逐題回饋、匯出 Markdown） | ✅ | `e2e/practice-loop.spec.ts`；非 localhost 請求次數斷言為 0 |
| AC-007 | 移除聆聽 → 建議答案 → 朗讀流程；擴充功能不在 `public/`；`/api/analyze` 只回結構提示 | ✅（擴充功能最終處置待 Sean 決定） | `e2e/anti-proxy.spec.ts`、`tests/unit/repo-hygiene.test.ts`、`tests/unit/api-routes.test.ts`；`git ls-files public \| grep -E "manifest.json\|sidePanel\|content.js\|background.js\|popup"` 無結果（exit 1） |
| AC-008 | 一鍵刪除清除全部 key（API key、session、報告、統計、歷史），顯示「已刪除」，Demo 模式標示回到無 key | ✅ | `e2e/delete-data.spec.ts`（寫入 `apikey_test`、`report_test`、`interview_session_test`、`usage_test`、`aiia.session` 等 15 個虛構 key 後點 `delete-session-btn`）；`tests/unit/storage.test.ts` |
| AC-009 | 同意 modal 與 README 的說明與實際資料流一致 | ✅ | `e2e/consent.spec.ts`、`tests/unit/repo-hygiene.test.ts`；`grep -n "不上 server\|不送伺服器" README.md app/components/session-init.tsx` 無結果（exit 1） |
| AC-010 | SOP 指令皆可執行並記錄 exit code；無真實憑證；fixture 只用虛構資料；`git diff --check` 通過 | ✅ | `tests/unit/repo-hygiene.test.ts`；`bash scripts/check-credentials.sh`；下方 Deterministic checks |

每條 AC 的測試名稱都以 `AC-xxx:` 開頭；對照表見 `SOP.md`「AC 與測試對照」。

## Deterministic checks（2026-11-16，`feat/m1` 最終提交的工作樹，Node v26.13.1、npm 11.20.0、macOS arm64）

| Command | Exit | Evidence |
|---|---:|---|
| `npm ci` | 0 | 安裝完成（有 install-scripts 警告） |
| `npm run lint` | 0 | No ESLint warnings or errors |
| `npm run typecheck` | 0 | `tsc --noEmit` 無型別錯誤（含 `tests/`、`e2e/`；`strict: false`） |
| `npm test` | 0 | Vitest：8 個測試檔、143 個測試全部通過 |
| `npm run build` | 0 | Next.js production build 成功，15 個 routes |
| `npm run e2e` | 0 | Playwright（Chromium）：14 個測試全部通過；外部請求次數 0 |
| `git diff --check` | 0 | 無 whitespace 錯誤（另以 `git diff --check origin/master...HEAD` 檢查整個分支，exit 0） |
| `bash scripts/check-credentials.sh` | 0 | 未發現真實憑證樣式 |
| `bash scripts/verify-mvp.sh http://localhost:3111` | 0 | 本機 `next start` 下 8 passed／0 failed（選用的 API smoke） |
| `grep -rn "api.openai.com" app/api` | 1 | 無結果（外部端點只在 `app/lib/llm/byok-provider.ts`） |
| `git ls-files public \| grep -E "manifest.json\|sidePanel\|content.js\|background.js\|popup"` | 1 | 無結果 |
| `grep -n "不上 server\|不送伺服器" README.md app/components/session-init.tsx` | 1 | 無結果 |
| GitHub Actions「CI」 | 見 PR | PR 上的 CI 執行結果以 PR 頁面為準 |

憑證掃描補充：GOAL 原始指令 `git grep -nE "sk-[A-Za-z0-9_-]{20,}|sk_live|pk_live" -- . ':!*lock*'` 的命中只有「寫出這個樣式本身」的檔案（`GOAL.md`、`scripts/check-credentials.sh`、`tests/unit/repo-hygiene.test.ts`），沒有任何憑證；測試與 E2E 使用的 key 只有 `sk-test-xxxx` 類佔位字串。

零真實網路呼叫的證明：

- 單元／契約測試：`tests/setup/network-guard.ts` 把 `globalThis.fetch` 換成一律拋錯的守門版本；需要 HTTP 行為的測試只用記憶體內的假 `fetch`（`tests/setup/fake-fetch.ts`）；各測試在結束時斷言守門紀錄為 0。
- E2E：`e2e/helpers.ts` 攔截 context 內所有請求，非 localhost 一律中止並記錄，測試斷言紀錄為空陣列。
- M1 沒有使用任何真實 AI key，也沒有呼叫任何付費 API。

## M1 主要變更

- **測試與 CI**：新增 `typecheck`／`test`／`e2e` scripts、Vitest、Playwright、`.github/workflows/ci.yml`（PR 與非 `master` 分支 push 觸發）。
- **AI 抽象層**：`LlmProvider` 增加 `structureHint`、`validateKey`；`router.ts` 為單一工廠並統一重試／降級／冷卻；`byok-provider.ts` 可注入 `fetch`、不自行重試、錯誤訊息不含 key 或上游原文。
- **題庫**：`app/interview/components/questionBank.ts` 與 `mock-provider.ts` 內的題目整合到 `app/lib/questions/bank.ts`。
- **評分**：`app/lib/scoring/rubric.ts`（純函式）取代原本依字數計分的 Mock。
- **UI 閉環**：`/interview` 新增「開始模擬面試」；逐題作答頁顯示分數、5 維、可觀察證據、建議；結束後導向報告頁；`/interview`、作答頁、報告頁、設定頁、練習紀錄頁都不需要登入。
- **反代答**：移除 web 端聆聽／建議答案／朗讀／下一句提示流程與相關翻譯字串。
- **資料**：localStorage key 統一為 `aiia.*`；一鍵刪除清除全部資料（保留語系偏好）；同意文案、README、設定頁、Landing 的資料流說明改為與實際一致。
- **順手修正**（走通流程所必需）：報告頁以 UUID 當日期顯示為 Invalid Date → 改存 `createdAt`；作答頁使用了不存在的 `.btn-brand` 樣式 → 改用 `.btn-primary`；雷達圖標籤被裁切。

## FR 實作對照（P0）

| FR | 需求 | 狀態 |
|---|---|---|
| FR-001 | 題庫篩選 | 已實作（M1） |
| FR-002 | 結構化模擬面試閉環 | 已實作（M1） |
| FR-003 | rubric 評分與證據式回饋 | 已實作（M1，Mock rubric） |
| FR-004 | 複盤報告與匯出 | 已實作（M1） |
| FR-005 | AI 供應商抽象與降級 | 已實作（M1；正式付費 API 未接，屬 M2） |
| FR-006 | 反代答設計 | 已實作（M1；擴充功能最終處置待決定） |
| FR-007 | 匿名使用與一鍵刪除 | 已實作（M1） |
| FR-008 | 資料使用告知 | 已實作（M1） |
| FR-009 | 自動化測試 | 已實作（M1） |

P1／P2（FR-010～FR-021）狀態未變，見 `PRD/SPEC.md` §6。

## 已知限制與未處理事項

- **Rubric 是關鍵詞與格式規則，不是語意理解**：可能誤判；「相關性」只是題目用詞重疊率，用同義詞作答會被低估（詳見 `PRD/RUBRIC.md` §7）。
- **冷卻機制只在單一 server process 的記憶體生效**：serverless 多 instance 之間不共享，重啟後歸零。
- **自備 key（BYOK）路徑只以假 `fetch` 驗證**，M1 未以真實 key 實測（依 GOAL，正式 AI 接入屬 M2）。
- **假登入頁仍存在**（`/sign-in`、`/sign-up`、`/login`、`/register`、`components/auth-provider.tsx`）：主要流程已不需要，未刪除；`.btn-brand` 在這些頁面同樣沒有樣式。
- **免費額度**仍只計數與提示，不阻擋使用（FR-012，P1）；提示文字已改為不宣稱可升級付費。
- **Landing／定價頁**仍有未查證的競品規模說法與 v3.0 字樣、草案價格（SPEC §4、§3 標為待確認），M1 只修正了與資料流、代答相關的文案。
- **GitHub Pages workflow（`deploy.yml`）** 未修改；合併到 `master` 後仍會觸發，先前持續失敗。Vercel 正式網址、lockfile 政策（npm／pnpm 並存）仍待確認（SPEC §13）。
- **作答頁、報告頁**維持只有中文介面（M1 前即如此）。

## 下一步

1. Sean 覆審本 PR 的 scope，並決定上方「需要 Sean 決定的事項」第 1、2 項（Exit gate）。
2. 覆審通過前不接正式 AI API、金流或任何真實個資，不做 production release。
