# AI Interview Assistant — UI 優化設計文件

**日期:** 2026-04-05
**作者:** Alan (CTO)
**版本:** 1.0

---

## 1. 現況分析

### 1.1 現有 UI 問題

| 問題 | 說明 |
|------|------|
| 視覺太陽春 | 漸層、按鈕、卡片過於通用，無差異化 |
| 缺乏商業氛圍 | 配色和排版偏向遊戲/極客風，而非專業商務 |
| 無中英文切換 | 右上角僅有簡單 nav links |
| 打字感過重 | 缺少微互動、hover、回饋動畫 |
| 面試模擬感不足 | 缺少「正式面試」的莊重感 |

### 1.2 現有技術棧

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + 自定義 CSS
- **Auth:** Clerk (但 AuthProvider 是 localStorage mock)
- **Icons:** Lucide React
- **部署:** Vercel + GitHub Pages (需設定)

---

## 2. 設計目標

1. **專業商務感** — 營造如真實企業面試的嚴肅、專業氛圍
2. **中英文切換** — 右上角一目了然，支援完整 UI 文本切換
3. **Premium 質感** — 拋棄陽春感，升級為付費產品等級 UI
4. **保留功能** — 所有現有功能（語音輸入、API Key 設定、歷史記錄）不變

---

## 3. 設計語言

### 3.1 色彩系統

```
Primary:        #6366F1 (Indigo-500) — 專業感主色
Primary Dark:   #4F46E5 (Indigo-600)
Accent Gold:    #F59E0B (Amber-500) — 商業/成功訊號
Accent Emerald: #10B981 (Emerald-500) — 正確/完成
Danger:         #EF4444 (Red-500)

Background:     #09090B (Zinc-950) — 深黑底
Surface:        #18181B (Zinc-900) — 卡片/面板
Surface Light:  #27272A (Zinc-800) — 輸入框/次級元素
Border:         #3F3F46 (Zinc-700) — 邊框
Text Primary:   #FAFAFA (Zinc-50)
Text Secondary: #A1A1AA (Zinc-400)
Text Muted:     #52525B (Zinc-600)
```

### 3.2 字體

- **標題:** Inter (Google Fonts) — weight 600~800
- **內文:** Inter — weight 400~500
- **代碼/答案:** JetBrains Mono — 答案建議區域

### 3.3 動效哲學

- **Entrance:** opacity 0→1 + translateY(8px→0), 300ms ease-out
- **Hover:** scale(1.02) + shadow lift, 150ms
- **Button press:** scale(0.97), 100ms
- **Listening pulse:** 柔和的紅色 pulse，不要過於刺眼
- **Card glass:** backdrop-blur-sm + subtle border glow on hover

### 3.4 間距系統

- Section padding: 64px~96px vertical
- Card padding: 24px~32px
- Grid gap: 16px~24px
- Input height: 48px

---

## 4. 功能模組設計

### 4.1 全域 Language Switcher

**位置:** Navbar 右上角（在 Nav links 左側）

**設計:**
- 兩個語言標籤：`中文` / `EN` — 以 toggle button 呈現
- 當前語言高亮（底線或背景色）
- 使用 React Context (LocaleContext) 跨所有頁面共享
- 點擊即時切換，無需 reload
- 語言偏好寫入 localStorage (`locale`)

**翻譯覆蓋范围:**
- Landing page (Hero, Features, Footer)
- Interview page (所有 UI 標籤、placeholder、status 訊息)
- Dashboard page
- Settings page
- Pricing page
- Nav links

### 4.2 Landing Page 重新設計

**Hero Section:**
- 背景: 深邃黑 (#09090B) + 精緻 radial gradient（indigo 光暈左上角）
- 主標題: 更大、更粗 (5xl~6xl)，字間距微調
- 副標題: 降低對比度，改為 text-zinc-400
- CTA 按鈕: 添加 shadow-glow 效果
- Mock UI 展示區: 添加玻璃質感（backdrop-blur + 半透明边框）

**Features Section:**
- 卡片: glassmorphism 效果（backdrop-blur-sm, border-zinc-700/50）
- Hover: 邊框變亮 + 微上浮
- 圖標: 統一使用 Lucide React 線框圖標

**新增麵包屑/信任狀區塊:**
- 「已幫助 10,000+ 求職者準備面試」
- 「支援 Zoom / Teams / Meet」

### 4.3 Interview Page 重新設計

**頂部狀態列:**
- 重新設計為「面試狀態卡」— 更有正式感
- 麥克風狀態: 圓形指示燈 + 文字標籤
- API Key 狀態: 圖標 + 文字

**問題輸入區:**
- 更大的輸入框，更粗的字體
- placeholder 更有幫助性（根據當前語言）
- 分析中: 更精緻的 loading 動畫（不只是 spin）

**答案展示區:**
- 答案卡片使用 glassmorphism
- 答案文字使用 JetBrains Mono
- 分區標籤（答案/參考資料/Follow-up）使用 Tab 樣式

**歷史記錄側邊欄:**
- 更緊湊的列表設計
- 每筆記錄有更好的視覺區分

### 4.4 Dashboard Page 重新設計

- 統計卡片: 更大的數字 + 更精緻的 icon
- 趨勢指示: 上下箭頭 + 數字變化
- 歷史列表: 更好的分組（今天/昨天/更早）

---

## 5. 技術實現方案

### 5.1 i18n 架構

```
app/
  i18n/
    locale-context.tsx    # React Context for locale state
    translations.ts       # All translation strings (ZH/EN)
  components/
    locale-provider.tsx   # Wraps app with context
    language-switcher.tsx # The toggle UI component
```

**翻譯結構:**
```typescript
const translations = {
  zh: {
    nav: { home: '首頁', interview: '面試', dashboard: '儀表板', pricing: '定價', settings: '設定' },
    hero: { subtitle: '...', cta: { start: '免費開始', viewFeatures: '查看功能' } },
    interview: { status: { ready: '準備就緒', listening: '正在聆聽...', analyzing: 'AI 分析中...' }, ... },
    ...
  },
  en: { ... }
}
```

### 5.2 樣式升級

- Tailwind config: 新增自定義 colors, fontFamily, animation
- globals.css: 全域字體載入、滾動條美化、selection 顏色
- 組件層級: 各 page 的 `<style>` 標籤或 inline styles 逐步遷移到 Tailwind

### 5.3 GitHub Pages 部署

- `next.config.js`: 設定 `output: 'export'` + basePath
- 靜態 HTML 輸出到 `out/` 目錄
- GitHub Actions: 自動化 build + deploy
- 燒錄 GitHub Pages URL 到 README

---

## 6. 實施計劃

### Phase 1: 基礎設施
- [ ] 建立 i18n 架構（locale-context, translations）
- [ ] 建立 LanguageSwitcher 組件
- [ ] 在 layout.tsx 包裝 LocaleProvider
- [ ] 設定 localStorage 持久化

### Phase 2: Landing Page UI 升級
- [ ] 更新 globals.css (字體、滾動條、selection)
- [ ] 更新 tailwind.config.js (新 color palette)
- [ ] 重設計 Hero section
- [ ] 重設計 Features section
- [ ] 新增信任狀/統計區塊

### Phase 3: Interview Page UI 升級
- [ ] 整合 LanguageSwitcher 到 Navbar
- [ ] 重設計狀態列
- [ ] 重設計答案卡片
- [ ] 添加微動效 (entrance animations)
- [ ] 全頁面翻譯覆蓋

### Phase 4: 其他頁面 + 部署
- [ ] Dashboard 頁面翻譯
- [ ] Settings 頁面翻譯
- [ ] Pricing 頁面翻譯
- [ ] GitHub Pages 部署設定
- [ ] 更新 README 部署 URL
- [ ] 提交給 Sophia 驗收

---

## 7. 驗收標準

- [ ] 右上角可見中英文切換，點擊即時切換全頁面語言
- [ ] Landing page 具備專業商務面試氛圍（不再陽春）
- [ ] Interview page 所有 UI 元素皆雙語化
- [ ] GitHub Pages 可正常訪問
- [ ] 所有現有功能（語音、API Key、歷史）正常運作
- [ ] Mobile responsive 保持完好
