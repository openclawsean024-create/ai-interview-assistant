'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/app/i18n/locale-context';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Container,
  Navbar,
  Footer,
  PageHeader,
  SkipLink,
  LinkButton,
  SectionHeading,
  IconMic,
  IconClock,
  IconZap,
  IconBook,
  IconArrowRight,
  IconFileText,
  IconKey,
  IconSettings,
  IconDownload,
  IconSparkle,
} from '@/app/components/ui-primitives';

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
  const { user, isSignedIn, isLoaded, signOut } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex items-center gap-3 text-primary">
          <span className="status-dot status-dot-info animate-pulse-glow" />
          <span className="text-sm font-medium">{t.dashboard.loading}</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <SkipLink />
        <Navbar active="/dashboard" locale={locale === 'en' ? 'en' : 'zh'} />
        <Container className="py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto mb-3">
            <IconKey size={26} />
          </div>
          <h1 className="text-h2 text-ink mb-2">{t.dashboard.loginRequired}</h1>
          <p className="text-ink-secondary mb-6">{t.dashboard.subtitle}</p>
          <LinkButton href="/sign-in" variant="primary">
            {t.dashboard.goToSignIn}
            <IconArrowRight size={16} />
          </LinkButton>
        </Container>
        <Footer locale={locale === 'en' ? 'en' : 'zh'} />
      </div>
    );
  }

  const displayName = user?.firstName || user?.emailAddresses?.[0]?.email?.split('@')[0] || 'User';
  const isEnglish = locale === 'en';

  const statCards = [
    { id: 'questions', label: t.dashboard.stats.totalQuestions,     value: stats.totalQuestions,    icon: <IconMic size={20} />,  tone: 'primary' as const },
    { id: 'today',     label: t.dashboard.stats.sessionsToday,       value: stats.sessionsToday,     icon: <IconClock size={20} />, tone: 'accent' as const },
    { id: 'calls',     label: t.dashboard.stats.apiCallsThisMonth,  value: stats.apiCallsThisMonth, icon: <IconZap size={20} />,  tone: 'warning' as const },
    { id: 'history',   label: t.dashboard.stats.historyCount,        value: stats.history.length,    icon: <IconBook size={20} />, tone: 'success' as const },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <SkipLink />
      <Navbar active="/dashboard" locale={isEnglish ? 'en' : 'zh'} />

      <main id="main-content">
        <Container className="py-8 lg:py-10">
          <PageHeader
            eyebrow={isEnglish ? 'Dashboard' : '儀表板'}
            title={t.dashboard.greeting(displayName)}
            description={t.dashboard.subtitle}
            actions={
              <button
                onClick={signOut}
                className="btn-ghost text-sm"
                aria-label={isEnglish ? 'Sign out' : '登出'}
              >
                {t.nav.logout || (isEnglish ? 'Sign out' : '登出')}
              </button>
            }
          />

          {/* Stats Grid */}
          <section aria-labelledby="stats-heading" className="mb-10">
            <h2 id="stats-heading" className="sr-only">{isEnglish ? 'Statistics' : '統計'}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => {
                const tone =
                  s.tone === 'primary' ? 'bg-primary/10 text-primary border-primary/30' :
                  s.tone === 'accent'  ? 'bg-accent/10 text-accent border-accent/30' :
                  s.tone === 'warning' ? 'bg-warning/10 text-warning border-warning/30' :
                                         'bg-success/10 text-success border-success/30';
                return (
                  <article key={s.id} className="card text-center">
                    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-lg border mb-3 ${tone}`}>
                      {s.icon}
                    </div>
                    <div
                      data-testid={`stat-${s.id}`}
                      className="stat-number"
                    >
                      {s.value}
                    </div>
                    <div className="text-xs text-ink-muted mt-1.5">{s.label}</div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Quick Actions */}
          <section aria-labelledby="actions-heading" className="mb-10">
            <SectionHeading eyebrow={isEnglish ? 'Quick Actions' : '快速操作'} title={isEnglish ? 'Get started' : '開始練習'} />
            <h2 id="actions-heading" className="sr-only">{isEnglish ? 'Quick actions' : '快速操作'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <LinkButton href="/interview" variant="accent" fullWidth>
                <IconMic size={16} />
                {t.dashboard.startInterview}
              </LinkButton>
              <LinkButton href="/settings" variant="ghost" fullWidth>
                <IconSettings size={16} />
                {t.dashboard.apiKeySettings}
              </LinkButton>
              <LinkButton href="/pricing" variant="ghost" fullWidth>
                <IconSparkle size={16} />
                {isEnglish ? 'View pricing' : '查看定價'}
              </LinkButton>
            </div>
          </section>

          {/* Recent History */}
          <section aria-labelledby="history-heading" className="mb-10">
            <SectionHeading eyebrow={isEnglish ? 'Activity' : '活動'} title={t.dashboard.recentHistory} />
            <h2 id="history-heading" className="sr-only">{isEnglish ? 'Recent practice history' : '最近練習歷史'}</h2>

            <div className="card">
              {stats.history.length === 0 ? (
                <div className="text-center py-10">
                  <IconFileText size={32} className="mx-auto mb-3 text-ink-muted opacity-40" />
                  <p className="text-ink font-medium mb-1">{t.dashboard.noHistory}</p>
                  <p className="text-sm text-ink-muted mb-5">{t.dashboard.noHistorySub}</p>
                  <LinkButton href="/interview" variant="primary">
                    {t.dashboard.startPractice}
                    <IconArrowRight size={16} />
                  </LinkButton>
                </div>
              ) : (
                <ol className="space-y-3 list-none">
                  {stats.history.slice(0, 8).map((item, i) => (
                    <li
                      key={i}
                      className="p-4 bg-surface-elevated border border-border-subtle rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <span className="tag tag-muted">
                          <IconMic size={11} />
                          Q
                        </span>
                        <span className="text-xs text-ink-muted font-mono">
                          {new Date(item.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-TW', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-ink font-medium leading-relaxed mb-2">
                        {item.question}
                      </p>
                      <p className="text-xs text-ink-secondary leading-relaxed line-clamp-3">
                        <span className="text-primary font-semibold">A: </span>
                        {item.answer.slice(0, 200)}{item.answer.length > 200 ? '…' : ''}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </Container>
      </main>

      <Footer locale={isEnglish ? 'en' : 'zh'} />
    </div>
  );
}