'use client';

import Link from 'next/link';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import { useLocale } from '@/app/i18n/locale-context';

export default function PricingPage() {
  const { t, locale } = useLocale();
  const isEnglish = locale === 'en';

  return (
    <div style={{ minHeight: '100vh', background: '#09090B' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 60px', borderBottom: '1px solid rgba(63,63,70,0.4)' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA' }}>
          <span className="gradient-text">AI Interview</span> <span style={{ color: '#71717A' }}>Assistant</span>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <LanguageSwitcher />
          <Link href="/pricing" style={{ color: '#818CF8', fontSize: '14px', fontWeight: 600 }}>{t.nav.pricing}</Link>
          <Link href="/interview" style={{ color: '#A1A1AA', fontSize: '14px' }}>{t.nav.interview}</Link>
          <Link href="/sign-in">
            <button className="btn-outline" style={{ padding: '8px 20px', fontSize: '14px' }}>{t.nav.signIn}</button>
          </Link>
          <Link href="/sign-up">
            <button className="btn-brand" style={{ padding: '8px 20px', fontSize: '14px' }}>{t.nav.signUp}</button>
          </Link>
        </div>
      </nav>

      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#FAFAFA', marginBottom: '16px', letterSpacing: '-0.02em' }}>
            {isEnglish ? 'Simple' : '簡單'}
            <span className="gradient-text"> {t.nav.pricing}</span>
          </h1>
          <p style={{ color: '#71717A', fontSize: '16px', lineHeight: 1.7 }}>
            {isEnglish
              ? 'Use your own OpenAI API Key — we never垫 any costs. All plans include a free trial.'
              : '使用你自己的 OpenAI API Key，我們不墊付任何費用。所有方案皆可免費試用。'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Free */}
          <div className="card" style={{ border: '1px solid rgba(63,63,70,0.5)' }}>
            <div style={{ fontSize: '12px', color: '#71717A', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '12px', textTransform: 'uppercase' }}>
              {isEnglish ? 'Free' : '免費'}
            </div>
            <div style={{ fontSize: '44px', fontWeight: 800, color: '#FAFAFA', marginBottom: '4px', letterSpacing: '-0.02em' }}>
              $0<span style={{ fontSize: '16px', color: '#71717A', fontWeight: 400 }}>{isEnglish ? '/mo' : '/月'}</span>
            </div>
            <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '28px' }}>
              {isEnglish ? 'Perfect for first-time users' : '適合初次體驗'}
            </p>
            <Link href="/sign-up">
              <button className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                {isEnglish ? 'Start Free' : '開始免費使用'}
              </button>
            </Link>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(isEnglish
                ? ['Real-time voice recognition', 'GPT-4o answer suggestions', 'Reference links', 'Q&A history (20)', 'Text-to-speech', 'Basic dashboard']
                : ['每秒即時語音辨識', 'GPT-4o 答案建議', '參考資料連結', '問答歷史（20條）', '語音朗讀', '基本使用儀表板']
              ).map((f) => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#A1A1AA' }}>
                  <span style={{ color: '#10B981', fontSize: '16px' }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '2px solid rgba(99,102,241,0.5)', borderRadius: '20px', padding: '32px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: 'white' }}>
              {isEnglish ? 'Most Popular' : '最受歡迎'}
            </div>
            <div style={{ fontSize: '12px', color: '#818CF8', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '12px', textTransform: 'uppercase', marginTop: '8px' }}>
              PRO
            </div>
            <div style={{ fontSize: '44px', fontWeight: 800, color: '#FAFAFA', marginBottom: '4px', letterSpacing: '-0.02em' }}>
              $9<span style={{ fontSize: '16px', color: '#71717A', fontWeight: 400 }}>{isEnglish ? '/mo' : '/月'}</span>
            </div>
            <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '28px' }}>
              {isEnglish ? 'Recommended for serious candidates' : '專業面試者推薦'}
            </p>
            <Link href="/sign-up">
              <button className="btn-brand" style={{ width: '100%' }}>
                {isEnglish ? 'Upgrade to Pro' : '升級到 Pro'}
              </button>
            </Link>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(isEnglish
                ? ['Everything in Free', 'Q&A history (200)', 'Multi-language (EN/ZH/JP/KR)', 'Priority AI response speed', 'Interview practice mode', 'Export review reports (Markdown)']
                : ['Everything in Free', '問答歷史（200條）', '多語言支援（EN/ZH/JP/KR）', '優先 AI 回應速度', '面試練習模式', '匯出複習報告（Markdown）']
              ).map((f) => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#A1A1AA' }}>
                  <span style={{ color: '#818CF8', fontSize: '16px' }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Business */}
          <div className="card" style={{ border: '1px solid rgba(63,63,70,0.5)' }}>
            <div style={{ fontSize: '12px', color: '#71717A', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '12px', textTransform: 'uppercase' }}>
              BUSINESS
            </div>
            <div style={{ fontSize: '44px', fontWeight: 800, color: '#FAFAFA', marginBottom: '4px', letterSpacing: '-0.02em' }}>
              $29<span style={{ fontSize: '16px', color: '#71717A', fontWeight: 400 }}>{isEnglish ? '/mo' : '/月'}</span>
            </div>
            <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '28px' }}>
              {isEnglish ? 'For team interview training' : '團隊面試訓練'}
            </p>
            <Link href="/sign-up">
              <button className="btn-outline" style={{ width: '100%' }}>
                {isEnglish ? 'Contact Us' : '聯絡我們'}
              </button>
            </Link>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(isEnglish
                ? ['Everything in Pro', 'Unlimited Q&A history', 'Team shared practice records', 'Custom answer templates', 'API integration', 'Priority support']
                : ['Everything in Pro', '無限制問答歷史', '團隊共享練習記錄', '客製化答案模板', 'API 整合', '優先客戶支援']
              ).map((f) => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#A1A1AA' }}>
                  <span style={{ color: '#10B981', fontSize: '16px' }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={{ textAlign: 'center', marginTop: '48px', padding: '24px', background: 'rgba(99,102,241,0.04)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.12)' }}>
          <p style={{ color: '#71717A', fontSize: '14px', lineHeight: 1.7 }}>
            💡 <strong style={{ color: '#A1A1AA' }}>
              {isEnglish ? 'Note:' : '提示：'}
            </strong>{' '}
            {isEnglish
              ? 'All plans require your own OpenAI API Key. We only provide AI analysis — no API costs are covered by us.'
              : '所有方案均需用戶自備 OpenAI API Key。我們僅提供 AI 分析功能，不墊付任何 API 費用。'}
            <Link href="/settings" style={{ color: '#818CF8', marginLeft: '6px' }}>
              {isEnglish ? 'Set up your API Key →' : '設定你的 API Key →'}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
