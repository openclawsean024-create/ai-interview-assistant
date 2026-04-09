'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/app/i18n/locale-context';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface UsageStats {
  totalQuestions: number;
  totalAnswers: number;
  sessionsToday: number;
  apiCallsThisMonth: number;
  history: Array<{
    question: string;
    answer: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const { t, locale } = useLocale();
  const [stats, setStats] = useState<UsageStats>({
    totalQuestions: 0,
    totalAnswers: 0,
    sessionsToday: 0,
    apiCallsThisMonth: 0,
    history: [],
  });

  useEffect(() => {
    if (isSignedIn) {
      const stored = localStorage.getItem(`usage_${user?.id}`);
      if (stored) {
        setStats(JSON.parse(stored));
      }
    }
  }, [isSignedIn, user?.id]);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#60A5FA', fontSize: '14px' }}>{t.dashboard.loading}</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <p style={{ color: '#52525B', fontSize: '14px' }}>{t.dashboard.loginRequired}</p>
        <Link href="/sign-in">
          <button className="btn-brand">{t.dashboard.goToSignIn}</button>
        </Link>
      </div>
    );
  }

  const displayName = user?.firstName || user?.emailAddresses?.[0]?.email?.split('@')[0] || 'User';

  return (
    <div style={{ minHeight: '100vh', background: '#09090B' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 48px', borderBottom: '1px solid rgba(63,63,70,0.4)' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA' }}>
          <span className="gradient-text">AI Interview</span>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <LanguageSwitcher />
          <Link href="/dashboard" style={{ color: '#60A5FA', fontSize: '14px', fontWeight: 600 }}>{t.nav.dashboard}</Link>
          <Link href="/interview" style={{ color: '#A1A1AA', fontSize: '14px' }}>{t.nav.interview}</Link>
          <Link href="/pricing" style={{ color: '#A1A1AA', fontSize: '14px' }}>{t.nav.pricing}</Link>
          <Link href="/settings" style={{ color: '#A1A1AA', fontSize: '14px' }}>{t.nav.settings}</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', marginBottom: '4px' }}>
            {t.dashboard.greeting(displayName)}
          </h1>
          <p style={{ color: '#52525B', fontSize: '14px' }}>{t.dashboard.subtitle}</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: t.dashboard.stats.totalQuestions, value: stats.totalQuestions, icon: '🎤' },
            { label: t.dashboard.stats.sessionsToday, value: stats.sessionsToday, icon: '📅' },
            { label: t.dashboard.stats.apiCallsThisMonth, value: stats.apiCallsThisMonth, icon: '⚡' },
            { label: t.dashboard.stats.historyCount, value: stats.history.length, icon: '📊' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
              <div className="stat-number" style={{ fontSize: '36px', fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: '#52525B', fontSize: '13px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <Link href="/interview">
            <button className="btn-brand">{t.dashboard.startInterview}</button>
          </Link>
          <Link href="/settings">
            <button className="btn-outline" style={{ padding: '12px 28px' }}>{t.dashboard.apiKeySettings}</button>
          </Link>
        </div>

        {/* Recent History */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', marginBottom: '20px', letterSpacing: '0.01em' }}>
            {t.dashboard.recentHistory}
          </h2>
          {stats.history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#52525B' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p style={{ color: '#52525B', fontSize: '14px' }}>{t.dashboard.noHistory}</p>
              <p style={{ fontSize: '13px', marginTop: '4px', color: '#3F3F46' }}>{t.dashboard.noHistorySub}</p>
              <Link href="/interview">
                <button className="btn-brand" style={{ marginTop: '20px', padding: '10px 24px' }}>{t.dashboard.startPractice}</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.history.slice(0, 8).map((item, i) => (
                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(63,63,70,0.3)' }}>
                  <div style={{ fontSize: '13px', color: '#60A5FA', marginBottom: '6px' }}>Q: {item.question}</div>
                  <div style={{ fontSize: '13px', color: '#71717A', lineHeight: 1.5 }}>A: {item.answer.slice(0, 150)}{item.answer.length > 150 ? '...' : ''}</div>
                  <div style={{ fontSize: '11px', color: '#3F3F46', marginTop: '6px' }}>
                    {new Date(item.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-TW')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
