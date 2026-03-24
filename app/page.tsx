import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '22px', fontWeight: 700 }}>
          <span className="gradient-text">AI Interview</span> Assistant
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <Link href="/pricing" style={{ color: '#aaa', fontSize: '15px' }}>定價</Link>
          <Link href="/interview" style={{ color: '#aaa', fontSize: '15px' }}>功能</Link>
          <Link href="/sign-in">
            <button className="btn-outline" style={{ padding: '8px 20px', fontSize: '14px' }}>登入</button>
          </Link>
          <Link href="/sign-up">
            <button className="btn-brand" style={{ padding: '8px 20px', fontSize: '14px' }}>開始使用</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 40px 80px' }}>
        <div style={{ fontSize: '14px', color: '#667eea', fontWeight: 600, letterSpacing: '2px', marginBottom: '16px' }}>面試表現 → 提升一個檔次</div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '24px', color: 'white' }}>
          任何面試問題<br />
          <span className="gradient-text">即時 AI 答案建議</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#888', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          在 Zoom、Teams、Google Meet 進行遠端面試時，AI 即時聆聽問題、<br />
          分析並在側邊欄顯示專業答案建議與參考資料。
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up">
            <button className="btn-brand" style={{ fontSize: '16px', padding: '14px 36px' }}>
              免費開始使用
            </button>
          </Link>
          <Link href="/interview">
            <button className="btn-outline" style={{ fontSize: '16px', padding: '14px 36px' }}>
              查看功能
            </button>
          </Link>
        </div>

        {/* Mock UI */}
        <div style={{ marginTop: '60px', maxWidth: '800px', margin: '60px auto 0', position: 'relative' }}>
          <div style={{ background: 'rgba(26,26,46,0.9)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }}></div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></div>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
              <div style={{ color: '#667eea', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>🎤 面試官：</div>
              <div style={{ color: '#ccc', fontSize: '15px', marginBottom: '16px' }}>"Can you explain how React's virtual DOM works and why it improves performance?"</div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <div style={{ color: '#667eea', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>🤖 AI 建議答案：</div>
                <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: 1.7 }}>
                  React's Virtual DOM is a lightweight copy of the actual DOM. When state changes, React creates a new virtual DOM tree, diffs it with the previous one (reconciliation), and only updates the minimal necessary changes in the real DOM...
                </div>
                <div style={{ marginTop: '12px', color: '#4a9eff', fontSize: '12px' }}>📚 參考: React Docs - Virtual DOM | Reconciliation Guide</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 60px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, marginBottom: '60px', color: 'white' }}>
          為何工程師<span className="gradient-text"> 選擇我們</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            { icon: '🎤', title: '語音即時聆聽', desc: '自動偵測麥克風輸入，Listening 模式一鍵啟動，無需手動輸入問題' },
            { icon: '⚡', title: '秒級 AI 回應', desc: '串接 GPT-4o，問題提出後 2-3 秒內顯示專業答案建議與思路' },
            { icon: '📚', title: '智能參考資料', desc: '自動整理相關技術文檔、Stack Overflow 文章連結，加速深度回答' },
            { icon: '🔊', title: '語音朗讀', desc: '一鍵朗讀答案，幫助你不中斷面試節奏，專注眼神接觸' },
            { icon: '📊', title: '問答歷史記錄', desc: '完整保存每次問答，面試後可匯出複習，強化面試技巧' },
            { icon: '🔒', title: '你的鑰匙你管', desc: '使用自己的 API Key，我們不存取你的資料，隱私完全自己掌控' },
          ].map((f, i) => (
            <div key={i} className="card">
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'white' }}>{f.title}</h3>
              <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 40px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
          準備好提升面試表現了嗎？
        </h2>
        <p style={{ color: '#888', marginBottom: '32px' }}>免費方案即可使用所有核心功能，立即開始</p>
        <Link href="/sign-up">
          <button className="btn-brand" style={{ fontSize: '16px', padding: '14px 40px' }}>
            免費加入
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 60px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
        <div>© 2024 AI Interview Assistant. 使用你自己的 OpenAI API Key。</div>
      </footer>
    </div>
  );
}
