import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import { LocaleProvider } from '@/app/i18n/locale-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Interview Assistant',
  description: 'Real-time AI-powered interview assistant for Zoom, Teams, Meet, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LocaleProvider>
        <html lang="en">
          <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
          </head>
          <body>{children}</body>
        </html>
      </LocaleProvider>
    </AuthProvider>
  );
}
