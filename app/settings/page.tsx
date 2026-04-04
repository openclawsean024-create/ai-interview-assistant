'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/app/i18n/locale-context';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const { t, locale } = useLocale();
  const isEnglish = locale === 'en';
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState('');

  useEffect(() => {
    if (isSignedIn && user?.id) {
      const stored = localStorage.getItem(`apikey_${user.id}`);
      if (stored) setApiKey(stored);
    }
  }, [isSignedIn, user?.id]);

  function saveApiKey() {
    if (!isSignedIn) { alert(isEnglish ? 'Please sign in first' : '請先登入'); return; }
    if (!apiKey.trim()) { alert(isEnglish ? 'Please enter an API Key' : '請輸入 API Key'); return; }
    localStorage.setItem(`apikey_${user?.id}`, apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function testApiKey() {
    if (!apiKey.trim()) { setTestStatus(isEnglish ? 'Please enter an API Key first' : '請先輸入 API Key'); return; }
    setTestStatus(isEnglish ? 'Testing...' : '測試中...');
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      setTestStatus(data.ok
        ? (isEnglish ? '✅ API Key is valid!' : '✅ API Key 有效！')
        : `❌ ${isEnglish ? 'Error' : '錯誤'}: ${data.error}`);
    } catch (e: any) {
      setTestStatus(`❌ ${isEnglish ? 'Test failed' : '測試失敗'}: ${e.message}`);
    }
  }

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818CF8' }}>
        {t.interview.loading}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <p style={{ color: '#71717A', fontSize: '14px' }}>{t.dashboard.loginRequired}</p>
        <Link href="/sign-in"><button className="btn-brand">{t.dashboard.goToSignIn}</button></Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090B' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 60px', borderBottom: '1px solid rgba(63,63,70,0.4)' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA' }}>
          <span className="gradient-text">AI Interview</span>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <LanguageSwitcher />
          <Link href="/dashboard" style={{ color: '#A1A1AA', fontSize: '14px' }}>{t.nav.dashboard}</Link>
          <Link href="/interview" style={{ color: '#A1A1AA', fontSize: '14px' }}>{t.nav.interview}</Link>
          <Link href="/pricing" style={{ color: '#A1A1AA', fontSize: '14px' }}>{t.nav.pricing}</Link>
          <Link href="/settings" style={{ color: '#818CF8', fontSize: '14px', fontWeight: 600 }}>{t.nav.settings}</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', marginBottom: '8px' }}>🔑 {isEnglish ? 'API Key Settings' : 'API Key 設定'}</h1>
        <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '32px', lineHeight: 1.6 }}>
          {isEnglish
            ? 'Enter your OpenAI API Key. We use your key for AI analysis only — never stored or used for anything else.'
            : '輸入你的 OpenAI API Key。我們使用你的 Key 來呼叫 AI 分析，不會儲存或使用你的 Key 做其他用途。'}
        </p>

        {/* Info box */}
        <div style={{ padding: '16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', marginBottom: '32px' }}>
          <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.8 }}>
            💡 <strong style={{ color: '#D4D4D8' }}>
              {isEnglish ? 'How to get an API Key:' : '如何取得 API Key：'}
            </strong><br />
            1. {isEnglish ? 'Go to' : '前往'} <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" style={{ color: '#818CF8' }}>platform.openai.com/api-keys</a><br />
            2. {isEnglish ? 'Click Create new secret key' : '點擊 Create new secret key'}<br />
            3. {isEnglish ? 'Copy and paste below' : '複製並貼上到下方輸入框'}<br />
            4. {isEnglish ? 'Costs are your responsibility (GPT-4o ~$0.01/call)' : '費用由你完全自負（GPT-4o 約 $0.01/次）'}
          </p>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#D4D4D8', marginBottom: '8px', fontWeight: 600 }}>
            {isEnglish ? 'OpenAI API Key' : 'OpenAI API Key'}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="input-field"
            style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={saveApiKey} className="btn-brand" style={{ flex: 1 }}>
              {saved ? '✅ ' + (isEnglish ? 'Saved!' : '已儲存！') : (isEnglish ? 'Save API Key' : '儲存 API Key')}
            </button>
            <button
              onClick={testApiKey}
              style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(63,63,70,0.6)', borderRadius: '10px', color: '#A1A1AA', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s' }}
              onMouseOver={(e) => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.target as HTMLElement).style.color = '#FAFAFA'; }}
              onMouseOut={(e) => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.target as HTMLElement).style.color = '#A1A1AA'; }}
            >
              {isEnglish ? 'Test Connection' : '測試連線'}
            </button>
          </div>
          {testStatus && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '13px', color: '#D4D4D8' }}>
              {testStatus}
            </div>
          )}
        </div>

        {/* Supported models */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', marginBottom: '12px' }}>
            {isEnglish ? 'Supported Models' : '支援的模型'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { name: 'GPT-4o', desc: isEnglish ? 'Fastest, smartest (default)' : '最快、最聰明（預設）', badge: isEnglish ? 'Recommended' : '推薦', badgeColor: 'rgba(99,102,241,0.2)', badgeText: '#818CF8' },
              { name: 'GPT-4o-mini', desc: isEnglish ? 'Fast, cost-effective' : '快速、便宜的選項', badge: isEnglish ? 'Save $' : '省錢', badgeColor: 'rgba(16,185,129,0.2)', badgeText: '#10B981' },
              { name: 'GPT-4 Turbo', desc: isEnglish ? 'Full capabilities, slower' : '功能完整，較慢', badge: '', badgeColor: '', badgeText: '' },
              { name: 'GPT-3.5 Turbo', desc: isEnglish ? 'Cheapest, limited capabilities' : '最便宜，能力有限', badge: '', badgeColor: '', badgeText: '' },
            ].map((m) => (
              <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(63,63,70,0.2)' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#D4D4D8', fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontSize: '12px', color: '#71717A', marginLeft: '8px' }}>{m.desc}</span>
                </div>
                {m.badge && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', background: m.badgeColor, color: m.badgeText, borderRadius: '10px', fontWeight: 600 }}>
                    {m.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#52525B', marginTop: '12px' }}>
            {isEnglish ? 'You can switch models on the interview page. Models are billed directly by OpenAI.' : '可在面試頁面切換模型。模型由 OpenAI 直接計費。'}
          </p>
        </div>
      </div>
    </div>
  );
}
