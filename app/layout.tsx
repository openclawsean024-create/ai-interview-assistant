import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Interview Assistant',
  description: 'Real-time AI-powered interview assistant for Zoom, Teams, Meet, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="zh-TW">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
