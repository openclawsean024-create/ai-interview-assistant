# AI 面試助理 — Phase 1 系統設計文件

**版本：** 1.0  
**日期：** 2026-04-01  
**負責人：** Alan (CTO)  
**依據：** Sophia 規格計劃書 v1.0 (2026-04-01)

---

## 1. 系統架構

### 1.1 整體架構

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 14 App Router             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Landing  │ │ Dashboard │ │ Interview │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Sign-in  │ │  Sign-up  │ │ Settings  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────┤
│                  Next.js API Routes                  │
│  /api/interview/start  /api/interview/answer        │
│  /api/interview/end    /api/report/:id              │
│  /api/usage            /api/feedback                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Clerk Auth  │  Supabase DB  │  MiniMax API  │  Vercel Blob │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 1.2 技術堆疊

| 層級 | 技術 | 說明 |
|------|------|------|
| 前端框架 | Next.js 14 (App Router) | SSR + API Routes |
| UI | Tailwind CSS + shadcn/ui | 一致性設計系統 |
| 狀態管理 | Zustand | 面試過程狀態 |
| 表單驗證 | React Hook Form + Zod | 型別安全表單 |
| 認證 | Clerk | Google/LINE/Email 登入 |
| 資料庫 | Supabase (PostgreSQL) | 用戶數據、題庫、面試記錄 |
| AI 生成 | MiniMax API (或 OpenAI) | 面試題目生成、即時回饋 |
| 儲存 | Vercel Blob | 面試報告存儲 |
| 部署 | Vercel | 自動部署 + Edge Network |

### 1.3 目錄結構

```
ai-interview-assistant/
├── app/
│   ├── page.tsx                  # Landing Page
│   ├── layout.tsx                # 根佈局
│   ├── globals.css              # 全域樣式
│   ├── sign-in/[[...sign-in]]/  # Clerk 登入
│   ├── sign-up/[[...sign-up]]/  # Clerk 註冊
│   ├── dashboard/
│   │   └── page.tsx             # 儀表板（歷史記錄）
│   ├── interview/
│   │   ├── page.tsx             # 職位選擇
│   │   └── [sessionId]/page.tsx # 面試進行頁
│   ├── report/
│   │   └── [id]/page.tsx        # 報告頁
│   └── settings/
│       └── page.tsx             # 設定頁（API Key 管理）
├── components/
│   ├── ui/                      # shadcn/ui 元件
│   ├── interview-card.tsx       # 面試記錄卡片
│   ├── question-display.tsx    # AI 問題展示
│   ├── answer-input.tsx        # 回答輸入框
│   ├── feedback-panel.tsx       # AI 回饋面板
│   ├── score-display.tsx       # 分數展示
│   ├── radar-chart.tsx         # 雷達圖報告
│   └── nav-bar.tsx             # 導航列
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── clerk.ts                # Clerk helpers
│   ├── ai.ts                   # AI API 整合（MimiMax/OpenAI）
│   ├── question-bank.ts        # 題庫管理
│   └── utils.ts                # 工具函式
├── store/
│   └── interview-store.ts      # Zustand 面談狀態
├── types/
│   └── index.ts                # TypeScript 型別定義
└── app/api/
    ├── interview/
    │   ├── start/route.ts      # POST 開始面試
    │   ├── answer/route.ts     # POST 提交回答
    │   └── end/route.ts        # POST 結束面試
    ├── report/
    │   └── [id]/route.ts       # GET 取得報告
    └── usage/route.ts          # GET 用量查詢
```

---

## 2. 資料庫設計（Supabase PostgreSQL）

### 2.1 ER Diagram

```
users ──1:N──> interviews ──1:N──> answers
                         │
                         └──> reports
```

### 2.2 Table: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  api_key TEXT ENCRYPTED,          -- 用戶自備 AI API Key
  plan TEXT DEFAULT 'free',         -- free | basic | pro
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Table: interviews

```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,           -- software-engineer | data-analyst | sales | ...
  job_level TEXT,                   -- junior | mid | senior
  interview_type TEXT DEFAULT 'behavioral',  -- behavioral | technical | case
  status TEXT DEFAULT 'in_progress',  -- in_progress | completed | abandoned
  total_score INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 Table: answers

```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,                    -- AI 即時回饋
  dimensions JSONB,                  -- 多維度評分 {logic: 85, depth: 70, ...}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 Table: reports

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  overall_score INTEGER,
  summary TEXT,                     -- AI 生成的綜合建議
  strengths TEXT[],                 -- 強項陣列
  improvements TEXT[],              -- 待改進陣列
  radar_data JSONB,                  -- 雷達圖維度數據
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.6 Table: question_bank

```sql
CREATE TABLE question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  job_level TEXT,
  interview_type TEXT,
  question_text TEXT NOT NULL,
  ideal_answer TEXT,                -- 教學示範回答
  dimensions TEXT[],               -- 評估維度 [logic, depth, structure, ...]
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qb_job_type ON question_bank(job_type);
CREATE INDEX idx_qb_type_level ON question_bank(interview_type, job_level);
```

---

## 3. API 設計

### 3.1 POST /api/interview/start

**描述：** 開始新面試

**Request:**
```json
{
  "jobType": "software-engineer",
  "jobLevel": "mid",
  "interviewType": "behavioral"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "firstQuestion": {
      "id": "q1",
      "text": "請用 STAR 法則描述一次你解決技術衝突的經驗？",
      "hint": "描述 Situation、Task、Action、Result 四個部分"
    },
    "totalQuestions": 5
  }
}
```

### 3.2 POST /api/interview/answer

**描述：** 提交回答，獲得 AI 回饋與下一題

**Request:**
```json
{
  "sessionId": "uuid",
  "questionId": "q1",
  "answerText": "在我擔任 Tech Lead 的專案中..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "score": 82,
    "feedback": "你的 STAR 結構完整，建議在 Result 部分更具體量化成果...",
    "dimensions": {
      "structure": 90,
      "depth": 75,
      "relevance": 85,
      "clarity": 80
    },
    "nextQuestion": {
      "id": "q2",
      "text": "能否舉例說明你如何處理團隊成員之間的意見分歧？"
    }
  }
}
```

### 3.3 POST /api/interview/end

**描述：** 結束面試，生成完整報告

**Request:**
```json
{
  "sessionId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "overallScore": 78,
    "summary": "整體表現良好，STAR 格式掌握度高，建議加強技術深度..."
  }
}
```

### 3.4 GET /api/report/:id

**描述：** 取得完整報告

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "interviewId": "uuid",
    "overallScore": 78,
    "strengths": ["STAR 格式正確", "表達邏輯清晰"],
    "improvements": ["量化成果不夠具體", "深度略顯不足"],
    "radarData": {
      "structure": 90,
      "depth": 65,
      "relevance": 80,
      "clarity": 85,
      "confidence": 75
    },
    "answers": [
      { "questionId": "q1", "score": 82, "feedback": "..." },
      ...
    ]
  }
}
```

### 3.5 GET /api/usage

**描述：** 查詢當前用量（Free: 3次/週, Basic: 10次/週）

**Response (200):**
```json
{
  "success": true,
  "data": {
    "plan": "free",
    "usedThisWeek": 2,
    "limitThisWeek": 3,
    "resetAt": "2026-04-07T00:00:00Z"
  }
}
```

---

## 4. Phase 1 功能範圍（MVP Scope）

### 4.1 明確做的（In Scope）

| 功能 | 說明 |
|------|------|
| ✅ 用戶認證 | Clerk Google/LINE 登入，無持久化（Phase 2 再接 DB） |
| ✅ 職位選擇 | 選擇產業/職位/級別 |
| ✅ 文字問答流程 | 5 題行為面試題，文字輸入回答 |
| ✅ AI 即時回饋 | 每題提交後 AI 評分 + 改進建議 |
| ✅ 簡單報告頁 | 顯示各題分數與總結文字 |
| ✅ 歷史記錄 | Dashboard 顯示過去面試記錄（localStorage） |
| ✅ API Key 管理 | Settings 頁面設定個人 AI API Key |
| ✅ 響應式 UI | 支援手機/平板/桌機 |

### 4.2 明確不做的（Out of Scope for Phase 1）

| 功能 | 原因 |
|------|------|
| ❌ 語音輸入/輸出 | Phase 2（Whisper + TTS，需穩定性優化） |
| ❌ 技術面題庫 | Phase 2 |
| ❌ 資料庫持久化 | Phase 2（Supabase） |
| ❌ 訂閱/用量限制系統 | Phase 2 |
| ❌ 雷達圖報告 | Phase 2 |
| ❌ PDF 匯出 | Phase 2 |
| ❌ 企業版功能 | Phase 3 |
| ❌ 多輪追問 | Phase 2 |

---

## 5. AI 提示詞設計（Prompt Templates）

### 5.1 面試問題生成

```
你是專業的 AI 面試官，專精於[職位類型]候選人的行為面試。
根據求職者的[職位]和[級別]，生成一道符合 STAR 原則的行為面試問題。

要求：
- 題目要具體，不要過於 general
- 適合評估候選人在真實工作中的表現
- 中文題目

請只回傳一道問題，格式：
問題：[題目文字]
提示：[給求職者的回答提示，可選]
```

### 5.2 回答評估

```
你是專業的面試教練。求職者回答了一道面試問題，請評估其回答品質。

求職者回答：
{answer}

評估維度（每項 0-100）：
1. STAR 結構：是否完整描述 Situation, Task, Action, Result
2. 深度：是否有具體細節和量化結果
3. 相關性：是否與目標職位相關
4. 表達清晰度：邏輯是否清晰

請回傳 JSON：
{
  "score": 0-100,
  "dimensions": { "structure": N, "depth": N, "relevance": N, "clarity": N },
  "feedback": "具體改進建議，1-2句話"
}
```

---

## 6. 驗收標準（Phase 1）

- [ ] 用戶可完成 Google/LINE 登入
- [ ] 可選擇職位並開始模擬面試
- [ ] 5 題行為面試題完整流暢
- [ ] 每題提交後 3 秒內獲得 AI 回饋
- [ ] 面試結束可看到簡單報告（總分 + 各題分數）
- [ ] Dashboard 顯示歷史記錄
- [ ] UI 響應式，無 console error
- [ ] 無敏感資訊外洩

---

## 7. 依賴與前置條件

| 依賴 | 狀態 | 負責人 |
|------|------|--------|
| Clerk API Key | 待確認 | Alan |
| MiniMax/OpenAI API Key | 用戶自備（BYOK） | Alan |
| Supabase 專案 | Phase 2 再建立 | Alan |
| Vercel 部署 | 現有專案可直接部署 | Alan |

---

*本文檔由 Alan 依 Sophia 規格計劃書 v1.0 撰寫，作為 Phase 1 實作依據。*
