'use client';

import Link from 'next/link';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import SessionInit from '@/app/components/session-init';
import DemoModeBadge from '@/app/components/demo-mode-badge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] relative overflow-hidden">
      <SessionInit />

      {/* Background radial glow */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-900/8 blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 lg:px-20 py-5 border-b border-zinc-800/50">
        <div className="text-xl md:text-2xl font-bold tracking-tight">
          <span className="gradient-text">AI Interview</span> <span className="text-zinc-400">Assistant</span>
          <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            v3.0
          </span>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/pricing" className="nav-link">定價</Link>
          <Link href="/interview" className="nav-link">開始練習</Link>
          <Link href="/settings" className="nav-link">設定</Link>
          <Link href="/sign-in">
            <button className="btn-outline text-sm px-5 py-2">登入</button>
          </Link>
          <Link href="/interview">
            <button className="btn-brand text-sm px-5 py-2">開始使用</button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">登入</Link>
          <Link href="/interview" className="btn-brand text-sm px-5 py-2">開始練習</Link>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 py-20 md:py-28 lg:py-32 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-400 text-xs font-medium tracking-wide mb-6">
          ✦ v3.0 實作契約補完 — 預設 Mock 模式，無需 API Key 也能練習
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 text-zinc-50 animate-fade-in-up stagger-1">
          面試前的<br />
          <span className="gradient-text">演練 + 證據化複盤</span>
        </h1>
        <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in-up stagger-2">
          繁中、職缺客製、面試前演練 + 面試後證據化複盤。即時提示只保留為 opt-in 的低風險教練，**不做隱藏式代答**。
        </p>
        <div className="flex gap-4 justify-center flex-wrap animate-fade-in-up stagger-3">
          <Link href="/interview">
            <button className="btn-brand text-base px-10 py-4 shadow-glow">
              🎯 立即開始練習
            </button>
          </Link>
          <a href="chrome://extensions/">
            <button
              className="btn-outline text-base px-10 py-4"
              onClick={() => alert('請在 chrome://extensions/ 啟用開發者模式，選擇「載入未封裝項目」並選取包含 manifest.json 的資料夾')}
            >
              🤖 安裝 Chrome 插件
            </button>
          </a>
        </div>
        <div className="mt-6 flex justify-center">
          <DemoModeBadge />
        </div>

        {/* Mock UI */}
        <div className="mt-16 max-w-4xl mx-auto animate-fade-in-up stagger-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/10 to-transparent rounded-3xl blur-xl" />
            <div className="relative glass-card border border-zinc-700/50 p-1">
              <div className="bg-[#09090B] rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="flex gap-2 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <div className="bg-[#18181B] rounded-xl p-5 md:p-7 text-left space-y-5 border border-zinc-800/80">
                  <div className="answer-tab">🎤 面試官</div>
                  <div className="text-zinc-300 text-sm md:text-base leading-relaxed">
                    「請用 STAR 法則描述一次你主導解決技術衝突的經驗？」
                  </div>
                  <div className="border-t border-zinc-800 pt-5">
                    <div className="answer-tab mb-3">🤖 AI 教練回饋（Demo Mode）</div>
                    <div className="answer-prose bg-[#09090B] rounded-lg p-5 border border-zinc-800/60 text-zinc-300">
                      STAR 結構基本正確（score 78），建議在 Result 量化具體數字（%、金額、時間）。深度略顯不足，可補充技術細節。
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-500/12 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">STAR</span>
                    <span className="text-xs bg-blue-500/12 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">Leadership</span>
                    <span className="text-xs bg-blue-500/12 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">Rehearsal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="relative z-10 border-y border-zinc-800/50 py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-zinc-600 text-sm">
          <span className="flex items-center gap-2 text-zinc-500">✓ Mock 模式免費可用</span>
          <span className="flex items-center gap-2 text-zinc-500">✓ 3 次免費面試演練</span>
          <span className="flex items-center gap-2 text-zinc-500">✓ 資料存於瀏覽器</span>
          <span className="flex items-center gap-2 text-zinc-500">✓ 一鍵刪除</span>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20 md:py-28 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 text-center mb-4 tracking-tight">
          v3.0 三大差異
        </h2>
        <p className="text-zinc-500 text-center mb-14 text-base">對應 SPEC §16 / §17 / §18</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: '🎭', title: 'Mock 模式預設', desc: '無需 API Key 即可離線練習 3 次完整面試，BYOK 在 Settings 切換。' },
            { icon: '🪪', title: 'anonymous-first', desc: '進站即可使用，不要求註冊。localStorage cuid + 一鍵刪除。' },
            { icon: '🛟', title: '降級不丟資料', desc: 'LLM timeout 自動降級 Mock，草稿保留。SPEC §5.3 落地。' },
            { icon: '🧪', title: '可量測驗證', desc: '20 條 Acceptance Criteria，§18.3 18 條手動清單。' },
            { icon: '🌐', title: '雙部署目標', desc: 'Vercel production + GitHub Pages 靜態鏡像，env vars 0。' },
            { icon: '📜', title: 'Open SPEC', desc: '完整規格書 + CHANGELOG 在 PRD/，可被其他 agent 讀取。' },
          ].map((f, i) => (
            <div key={i} className="card hover:border-blue-500/30 transition-all duration-200 hover:-translate-y-1 group animate-fade-in-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-zinc-100 font-semibold text-base mb-2 group-hover:text-blue-400 transition-colors">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 mb-4 tracking-tight">立即體驗 v3.0</h2>
          <p className="text-zinc-500 mb-10 text-sm">免費方案即可使用核心功能，無需註冊、無需 API Key</p>
          <Link href="/interview">
            <button className="btn-brand px-10 py-4 shadow-glow">🎯 開始第一次練習</button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-zinc-600 text-xs">
              AI Interview Assistant v3.0 — SPEC v3.0 (sweet=5, investigate) — 2026-08-08
            </div>
            <div className="flex gap-6 text-xs text-zinc-600">
              <a href="https://github.com/openclawsean024-create/ai-interview-assistant" target="_blank" rel="noopener" className="hover:text-zinc-400 transition-colors">GitHub</a>
              <a href="https://github.com/openclawsean024-create/ai-interview-assistant/blob/master/PRD/SPEC.md" target="_blank" rel="noopener" className="hover:text-zinc-400 transition-colors">SPEC v3.0</a>
              <a href="https://github.com/openclawsean024-create/ai-interview-assistant/blob/master/PRD/CHANGELOG.md" target="_blank" rel="noopener" className="hover:text-zinc-400 transition-colors">CHANGELOG</a>
              <a href="https://ai-interview-assistant.vercel.app" target="_blank" rel="noopener" className="hover:text-zinc-400 transition-colors">Vercel</a>
            </div>
          </div>
          <div className="flex justify-center">
            <DemoModeBadge />
          </div>
        </div>
      </footer>
    </div>
  );
}
