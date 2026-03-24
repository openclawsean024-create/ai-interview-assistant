import Link from 'next/link';

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>
          <span className="gradient-text">AI Interview</span> Assistant
        </Link>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <Link href="/pricing" style={{ color: '#667eea', fontSize: '15px' }}>定價</Link>
          <Link href="/interview" style={{ color: '#aaa', fontSize: '15px' }}>功能</Link>
          <Link href="/sign-in">
            <button className="btn-outline" style={{ padding: '8px 20px', fontSize: '14px' }}>登入</button>
          </Link>
          <Link href="/sign-up">
            <button className="btn-brand" style={{ padding: '8px 20px', fontSize: '14px' }}>開始使用</button>
          </Link>
        </div>
      </nav>

      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: 'white', marginBottom: '16px' }}>
            簡單<span className="gradient-text"> 定價方案</span>
          </h1>
          <p style={{ color: '#888', fontSize: '18px' }}>
            使用你自己的 OpenAI API Key，我們不墊付任何費用。<br />
            所有方案皆可免費試用。
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Free */}
          <div className="card">
            <div style={{ fontSize: '14px', color: '#888', fontWeight: 600, letterSpacing: '1px', marginBottom: '8px' }}>FREE</div>
            <div style={{ fontSize: '42px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>$0<span style={{ fontSize: '16px', color: '#888', fontWeight: 400 }}>/月</span></div>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>適合初次體驗</p>
            <Link href="/sign-up">
              <button className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>開始免費使用</button>
            </Link>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['每秒即時語音辨識', 'GPT-4o 答案建議', '參考資料連結', '問答歷史（20條）', '語音朗讀', '基本使用儀表板'].map((f) => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: '#ccc' }}>
                  <span style={{ color: '#22c55e' }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
          <div style={{ background: 'rgba(102,126,234,0.08)', border: '2px solid #667eea', borderRadius: '20px', padding: '32px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: 'white' }}>最受歡迎</div>
            <div style={{ fontSize: '14px', color: '#667eea', fontWeight: 600, letterSpacing: '1px', marginBottom: '8px' }}>PRO</div>
            <div style={{ fontSize: '42px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>$9<span style={{ fontSize: '16px', color: '#888', fontWeight: 400 }}>/月</span></div>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>專業面試者推薦</p>
            <Link href="/sign-up">
              <button className="btn-brand" style={{ width: '100%' }}>升級到 Pro</button>
            </Link>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Everything in Free', '問答歷史（200條）', '多語言支援（EN/ZH/JP/KR）', '優先 AI 回應速度', '面試練習模式', '匯出複習報告（Markdown）'].map((f) => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: '#ccc' }}>
                  <span style={{ color: '#667eea' }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Business */}
          <div className="card">
            <div style={{ fontSize: '14px', color: '#888', fontWeight: 600, letterSpacing: '1px', marginBottom: '8px' }}>BUSINESS</div>
            <div style={{ fontSize: '42px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>$29<span style={{ fontSize: '16px', color: '#888', fontWeight: 400 }}>/月</span></div>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>團隊面試訓練</p>
            <Link href="/sign-up">
              <button className="btn-outline" style={{ width: '100%' }}>聯絡我們</button>
            </Link>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Everything in Pro', '無限制問答歷史', '團隊共享練習記錄', '客製化答案模板', 'API 整合', '優先客戶支援'].map((f) => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: '#ccc' }}>
                  <span style={{ color: '#22c55e' }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={{ textAlign: 'center', marginTop: '48px', padding: '24px', background: 'rgba(102,126,234,0.05)', borderRadius: '12px', border: '1px solid rgba(102,126,234,0.1)' }}>
          <p style={{ color: '#888', fontSize: '14px' }}>
            💡 <strong style={{ color: '#ccc' }}>提示：</strong>所有方案均需用戶自備 OpenAI API Key。
            我們僅提供 AI 分析功能，不墊付任何 API 費用。
            <Link href="/settings" style={{ color: '#667eea', marginLeft: '4px' }}>設定你的 API Key →</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
