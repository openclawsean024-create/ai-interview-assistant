'use client';

// app/dashboard/page.tsx
// 練習紀錄（個人使用統計）：不需登入。資料只從瀏覽器 localStorage（aiia.practice.history）讀取。

export const dynamic = 'force-dynamic';

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
  IconClock,
  IconZap,
  IconBook,
  IconArrowRight,
  IconFileText,
  IconSettings,
  IconSparkle,
  IconTarget,
} from '@/app/components/ui-primitives';
import { loadHistory, type PracticeHistoryEntry } from '@/app/lib/practice/store';
import { JOB_LEVEL_LABELS, JOB_TYPE_LABELS } from '@/app/lib/questions/bank';

export default function DashboardPage() {
  const { locale } = useLocale();
  const isEnglish = locale === 'en';
  const lang = isEnglish ? 'en' : 'zh';
  const [history, setHistory] = useState<PracticeHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const today = new Date().toDateString();
  const totalQuestions = history.reduce((sum, h) => sum + (h.questionCount ?? 0), 0);
  const sessionsToday = history.filter((h) => new Date(h.completedAt).toDateString() === today).length;
  const averageScore =
    history.length === 0 ? 0 : Math.round(history.reduce((sum, h) => sum + (h.overallScore ?? 0), 0) / history.length);

  const statCards = [
    { id: 'sessions', label: isEnglish ? 'Practices completed' : '完成的練習', value: history.length, icon: <IconBook size={20} />, tone: 'primary' as const },
    { id: 'questions', label: isEnglish ? 'Questions answered' : '作答題數', value: totalQuestions, icon: <IconTarget size={20} />, tone: 'accent' as const },
    { id: 'today', label: isEnglish ? 'Practices today' : '今日練習次數', value: sessionsToday, icon: <IconClock size={20} />, tone: 'warning' as const },
    { id: 'average', label: isEnglish ? 'Average score' : '平均分數', value: averageScore, icon: <IconZap size={20} />, tone: 'success' as const },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <SkipLink />
      <Navbar active="/dashboard" locale={lang} />

      <main id="main-content">
        <Container className="py-8 lg:py-10">
          <PageHeader
            eyebrow={isEnglish ? 'History' : '練習紀錄'}
            title={isEnglish ? 'Your practice history' : '你的練習紀錄'}
            description={isEnglish
              ? 'Stored in this browser only. No account needed.'
              : '只儲存在這個瀏覽器，不需帳號。'}
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
                    <div data-testid={`stat-${s.id}`} className="stat-number">
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
                <IconTarget size={16} />
                {isEnglish ? 'Start a mock interview' : '開始模擬面試'}
              </LinkButton>
              <LinkButton href="/settings" variant="ghost" fullWidth>
                <IconSettings size={16} />
                {isEnglish ? 'Settings' : '設定'}
              </LinkButton>
              <LinkButton href="/pricing" variant="ghost" fullWidth>
                <IconSparkle size={16} />
                {isEnglish ? 'View pricing' : '查看定價'}
              </LinkButton>
            </div>
          </section>

          {/* Recent reports */}
          <section aria-labelledby="history-heading" className="mb-10">
            <SectionHeading eyebrow={isEnglish ? 'Activity' : '活動'} title={isEnglish ? 'Recent debrief reports' : '最近的複盤報告'} />
            <h2 id="history-heading" className="sr-only">{isEnglish ? 'Recent practice history' : '最近練習歷史'}</h2>

            <div className="card" data-testid="dashboard-history">
              {history.length === 0 ? (
                <div className="text-center py-10">
                  <IconFileText size={32} className="mx-auto mb-3 text-ink-muted opacity-40" />
                  <p className="text-ink font-medium mb-1">{isEnglish ? 'No practice yet' : '尚無練習紀錄'}</p>
                  <p className="text-sm text-ink-muted mb-5">
                    {isEnglish ? 'Finish a mock interview and your report will show up here.' : '完成一次模擬面試後，報告會顯示在這裡。'}
                  </p>
                  <LinkButton href="/interview" variant="primary">
                    {isEnglish ? 'Start practice' : '開始練習'}
                    <IconArrowRight size={16} />
                  </LinkButton>
                </div>
              ) : (
                <ol className="space-y-3 list-none">
                  {history.slice(0, 10).map((item) => (
                    <li
                      key={item.reportId}
                      className="p-4 bg-surface-elevated border border-border-subtle rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <Link href={`/report/${item.reportId}`} className="flex items-baseline justify-between gap-3">
                        <span className="text-sm text-ink font-medium">
                          {JOB_TYPE_LABELS[item.jobType as keyof typeof JOB_TYPE_LABELS]?.[lang] ?? item.jobType}
                          {' · '}
                          {JOB_LEVEL_LABELS[item.jobLevel as keyof typeof JOB_LEVEL_LABELS]?.[lang] ?? item.jobLevel}
                          {' · '}
                          {item.questionCount} {isEnglish ? 'questions' : '題'}
                        </span>
                        <span className="text-sm font-semibold text-primary tabular-nums">{item.overallScore} / 100</span>
                      </Link>
                      <span className="text-xs text-ink-muted font-mono">
                        {new Date(item.completedAt).toLocaleString(isEnglish ? 'en-US' : 'zh-TW', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </Container>
      </main>

      <Footer locale={lang} />
    </div>
  );
}
