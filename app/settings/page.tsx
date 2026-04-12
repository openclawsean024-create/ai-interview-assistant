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
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState('1.0');
  const [recognitionLang, setRecognitionLang] = useState('zh-TW');
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState('');

  // Load settings from chrome.storage.sync (Chrome extension) or localStorage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEffect(() => {
    // Try chrome.storage.sync first (Chrome extension context)
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
      (window as any).chrome.storage.sync.get(['apiKey', 'answerHistory', 'ttsSpeed', 'recognitionLang', 'selectedMicId'], (data: any) => {
        if (data.apiKey) setApiKey(data.apiKey);
        if (data.answerHistory) { setHistory(data.answerHistory); setHistoryLoaded(true); }
        if (data.ttsSpeed) setTtsSpeed(data.ttsSpeed);
        if (data.recognitionLang) setRecognitionLang(data.recognitionLang);
        if (data.selectedMicId) setSelectedMicId(data.selectedMicId);
      });
    } else if (isSignedIn && user?.id) {
      // Web fallback: localStorage per user
      const stored = localStorage.getItem(`apikey_${user.id}`);
      if (stored) setApiKey(stored);

      const hist = localStorage.getItem(`history_${user.id}`);
      if (hist) { setHistory(JSON.parse(hist)); setHistoryLoaded(true); }

      const speed = localStorage.getItem(`ttsSpeed_${user.id}`);
      if (speed) setTtsSpeed(speed);
      const lang = localStorage.getItem(`recognitionLang_${user.id}`);
      if (lang) setRecognitionLang(lang);
    }
  }, [isSignedIn, user?.id]);

  // Load mic devices (requires user gesture / permission)
  async function loadMicDevices() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMicDevices(devices.filter(d => d.kind === 'audioinput'));
    } catch (e) {
      // No mic permission — show empty
    }
  }

  async function saveApiKey() {
    if (!apiKey.trim()) {
      setTestStatus(isEnglish ? 'Please enter an API Key' : '請輸入 API Key');
      return;
    }
    const key = apiKey.trim();

    // Save to chrome.storage.sync (works for extension)
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
      await new Promise<void>((resolve) => {
        (window as any).chrome.storage.sync.set({ apiKey: key }, () => resolve());
      });
    }

    // Also save to localStorage (web fallback)
    if (isSignedIn && user?.id) {
      localStorage.setItem(`apikey_${user.id}`, key);
    }

    setSaved(true);
    setTestStatus('');
    setTimeout(() => setSaved(false), 3000);
  }

  async function testApiKey() {
    if (!apiKey.trim()) {
      setTestStatus(isEnglish ? 'Please enter an API Key first' : '請先輸入 API Key');
      return;
    }
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
    } catch (e) {
      setTestStatus(`❌ ${isEnglish ? 'Test failed' : '測試失敗'}: ${e.message}`);
    }
  }

  function exportHistoryMD() {
    if (!history.length) return;
    const md = history.map(h =>
      `## ${new Date(h.ts).toLocaleString('zh-TW')}\n\n**Q:** ${h.q}\n\n**A:** ${h.a}\n`
    ).join('\n---\n\n');
    const blob = new Blob([`# AI Interview History\n\n${md}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-interview-history-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
        Loading...
      </div>
    );
  }

  // v4: settings page works WITHOUT login for Chrome extension users
  if (!isSignedIn) {
    const isChrome = typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage;
    if (!isChrome) {
      // Show limited view for non-Chrome, non-logged-in users
      return (
        <div style={{ minHeight: '100vh', background: '#09090B' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 60px', borderBottom: '1px solid rgba(63,63,70,0.4)' }}>
            <Link href="/" style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA' }}><span className="gradient-text">AI Interview</span></Link>
          </nav>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 40px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', marginBottom: '16px' }}>⚙️ {isEnglish ? 'Settings' : '設定'}</h1>
            <div style={{ padding: '20px', background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: '12px', marginBottom: '24px' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.8 }}>
                🤖 <strong style={{ color: '#e5e7eb' }}>AI 面試助理 v4</strong><br /><br />
                請透過 <strong style={{ color: '#60A5FA' }}>Chrome 插件</strong>使用此功能。<br />
                安裝插件後，Alt+Shift+M 快速開關聆聽。<br />
                插件 Popup → 開啟側邊欄麵試模式<br />
                設定自動同步，無需登入。
              </p>
            </div>
          </div>
        </div>
      );
    }
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
          <Link href="/settings" style={{ color: '#60A5FA', fontSize: '14px', fontWeight: 600 }}>{t.nav.settings}</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 40px' }}>

        {/* API Key Section */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', marginBottom: '8px' }}>🔑 {isEnglish ? 'API Key Settings' : 'API Key 設定'}</h1>
          <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            {isEnglish
              ? 'Your API Key is synced to Chrome Extension automatically. Open /settings in Chrome and the key will be available there.'
              : '你的 API Key 會自動同步到 Chrome 插件。在 Chrome 中打開插件，設定會自動帶入。'}
          </p>

          {/* Chrome Extension info */}
          <div style={{ padding: '14px', background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', color: '#9ca3af', lineHeight: 1.7 }}>
            🤖 <strong style={{ color: '#e5e7eb' }}>Chrome 插件 v4</strong><br />
            安裝插件後，Alt+Shift+M 快速開關聆聽<br />
            插件 Popup → 開啟側邊欄麵試模式<br />
            設定自動同步，無需重複輸入
          </div>

          {/* Info box */}
          <div style={{ padding: '16px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '12px', marginBottom: '24px' }}>
            <p style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: 1.8 }}>
              💡 <strong style={{ color: '#D4D4D8' }}>
                {isEnglish ? 'How to get an API Key:' : '如何取得 API Key：'}
              </strong><br />
              1. {isEnglish ? 'Go to' : '前往'} <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" style={{ color: '#60A5FA' }}>platform.openai.com/api-keys</a><br />
              2. {isEnglish ? 'Click Create new secret key' : '點擊 Create new secret key'}<br />
              3. {isEnglish ? 'Copy and paste below' : '複製並貼上到下方輸入框'}<br />
              4. {isEnglish ? 'Costs are your responsibility' : '費用由你完全自負'}
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

          {/* Extension Preferences */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', marginBottom: '12px' }}>
              🎛️ {isEnglish ? 'Extension Preferences' : '插件偏好設定'}
            </h3>

            {/* TTS Speed */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#A1A1AA', marginBottom: '6px' }}>
                {isEnglish ? 'TTS Speed (朗讀速度)' : 'TTS Speed (朗讀速度)'}
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['0.75', '1.0', '1.25', '1.5'].map(speed => (
                  <button
                    key={speed}
                    onClick={async () => {
                      setTtsSpeed(speed);
                      if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
                        await new Promise<void>(resolve => (window as any).chrome.storage.sync.set({ ttsSpeed: speed }, resolve));
                      }
                      if (isSignedIn && user?.id) localStorage.setItem(`ttsSpeed_${user.id}`, speed);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: speed === ttsSpeed ? '1px solid #667eea' : '1px solid rgba(63,63,70,0.6)',
                      background: speed === ttsSpeed ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.04)',
                      color: speed === ttsSpeed ? '#a5b4fc' : '#71717A',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: speed === ttsSpeed ? 600 : 400,
                    }}
                  >
                    {speed === '1.0' ? `${speed} (正常)` : `${speed}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* Recognition Language */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#A1A1AA', marginBottom: '6px' }}>
                {isEnglish ? 'Speech Recognition Language (語音辨識語言)' : 'Speech Recognition Language (語音辨識語言)'}
              </label>
              <select
                value={recognitionLang}
                onChange={async (e) => {
                  const lang = e.target.value;
                  setRecognitionLang(lang);
                  if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
                    await new Promise<void>(resolve => (window as any).chrome.storage.sync.set({ recognitionLang: lang }, resolve));
                  }
                  if (isSignedIn && user?.id) localStorage.setItem(`recognitionLang_${user.id}`, lang);
                }}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(63,63,70,0.6)', borderRadius: '8px', color: '#D4D4D8', fontSize: '14px' }}
              >
                <option value="zh-TW">繁體中文</option>
                <option value="zh-CN">簡體中文</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="ja-JP">日本語</option>
                <option value="ko-KR">한국어</option>
              </select>
            </div>

            {/* Microphone Device */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', color: '#A1A1AA' }}>
                  🎤 {isEnglish ? 'Microphone (麥克風)' : '🎤 Microphone (麥克風)'}
                </label>
                <button
                  onClick={loadMicDevices}
                  style={{ fontSize: '11px', color: '#60A5FA', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isEnglish ? '重新整理' : '重新整理'}
                </button>
              </div>
              {micDevices.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#52525B', marginTop: '4px' }}>
                  {isEnglish ? '點擊「重新整理」以載入麥克風列表（需授權麥克風權限）' : '點擊「重新整理」以載入麥克風列表（需授權麥克風權限）'}
                </p>
              ) : (
                <select
                  value={selectedMicId}
                  onChange={async (e) => {
                    const micId = e.target.value;
                    setSelectedMicId(micId);
                    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
                      await new Promise<void>(resolve => (window as any).chrome.storage.sync.set({ selectedMicId: micId }, resolve));
                    }
                    if (isSignedIn && user?.id) localStorage.setItem(`selectedMicId_${user.id}`, micId);
                  }}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(63,63,70,0.6)', borderRadius: '8px', color: '#D4D4D8', fontSize: '14px' }}
                >
                  {micDevices.map((mic, i) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || `${isEnglish ? 'Microphone' : '麥克風'} ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Supported models */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', marginBottom: '12px' }}>
              {isEnglish ? 'Supported Models' : '支援的模型'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'GPT-4o', desc: isEnglish ? 'Fastest, smartest (default)' : '最快、最聰明（預設）', badge: isEnglish ? 'Recommended' : '推薦', badgeColor: 'rgba(37,99,235,0.2)', badgeText: '#60A5FA' },
                { name: 'GPT-4o-mini', desc: isEnglish ? 'Fast, cost-effective' : '快速、便宜的選項', badge: isEnglish ? 'Save $' : '省錢', badgeColor: 'rgba(16,185,129,0.2)', badgeText: '#10B981' },
                { name: 'GPT-4 Turbo', desc: isEnglish ? 'Full capabilities, slower' : '功能完整，較慢', badge: '', badgeColor: '', badgeText: '' },
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
          </div>
        </div>

        {/* History Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FAFAFA' }}>📋 {isEnglish ? 'Practice History' : '練習歷史'}</h2>
            {history.length > 0 && (
              <button
                onClick={exportHistoryMD}
                style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#A1A1AA', cursor: 'pointer', fontSize: '12px' }}
                onMouseOver={(e) => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.target as HTMLElement).style.color = '#FAFAFA'; }}
                onMouseOut={(e) => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.target as HTMLElement).style.color = '#A1A1AA'; }}
              >
                📥 MD
              </button>
            )}
          </div>

          {!historyLoaded ? (
            <div style={{ color: '#71717A', fontSize: '13px', padding: '20px 0' }}>
              {isEnglish ? 'Loading history...' : '載入歷史記錄中...'}
            </div>
          ) : history.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
              <p style={{ color: '#71717A', fontSize: '14px' }}>
                {isEnglish ? 'No practice history yet. Start using the Chrome Extension to build your history!' : '尚無練習記錄。開始使用 Chrome 插件來建立你的歷史記錄吧！'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.slice(0, 20).map((entry, i) => (
                <div key={i} className="card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 600 }}>Q</span>
                    <span style={{ fontSize: '10px', color: '#52525B' }}>
                      {new Date(entry.ts).toLocaleString('zh-TW')}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#D4D4D8', marginBottom: entry.cat ? '4px' : '0' }}>{entry.q}</p>
                  {entry.cat && (
                    <span style={{ fontSize: '10px', color: '#6b7280', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px', marginBottom: '6px', display: 'inline-block' }}>
                      {entry.cat === 'interview' ? '面試模式' : entry.cat === 'practice' ? '練習模式' : entry.cat}
                    </span>
                  )}
                  {entry.a && (
                    <>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>A</span>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', lineHeight: 1.5 }}>{entry.a.substring(0, 120)}{entry.a.length > 120 ? '...' : ''}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
