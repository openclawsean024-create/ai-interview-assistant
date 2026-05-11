'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/app/i18n/locale-context';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import { OnboardingModal } from '@/app/components/onboarding-modal';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface HistoryItem {
  question: string;
  answer: string;
  createdAt: string;
  type?: string;
}

interface UsageStats {
  totalQuestions: number;
  totalAnswers: number;
  sessionsToday: number;
  apiCallsThisMonth: number;
  history: HistoryItem[];
}

// Build last-7-days activity counts from history timestamps
function buildWeeklyActivity(history: HistoryItem[]): { label: string; count: number }[] {
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('zh-TW', { weekday: 'short' });
    const count = history.filter((h) => h.createdAt?.slice(0, 10) === key).length;
    days.push({ label, count });
  }
  return days;
}

// Count by question type
function buildTypeDistribution(history: HistoryItem[]) {
  const counts: Record<string, number> = {};
  for (const h of history) {
    const type = h.type || 'other';
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
}

const TYPE_LABELS: Record<string, string> = {
  technical: '技術題',
  behavioral: '行為題',
  'system-design': '系統設計',
  situational: '情境題',
  other: '其他',
};

const TYPE_COLORS: Record<string, string> = {
  technical: '#2563EB',
  behavioral: '#10B981',
  'system-design': '#F59E0B',
  situational: '#8B5CF6',
  other: '#6B7280',
};

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded, signOut } = useAuth();
  const { t, locale } = useLocale();
  const isZh = locale === 'zh';

  const [stats, setStats] = useState<UsageStats>({
    totalQuestions: 0,
    totalAnswers: 0,
    sessionsToday: 0,
    apiCallsThisMonth: 0,
    history: [],
  });

  useEffect(() => {
    if (!isSignedIn) return;
    const stored = localStorage.getItem(`usage_${user?.id}`);
    if (stored) {
      try { setStats(JSON.parse(stored)); } catch {}
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
  const weeklyData = buildWeeklyActivity(stats.history);
  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);
  const typeDistribution = buildTypeDistribution(stats.history);
  const totalTyped = Object.values(typeDistribution).reduce((a, b) => a + b, 0) || 1;

  const streak = (() => {
    let s = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const hasActivity = stats.history.some((h) => h.createdAt?.slice(0, 10) === key);
      if (hasActivity) s++;
      else if (key !== today) break;
    }
    return s;
  })();

  return (
    <div style={{ minHeight: '100vh', background: '#09090B' }}>
      <OnboardingModal userId={user?.id ?? ''} locale={locale} />

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
          <button
            onClick={signOut}
            style={{ background: 'none', border: 'none', color: '#F87171', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t.nav.logout || 'Logout'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', marginBottom: '4px' }}>
              {t.dashboard.greeting(displayName)}
            </h1>
            <p style={{ color: '#52525B', fontSize: '14px' }}>{t.dashboard.subtitle}</p>
          </div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
              <span style={{ fontSize: '20px' }}>🔥</span>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#F59E0B' }}>{streak}</div>
                <div style={{ fontSize: '11px', color: '#78716C' }}>{isZh ? '天連續練習' : 'day streak'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: isZh ? '總練習題數' : 'Total Questions', value: stats.totalQuestions, icon: '🎤', color: '#2563EB' },
            { label: isZh ? '今日練習' : 'Today', value: stats.sessionsToday, icon: '📅', color: '#10B981' },
            { label: isZh ? '本月 AI 分析' : 'Monthly AI Calls', value: stats.apiCallsThisMonth, icon: '⚡', color: '#F59E0B' },
            { label: isZh ? '歷史記錄' : 'Saved History', value: stats.history.length, icon: '📊', color: '#8B5CF6' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ color: '#52525B', fontSize: '12px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          {/* Weekly Activity Bar Chart */}
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#FAFAFA', marginBottom: '20px' }}>
              {isZh ? '📈 近 7 天練習' : '📈 7-Day Activity'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
              {weeklyData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '100%', borderRadius: '4px 4px 0 0',
                      background: d.count > 0 ? 'linear-gradient(180deg,#2563EB,#1d4ed8)' : 'rgba(63,63,70,0.3)',
                      height: `${Math.max((d.count / maxCount) * 60, d.count > 0 ? 8 : 0)}px`,
                      minHeight: d.count > 0 ? '8px' : '0',
                      transition: 'height 0.3s',
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#52525B' }}>{d.label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#52525B' }}>
                {isZh ? `本週共 ${weeklyData.reduce((a, d) => a + d.count, 0)} 題` : `${weeklyData.reduce((a, d) => a + d.count, 0)} this week`}
              </span>
              <Link href="/interview" style={{ fontSize: '11px', color: '#60A5FA' }}>
                {isZh ? '繼續練習 →' : 'Keep going →'}
              </Link>
            </div>
          </div>

          {/* Type Distribution */}
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#FAFAFA', marginBottom: '20px' }}>
              {isZh ? '🗂️ 題型分布' : '🗂️ Question Types'}
            </h2>
            {Object.keys(typeDistribution).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#52525B', fontSize: '13px' }}>
                {isZh ? '開始練習後顯示題型分布' : 'Practice to see type distribution'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(typeDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#A1A1AA' }}>{TYPE_LABELS[type] || type}</span>
                        <span style={{ color: TYPE_COLORS[type] || '#6B7280', fontWeight: 600 }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%', borderRadius: '3px',
                            background: TYPE_COLORS[type] || '#6B7280',
                            width: `${(count / totalTyped) * 100}%`,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <Link href="/interview">
            <button className="btn-brand">{t.dashboard.startInterview}</button>
          </Link>
          <Link href="/settings">
            <button className="btn-outline" style={{ padding: '12px 24px' }}>{t.dashboard.apiKeySettings}</button>
          </Link>
          <Link href="/pricing">
            <button style={{ padding: '12px 24px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', color: '#F59E0B', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              {isZh ? '✨ 升級 Pro' : '✨ Upgrade Pro'}
            </button>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.history.slice(0, 10).map((item, i) => (
                <div
                  key={i}
                  style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(63,63,70,0.3)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#60A5FA', marginBottom: '5px', fontWeight: 500 }}>
                        Q: {item.question}
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717A', lineHeight: 1.5 }}>
                        {item.answer.slice(0, 120)}{item.answer.length > 120 ? '...' : ''}
                      </div>
                    </div>
                    {item.type && (
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0,
                        background: `${TYPE_COLORS[item.type] || '#6B7280'}18`,
                        color: TYPE_COLORS[item.type] || '#6B7280',
                        border: `1px solid ${TYPE_COLORS[item.type] || '#6B7280'}30`,
                      }}>
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    )}
                  </div>
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
