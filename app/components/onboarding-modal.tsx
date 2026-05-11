'use client';

import { useState, useEffect } from 'react';
import { encryptApiKey } from '@/lib/crypto';

const STORAGE_KEY = 'ai_interview_onboarding_done';

interface Props {
  userId: string;
  locale?: string;
}

const STEPS = [
  {
    icon: '🎯',
    titleZh: '歡迎使用 AI 面試助手',
    titleEn: 'Welcome to AI Interview Assistant',
    descZh: '這是你的 AI 面試練習平台。我們會引導你完成初始設定，讓你馬上開始練習。',
    descEn: "This is your AI interview practice platform. We'll guide you through setup so you can start practicing right away.",
  },
  {
    icon: '🔑',
    titleZh: '設定 OpenAI API Key',
    titleEn: 'Set Up Your OpenAI API Key',
    descZh: '我們使用你的 API Key 生成答案建議，金鑰加密存儲在你的瀏覽器中，不會傳送到我們的伺服器。',
    descEn: 'We use your API key to generate answer suggestions. It\'s encrypted in your browser and never sent to our servers.',
  },
  {
    icon: '🚀',
    titleZh: '一切就緒！',
    titleEn: 'You\'re All Set!',
    descZh: '你可以輸入或語音說出面試問題，AI 會在 2-3 秒內給你專業的答案建議。',
    descEn: 'Type or speak an interview question and AI will give you professional answer suggestions in 2-3 seconds.',
  },
];

export function OnboardingModal({ userId, locale = 'zh' }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const isZh = locale === 'zh';

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  async function handleSaveKey() {
    if (!apiKey.trim()) return;
    setSaving(true);
    setTestStatus(isZh ? '驗證中...' : 'Verifying...');
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setTestStatus(`❌ ${data.error || (isZh ? 'API Key 無效' : 'Invalid API Key')}`);
        setSaving(false);
        return;
      }
      // Encrypt and save
      const encrypted = await encryptApiKey(apiKey.trim());
      localStorage.setItem(`apikey_${userId}`, encrypted);
      setTestStatus(isZh ? '✅ API Key 驗證成功！' : '✅ API Key verified!');
      setTimeout(() => setStep(2), 800);
    } catch {
      setTestStatus(isZh ? '❌ 連線失敗，請稍後再試' : '❌ Connection failed, please retry');
    }
    setSaving(false);
  }

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#111113', border: '1px solid rgba(63,63,70,0.7)',
          borderRadius: '20px', padding: '40px', maxWidth: '480px', width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                height: '3px', flex: 1, borderRadius: '2px',
                background: i <= step ? '#2563EB' : 'rgba(63,63,70,0.5)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{current.icon}</div>

        {/* Title */}
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FAFAFA', marginBottom: '10px' }}>
          {isZh ? current.titleZh : current.titleEn}
        </h2>

        {/* Description */}
        <p style={{ fontSize: '14px', color: '#71717A', lineHeight: 1.7, marginBottom: '28px' }}>
          {isZh ? current.descZh : current.descEn}
        </p>

        {/* Step-specific content */}
        {step === 1 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: '#52525B', marginBottom: '12px', lineHeight: 1.6 }}>
              {isZh ? '前往' : 'Visit'}{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener"
                style={{ color: '#60A5FA' }}
              >
                platform.openai.com/api-keys
              </a>{' '}
              {isZh ? '取得你的 API Key' : 'to get your API Key'}
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(63,63,70,0.6)',
                borderRadius: '10px', color: '#FAFAFA',
                fontSize: '14px', outline: 'none',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
            {testStatus && (
              <p style={{ fontSize: '13px', color: testStatus.startsWith('✅') ? '#10B981' : '#F87171', marginTop: '8px' }}>
                {testStatus}
              </p>
            )}
            <p style={{ fontSize: '12px', color: '#3F3F46', marginTop: '8px' }}>
              {isZh ? '金鑰以 AES-256 加密儲存在你的瀏覽器，不會傳送到我們的伺服器。' : 'Your key is AES-256 encrypted in your browser and never sent to our servers.'}
            </p>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {[
              { icon: '🎤', text: isZh ? '按「開始錄音」說出面試問題' : 'Click "Start Recording" to speak a question' },
              { icon: '⚡', text: isZh ? 'AI 2-3 秒內生成答案建議' : 'AI generates suggestions in 2-3 seconds' },
              { icon: '📊', text: isZh ? '練習後在儀表板查看統計' : 'View practice stats in the dashboard' },
            ].map((tip) => (
              <div key={tip.text} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: '#A1A1AA' }}>
                <span>{tip.icon}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1, padding: '13px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #1d4ed8, #2563EB)',
                color: 'white', fontWeight: 600, fontSize: '15px',
                border: 'none', cursor: 'pointer',
              }}
            >
              {isZh ? '開始設定 →' : 'Get Started →'}
            </button>
          )}
          {step === 1 && (
            <>
              <button
                onClick={() => { setStep(2); setTestStatus(''); }}
                style={{
                  padding: '13px 20px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(63,63,70,0.5)',
                  color: '#71717A', fontSize: '14px', cursor: 'pointer',
                }}
              >
                {isZh ? '稍後設定' : 'Skip for now'}
              </button>
              <button
                onClick={handleSaveKey}
                disabled={saving || !apiKey.trim()}
                style={{
                  flex: 1, padding: '13px', borderRadius: '10px',
                  background: saving || !apiKey.trim() ? 'rgba(37,99,235,0.4)' : 'linear-gradient(135deg, #1d4ed8, #2563EB)',
                  color: 'white', fontWeight: 600, fontSize: '14px',
                  border: 'none', cursor: saving || !apiKey.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? (isZh ? '驗證中...' : 'Verifying...') : (isZh ? '儲存並繼續' : 'Save & Continue')}
              </button>
            </>
          )}
          {step === 2 && (
            <button
              onClick={finish}
              style={{
                flex: 1, padding: '13px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #1d4ed8, #2563EB)',
                color: 'white', fontWeight: 600, fontSize: '15px',
                border: 'none', cursor: 'pointer',
              }}
            >
              {isZh ? '開始面試練習！' : 'Start Practicing!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
