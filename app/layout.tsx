// app/layout.tsx
// v3.0 SPEC §16 §17 anonymous-first + Mock 預設

import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import { LocaleProvider } from '@/app/i18n/locale-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Interview Assistant — v3.0',
  description: 'AI 面試助理：繁中、面試前演練 + 面試後證據化複盤。v3.0 預設 Mock 模式，無需註冊即可體驗。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LocaleProvider>
        <html lang="zh-Hant">
          <head>
            <meta name="version" content="v3.0" />
            <meta name="aiia:mode-default" content="mock" />
            <meta name="aiia:anonymous-first" content="true" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;600;700&display=swap"
              rel="stylesheet"
            />
          </head>
          <body data-aiia-version="v3.0">{children}</body>
        </html>
      </LocaleProvider>
    </AuthProvider>
  );
}
