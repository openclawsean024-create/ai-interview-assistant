import Link from 'next/link';
import { LanguageSwitcher } from '@/app/components/language-switcher';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-900/8 blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 lg:px-20 py-5 border-b border-zinc-800/50">
        <div className="text-xl md:text-2xl font-bold tracking-tight">
          <span className="gradient-text">AI Interview</span> <span className="text-zinc-400">Assistant</span>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/pricing" className="nav-link">定價</Link>
          <Link href="/interview" className="nav-link">功能</Link>
          <Link href="/sign-in">
            <button className="btn-outline text-sm px-5 py-2">登入</button>
          </Link>
          <Link href="/sign-up">
            <button className="btn-brand text-sm px-5 py-2">開始使用</button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">登入</Link>
          <Link href="/sign-up" className="btn-brand text-sm px-5 py-2">開始使用</Link>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 py-20 md:py-28 lg:py-32 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-400 text-xs font-medium tracking-wide mb-6">
          ✦ 商業級 AI 面試助手
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 text-zinc-50 animate-fade-in-up stagger-1">
          面試時的<br />
          <span className="gradient-text">秘密武器</span>
        </h1>
        <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in-up stagger-2">
          Zoom、Teams、Google Meet 面試時，AI 即時分析問題，提供專業答案建議與權威參考資料。
        </p>
        <div className="flex gap-4 justify-center flex-wrap animate-fade-in-up stagger-3">
          <a href="chrome://extensions/" onClick={() => alert('請開啟 chrome://extensions/ 並啟用開發者模式，然後載入未封裝項目（選擇包含 manifest.json 的資料夾）')}>
            <button className="btn-brand text-base px-10 py-4 shadow-glow">
              🤖 安裝 Chrome 插件
            </button>
          </a>
          <Link href="/interview">
            <button className="btn-outline text-base px-10 py-4">
              查看功能
            </button>
          </Link>
        </div>
        <div className="mt-6 text-center text-zinc-500 text-sm animate-fade-in-up stagger-3">
          安裝插件後，Alt+Shift+M 面試即時監聽 — 無需登入
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
                    &ldquo;Can you explain how React&apos;s virtual DOM works and why it improves performance?&rdquo;
                  </div>
                  <div className="border-t border-zinc-800 pt-5">
                    <div className="answer-tab mb-3">🤖 AI 建議答案</div>
                    <div className="answer-prose bg-[#09090B] rounded-lg p-5 overflow-x-auto border border-zinc-800/60">
                      <span className="text-emerald-400">const</span> <span className="text-blue-400">answer</span> <span className="text-zinc-500">=</span> <span className="text-amber-300">&quot;React uses a virtual DOM to minimize expensive direct DOM manipulations by batching updates and computing minimal differences...&quot;</span>;
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-500/12 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">React</span>
                    <span className="text-xs bg-blue-500/12 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">Virtual DOM</span>
                    <span className="text-xs bg-blue-500/12 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">Performance</span>
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
          <span className="flex items-center gap-2 text-zinc-500">✓ 10,000+ 求職者驗證</span>
          <span className="flex items-center gap-2 text-zinc-500">✓ 2-3 秒生成答案</span>
          <span className="flex items-center gap-2 text-zinc-500">✓ 企業級資料保密</span>
          <span className="flex items-center gap-2 text-zinc-500">✓ Zoom / Teams / Meet</span>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20 md:py-28 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 text-center mb-4 tracking-tight">
          為什麼選擇 AI Interview Assistant？
        </h2>
        <p className="text-zinc-500 text-center mb-14 text-base">專業功能，助你面試脫穎而出</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: '🎤', title: '語音辨識', desc: '自動聆聽面試官問題，無需手動輸入，專注面試表現' },
            { icon: '⚡', title: '2-3 秒回應', desc: 'AI 即時分析問題，生成專業答案建議，領先競爭對手' },
            { icon: '📚', title: '參考資料', desc: '自動抓取 MDN、React Docs 等權威技術文檔' },
            { icon: '🔊', title: '文字轉語音', desc: 'AI 朗讀答案，保持眼神接觸，給面試官好印象' },
            { icon: '📊', title: '練習歷史', desc: '記錄所有練習記錄，追蹤進步軌跡' },
            { icon: '🔑', title: '自帶 API Key', desc: 'BYOK 模式，無需訂閱，按使用量付費' },
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
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 mb-4 tracking-tight">立即提升面試表現</h2>
          <p className="text-zinc-500 mb-10 text-sm">免費方案即可使用核心功能，Pro 方案解鎖多語言與報告導出</p>
          <Link href="/sign-up">
            <button className="btn-brand px-10 py-4 shadow-glow">免費開始</button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-zinc-600 text-xs">
            AI Interview Assistant © 2024 — Built with Next.js + OpenAI
          </div>
          <div className="flex gap-6 text-xs text-zinc-600">
            <a href="https://github.com/openclawsean024-create/ai-interview-assistant" target="_blank" rel="noopener" className="hover:text-zinc-400 transition-colors">GitHub</a>
            <a href="https://openclawsean024-create.github.io/ai-interview-assistant/" target="_blank" rel="noopener" className="hover:text-zinc-400 transition-colors">GitHub Pages</a>
            <a href="https://ai-interview-assistant-ldh0dtbwj-seans-projects-7dc76219.vercel.app" target="_blank" rel="noopener" className="hover:text-zinc-400 transition-colors">Vercel</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
