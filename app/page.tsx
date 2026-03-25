import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 md:px-12 lg:px-16 py-5 border-b border-white/5">
        <div className="text-xl md:text-2xl font-bold">
          <span className="gradient-text">AI Interview</span> Assistant
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/pricing" className="text-[#aaa] text-sm hover:text-white transition-colors">定價</Link>
          <Link href="/interview" className="text-[#aaa] text-sm hover:text-white transition-colors">功能</Link>
          <Link href="/sign-in">
            <button className="btn-outline text-sm px-5 py-2">登入</button>
          </Link>
          <Link href="/sign-up">
            <button className="btn-brand text-sm px-5 py-2">開始使用</button>
          </Link>
        </div>
        {/* Mobile */}
        <Link href="/sign-up" className="md:hidden">
          <button className="btn-brand text-xs px-4 py-2">開始</button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="text-center px-4 py-16 md:py-24 lg:py-28">
        <div className="text-xs text-[#667eea] font-semibold tracking-widest mb-4">面試表現 → 提升一個檔次</div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-white">
          任何面試問題<br />
          <span className="gradient-text">即時 AI 答案建議</span>
        </h1>
        <p className="text-base md:text-lg text-[#888] max-w-xl mx-auto mb-10 leading-relaxed">
          在 Zoom、Teams、Google Meet 進行遠端面試時，AI 即時聆聽問題，
          分析並在側邊欄顯示專業答案建議與參考資料。
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/sign-up">
            <button className="btn-brand text-base px-8 py-3.5">
              免費開始使用
            </button>
          </Link>
          <Link href="/interview">
            <button className="btn-outline text-base px-8 py-3.5">
              查看功能
            </button>
          </Link>
        </div>

        {/* Mock UI */}
        <div className="mt-14 max-w-4xl mx-auto px-2">
          <div className="bg-[#1a1a2e]/90 border border-[#667eea]/20 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
            <div className="flex gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <div className="bg-[#1a1a2e] rounded-xl p-4 md:p-6 text-left space-y-4">
              <div className="text-[#667eea] text-sm font-semibold">🎤 面試官：</div>
              <div className="text-[#ccc] text-sm md:text-base leading-relaxed">
                &ldquo;Can you explain how React&apos;s virtual DOM works and why it improves performance?&rdquo;
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="text-[#667eea] text-sm font-semibold mb-2">🤖 AI 建議答案：</div>
                <div className="text-[#e0e0e0] text-sm md:text-base leading-relaxed font-mono bg-[#0f0f1a] rounded-lg p-4 overflow-x-auto">
                  <span className="text-green-400">const</span> <span className="text-blue-400">answer</span> = <span className="text-yellow-400">&quot;React uses a virtual DOM to minimize expensive direct DOM manipulations by batching updates and computing minimal differences...&quot;</span>;
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-[#667eea]/15 text-[#667eea] px-2.5 py-1 rounded-full">React</span>
                <span className="text-xs bg-[#667eea]/15 text-[#667eea] px-2.5 py-1 rounded-full">Virtual DOM</span>
                <span className="text-xs bg-[#667eea]/15 text-[#667eea] px-2.5 py-1 rounded-full">Performance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 md:py-20 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">為什麼選擇 AI Interview Assistant？</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🎤', title: '語音辨識', desc: '自動聆聽面試官問題，無需手動輸入，專注面試表現' },
            { icon: '⚡', title: '2-3 秒回應', desc: 'AI 即時分析問題，生成專業答案建議，領先競爭對手' },
            { icon: '📚', title: '參考資料', desc: '自動抓取 MDN、React Docs 等權威技術文檔' },
            { icon: '🔊', title: '文字轉語音', desc: 'AI 朗讀答案，保持眼神接觸，給面試官好印象' },
            { icon: '📊', title: '練習歷史', desc: '記錄所有練習記錄，追蹤進步軌跡' },
            { icon: '🔑', title: '自帶 API Key', desc: 'BYOK 模式，無需訂閱，按使用量付費' },
          ].map((f, i) => (
            <div key={i} className="card hover:border-[#667eea]/40 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-[#666] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">開始提升你的面試表現</h2>
        <p className="text-[#666] mb-8 text-sm">免費方案即可使用核心功能，Pro 方案解鎖更多語言和導出報告</p>
        <Link href="/sign-up">
          <button className="btn-brand px-8 py-3.5">免費開始</button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-8 text-center text-[#444] text-xs">
        <div>AI Interview Assistant © 2024 — Built with Next.js + OpenAI</div>
      </footer>
    </div>
  );
}
