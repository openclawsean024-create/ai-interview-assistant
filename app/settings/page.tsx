'use client';

export const dynamic = 'force-dynamic';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
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
    if (!isSignedIn) { alert('請先登入'); return; }
    if (!apiKey.trim()) { alert('請輸入 API Key'); return; }
    localStorage.setItem(`apikey_${user?.id}`, apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function testApiKey() {
    if (!apiKey.trim()) { setTestStatus('請先輸入 API Key'); return; }
    setTestStatus('測試中...');
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      setTestStatus(data.ok ? '✅ API Key 有效！' : `❌ 錯誤: ${data.error}`);
    } catch (e: any) {
      setTestStatus(`❌ 測試失敗: ${e.message}`);
    }
  }

  if (!isLoaded) {
    return <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667eea' }}>載入中...</div>;
  }

  if (!isSignedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#888' }}>請先登入</p>
        <Link href="/sign-in"><button className="btn-brand">前往登入</button></Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 60px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
          <span className="gradient-text">AI Interview</span>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#aaa', fontSize: '14px' }}>儀表板</Link>
          <Link href="/interview" style={{ color: '#aaa', fontSize: '14px' }}>面試</Link>
          <Link href="/pricing" style={{ color: '#aaa', fontSize: '14px' }}>定價</Link>
          <Link href="/settings" style={{ color: '#667eea', fontSize: '14px' }}>設定</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>🔑 API Key 設定</h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
          輸入你的 OpenAI API Key。我們使用你的 Key 來呼叫 AI 分析，<br />
          不會儲存或使用你的 Key 做其他用途。
        </p>

        {/* Info box */}
        <div style={{ padding: '16px', background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: '12px', marginBottom: '32px' }}>
          <p style={{ color: '#aaa', fontSize: '14px', lineHeight: 1.7 }}>
            💡 <strong style={{ color: '#ccc' }}>如何取得 API Key：</strong><br />
            1. 前往 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" style={{ color: '#667eea' }}>platform.openai.com/api-keys</a><br />
            2. 點擊 Create new secret key<br />
            3. 複製並貼上到下方輸入框<br />
            4. 費用由你完全自負（GPT-4o 約 $0.01/次）
          </p>
        </div>

        <div className="card">
          <label style={{ display: 'block', fontSize: '14px', color: '#ccc', marginBottom: '8px', fontWeight: 600 }}>
            OpenAI API Key
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
              {saved ? '✅ 已儲存！' : '儲存 API Key'}
            </button>
            <button onClick={testApiKey} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#aaa', cursor: 'pointer' }}>
              測試連線
            </button>
          </div>
          {testStatus && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '13px', color: '#ccc' }}>
              {testStatus}
            </div>
          )}
        </div>

        {/* Supported models */}
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>支援的模型</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { name: 'GPT-4o', desc: '最快、最聰明（預設）', badge: '推薦' },
              { name: 'GPT-4o-mini', desc: '快速、便宜的選項', badge: '省錢' },
              { name: 'GPT-4 Turbo', desc: '功能完整，較慢', badge: '' },
              { name: 'GPT-3.5 Turbo', desc: '最便宜，能力有限', badge: '' },
            ].map((m) => (
              <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#ccc', fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>{m.desc}</span>
                </div>
                {m.badge && <span style={{ fontSize: '11px', padding: '2px 8px', background: m.badge === '推薦' ? 'rgba(102,126,234,0.2)' : 'rgba(34,197,94,0.2)', color: m.badge === '推薦' ? '#667eea' : '#22c55e', borderRadius: '10px' }}>{m.badge}</span>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#555', marginTop: '12px' }}>可在面試頁面切換模型。模型由 OpenAI 直接計費。</p>
        </div>
      </div>
    </div>
  );
}
