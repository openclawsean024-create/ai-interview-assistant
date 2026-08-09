'use client';
// app/components/session-init.tsx
// v3.0 SPEC §17 anonymous-first + Consent + Paywall + Delete listener

import { useEffect, useState } from 'react';
import { getOrCreateSession, setConsent, logEvent } from '@/app/lib/session/session';
import { FREE_TIER_LIMIT, remainingFree } from '@/app/lib/session/quota';

export default function SessionInit() {
  const [showConsent, setShowConsent] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [freeLeft, setFreeLeft] = useState<number>(FREE_TIER_LIMIT);
  const [uid, setUid] = useState<string>('');

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
          aria-label="個資使用同意"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-semibold text-zinc-50 mb-2">關於你的資料</h2>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              AI Interview Assistant 使用 <strong className="text-zinc-200">localStorage</strong> 儲存你的 session 與練習記錄。
              資料<strong className="text-zinc-200">只存在你的瀏覽器</strong>，不送伺服器。你可以隨時到 Settings 一鍵刪除。
            </p>
            <p className="text-xs text-zinc-500 mb-6">
              拒絕同意仍可使用，但不會記錄練習事件用於改善產品。
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
              >
                拒絕
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                同意並繼續
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaywall && (
        <div
          role="dialog"
          aria-label="升級 Pro 或匯出"
          data-testid="paywall-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-zinc-50 mb-2">已用完 {FREE_TIER_LIMIT} 次免費練習</h2>
            <p className="text-sm text-zinc-400 mb-4">
              升級 Pro 解鎖完整功能，或匯出你目前的練習資料。
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
                升級 Pro 或匯出
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
