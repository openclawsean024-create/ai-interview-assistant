'use client';
// app/components/session-init.tsx
// 匿名 session 初始化 + 資料使用同意 modal（AC-009）+ 額度提示。
// 同意文案必須與實際資料流一致；修改資料流時要同步修改這裡與 README。

import { useEffect, useState } from 'react';
import { getOrCreateSession, setConsent, logEvent } from '@/app/lib/session/session';
import { FREE_TIER_LIMIT, remainingFree } from '@/app/lib/session/quota';
import { useLocale } from '@/app/i18n/locale-context';

/** 同意 modal 的三個要點（E2E 會檢查這些關鍵句）。 */
export const CONSENT_POINTS = {
  zh: [
    'Mock 模式（預設）：練習資料只存在本機瀏覽器（localStorage）；作答內容會送到本站伺服器即時評分，但不會轉送給任何 AI 供應商。',
    '若使用自備 API key：題目、回答與 key 會經本站伺服器轉送給 AI 供應商（OpenAI）。',
    '本站不會在伺服器保存回答；你可以隨時到設定頁一鍵刪除本機資料。',
  ],
  en: [
    'Mock mode (default): practice data is stored only in this browser (localStorage). Your answers are sent to this site\'s server for instant scoring, but are not forwarded to any AI provider.',
    'If you use your own API key: questions, answers and the key are relayed through this site\'s server to the AI provider (OpenAI).',
    'This site does not store your answers on the server. You can delete all local data at any time in Settings.',
  ],
} as const;

export default function SessionInit() {
  const [showConsent, setShowConsent] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [freeLeft, setFreeLeft] = useState<number>(FREE_TIER_LIMIT);
  const [uid, setUid] = useState<string>('');
  const { locale } = useLocale();
  const isEnglish = locale === 'en';
  const points = CONSENT_POINTS[isEnglish ? 'en' : 'zh'];

  // 開站初始化 session + 決定要不要顯示 consent
  useEffect(() => {
    const sess = getOrCreateSession();
    setUid(sess.uid);
    setFreeLeft(remainingFree());

    if (!sess.consentGiven) {
      setShowConsent(true);
    }

    const onQuotaChange = () => {
      const left = remainingFree();
      setFreeLeft(left);
      // AC-017: 額度歸 0 → 顯示 paywall
      if (left === 0) setShowPaywall(true);
    };
    const onSessionDeleted = () => {
      setFreeLeft(remainingFree());
      setShowPaywall(false);
    };

    window.addEventListener('aiia:quota-changed', onQuotaChange);
    window.addEventListener('aiia:session-deleted', onSessionDeleted);
    return () => {
      window.removeEventListener('aiia:quota-changed', onQuotaChange);
      window.removeEventListener('aiia:session-deleted', onSessionDeleted);
    };
  }, []);

  const handleAccept = () => {
    setConsent(true);
    logEvent('consent_accepted');
    setShowConsent(false);
  };

  const handleDecline = () => {
    setConsent(false);
    setShowConsent(false);
  };

  return (
    <>
      {showConsent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEnglish ? 'How your data is used' : '資料使用說明'}
          data-testid="consent-modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-semibold text-zinc-50 mb-3">{isEnglish ? 'About your data' : '關於你的資料'}</h2>
            <ul className="text-sm text-zinc-300 mb-4 leading-relaxed space-y-2 list-disc pl-5" data-testid="consent-points">
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="text-xs text-zinc-500 mb-6">
              {isEnglish
                ? 'You can still practise if you decline; we just will not record practice events in this browser.'
                : '拒絕同意仍可使用，只是不會在這個瀏覽器記錄練習事件。'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                data-testid="consent-decline"
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
              >
                {isEnglish ? 'Decline' : '拒絕'}
              </button>
              <button
                onClick={handleAccept}
                data-testid="consent-accept"
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                {isEnglish ? 'Agree and continue' : '同意並繼續'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaywall && (
        <div
          role="dialog"
          aria-label="免費練習次數提示"
          data-testid="paywall-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-zinc-50 mb-2">已用完 {FREE_TIER_LIMIT} 次免費練習</h2>
            <p className="text-sm text-zinc-400 mb-4">
              你仍可繼續練習。付費方案尚未開放，可先查看方案說明或匯出目前的複盤報告。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaywall(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800"
              >
                稍後
              </button>
              <a
                href="/pricing"
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium text-center"
              >
                查看方案
              </a>
            </div>
          </div>
        </div>
      )}

      <div
        data-testid="aiia-session-uid"
        data-uid={uid}
        data-free-left={freeLeft}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
}
