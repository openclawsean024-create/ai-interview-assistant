// app/layout.tsx
// anonymous-first + Mock 預設。
// 不載入任何第三方資源（字型改用系統字型堆疊），讓頁面本身零外部請求（AC-006）。

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
          </head>
          <body data-aiia-version="v3.0">{children}</body>
        </html>
      </LocaleProvider>
    </AuthProvider>
  );
}
