'use client';
// app/components/demo-mode-badge.tsx
// v3.0 SPEC §16.6 AC-013 Mock footer 標示

import { useEffect, useState } from 'react';

const KEY = 'aiia.byok.apiKey';

export default function DemoModeBadge() {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    try {
      setHasKey(!!window.localStorage.getItem(KEY));
    } catch {
      /* ignore */
    }
    const onChange = () => {
      try {
        setHasKey(!!window.localStorage.getItem(KEY));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('aiia:byok-changed', onChange);
    return () => window.removeEventListener('aiia:byok-changed', onChange);
  }, []);

  if (hasKey) {
    return (
      <span
        data-testid="aiia-mode-badge"
        data-mode="byok"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        LLM Mode (BYOK)
      </span>
    );
  }

  return (
    <span
      data-testid="aiia-mode-badge"
      data-mode="mock"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Demo Mode (Mock) — 設定 API Key 啟用真實 LLM
    </span>
  );
}
