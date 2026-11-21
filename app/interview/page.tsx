'use client';

// app/interview/page.tsx
// 練習頁（M1）：
//   1.「模擬面試」：選職務與職級 → 呼叫 /api/interview/start → 逐題作答（/interview/[sessionId]）。
//      不需登入、不需 API key（預設 Mock）。
//   2.「題庫」：瀏覽單一題庫，可依題型、語言、職務、職級篩選；只顯示題目與答題提示。
//
// AC-007：本頁沒有語音輸入、沒有自動產生答案、沒有語音播放，也不呼叫單題分析 API。

export const dynamic = 'force-dynamic';

import { useLocale } from '@/app/i18n/locale-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Timer } from './components/Timer';
import { VideoSimulation } from './components/VideoSimulation';
import { RatingForm } from './components/RatingForm';
import {
  QUESTION_BANK,
  QUESTION_TYPE_LABELS,
  JOB_TYPE_LABELS,
  JOB_LEVEL_LABELS,
  JOB_TYPES,
  JOB_LEVELS,
  QUESTION_TYPES,
  type QuestionType,
  type Language,
  type JobType,
  type JobLevel,
  type Question,
} from '@/app/lib/questions/bank';
import {
  Navbar,
  Footer,
  Container,
  DemoModeBadge,
  SkipLink,
  IconClock,
  IconX,
  IconBook,
  IconFileText,
  IconTarget,
  IconArrowRight,
  IconSettings,
} from '@/app/components/ui-primitives';
import SessionInit from '@/app/components/session-init';
import { readApiKey } from '@/app/lib/storage/local';
import { saveSession, type PracticeSession } from '@/app/lib/practice/store';
import { DEFAULT_JOB_LEVEL, DEFAULT_JOB_TYPE, TOTAL_QUESTIONS } from '@/app/lib/practice/constants';

type ToolPanel = 'none' | 'timer' | 'video' | 'rating';
type PageMode = 'mock' | 'questionBank';

export default function InterviewPage() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const isEnglish = locale === 'en';
  const lang = isEnglish ? 'en' : 'zh';

  const [mode, setMode] = useState<PageMode>('mock');
  const [toolPanel, setToolPanel] = useState<ToolPanel>('none');

  // 模擬面試設定
  const [jobType, setJobType] = useState<JobType>(DEFAULT_JOB_TYPE as JobType);
  const [jobLevel, setJobLevel] = useState<JobLevel>(DEFAULT_JOB_LEVEL as JobLevel);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');

  // 題庫篩選
  const [bankFilterType, setBankFilterType] = useState<QuestionType | 'all'>('all');
  const [bankFilterLang, setBankFilterLang] = useState<Language | 'all'>('all');
  const [bankFilterJob, setBankFilterJob] = useState<JobType | 'all' | 'general'>('all');
  const [bankFilterLevel, setBankFilterLevel] = useState<JobLevel | 'all'>('all');
  const [bankSelected, setBankSelected] = useState<Question | null>(null);

  const filteredQuestions = useMemo(
    () =>
      QUESTION_BANK.filter((q) => {
        if (bankFilterType !== 'all' && q.type !== bankFilterType) return false;
        if (bankFilterLang !== 'all' && q.language !== bankFilterLang) return false;
        if (bankFilterJob === 'general' && q.jobType) return false;
        if (bankFilterJob !== 'all' && bankFilterJob !== 'general' && q.jobType !== bankFilterJob) return false;
        if (bankFilterLevel !== 'all' && q.jobLevel !== bankFilterLevel) return false;
        return true;
      }),
    [bankFilterType, bankFilterLang, bankFilterJob, bankFilterLevel],
  );

  async function startMockInterview() {
    if (isStarting) return;
    setIsStarting(true);
    setStartError('');
    try {
      const apiKey = readApiKey();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey; // 只有使用者自備 key 時才送出
      const response = await fetch('/api/interview/start/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ jobType, jobLevel }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || payload?.error || 'START_FAILED');
      }
      const data = payload.data;
      const session: PracticeSession = {
        sessionId: data.sessionId,
        jobType: data.jobType,
        jobLevel: data.jobLevel,
        totalQuestions: data.totalQuestions ?? TOTAL_QUESTIONS,
        mode: data.mode === 'byok' ? 'byok' : 'mock',
        questions: [data.firstQuestion],
        answers: [],
        pendingNext: null,
        startedAt: new Date().toISOString(),
      };
      saveSession(session);
      router.push(`/interview/${session.sessionId}`);
    } catch (err: any) {
      setStartError(
        `${isEnglish ? 'Could not start the mock interview' : '無法開始模擬面試'}：${err?.message ?? 'unknown'}`,
      );
      setIsStarting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <SessionInit />
      <Navbar active="/interview" locale={lang} />

      <main id="main-content">
        <Container className="py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            {/* Main Panel */}
            <div className="animate-fade-in-up">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-h2 sm:text-h1 text-ink tracking-tight">
                  {isEnglish ? 'Interview practice' : '面試演練'}
                </h1>
                <DemoModeBadge locale={lang} />
              </div>
              <p className="text-ink-secondary text-sm mb-6 max-w-prose">
                {isEnglish
                  ? 'Rehearse before the interview and review afterwards. Answer in your own words, get rubric-based scores, and read an evidence-based debrief. No sign-in or API key required.'
                  : '面試前演練、面試後複盤。用自己的話作答，依明文 rubric 評分，並取得區分「可觀察證據」與「建議」的複盤報告。不需登入、不需 API Key。'}
              </p>

              {/* Mode Tabs */}
              <div
                role="tablist"
                aria-label={isEnglish ? 'Practice mode' : '練習模式'}
                className="inline-flex gap-2 p-1 rounded-xl bg-surface-elevated border border-border-subtle mb-6"
              >
                <button
                  role="tab"
                  data-testid="tab-mock-interview"
                  aria-selected={mode === 'mock'}
                  onClick={() => setMode('mock')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    mode === 'mock'
                      ? 'bg-primary text-white shadow-glow-primary'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'
                  }`}
                >
                  <IconTarget size={16} aria-hidden="true" />
                  {isEnglish ? 'Mock interview' : '模擬面試'}
                </button>
                <button
                  role="tab"
                  data-testid="tab-question-bank"
                  aria-selected={mode === 'questionBank'}
                  onClick={() => setMode('questionBank')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    mode === 'questionBank'
                      ? 'bg-primary text-white shadow-glow-primary'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'
                  }`}
                >
                  <IconBook size={16} aria-hidden="true" />
                  {isEnglish ? 'Question bank' : '題庫'}
                </button>
              </div>

              {/* ===== Mock interview ===== */}
              {mode === 'mock' && (
                <section aria-labelledby="mock-heading" className="card space-y-5" data-testid="mock-interview-panel">
                  <div>
                    <h2 id="mock-heading" className="text-h4 text-ink mb-1 flex items-center gap-2">
                      <IconTarget size={18} className="text-primary" aria-hidden="true" />
                      {isEnglish ? `Start a ${TOTAL_QUESTIONS}-question mock interview` : `開始 ${TOTAL_QUESTIONS} 題模擬面試`}
                    </h2>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {isEnglish
                        ? 'Pick a role and level. You answer each question in writing, see a score with observable evidence and suggestions, then get a debrief report.'
                        : '選擇職務與職級後開始。每題以文字作答，送出後顯示分數、可觀察證據與建議；5 題結束後產生複盤報告。'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="job-type" className="block text-sm font-semibold text-ink mb-2">
                        {isEnglish ? 'Role' : '職務'}
                      </label>
                      <select
                        id="job-type"
                        data-testid="job-type-select"
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value as JobType)}
                        className="input-field"
                        disabled={isStarting}
                      >
                        {JOB_TYPES.map((jt) => (
                          <option key={jt} value={jt}>
                            {JOB_TYPE_LABELS[jt][lang]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="job-level" className="block text-sm font-semibold text-ink mb-2">
                        {isEnglish ? 'Level' : '職級'}
                      </label>
                      <select
                        id="job-level"
                        data-testid="job-level-select"
                        value={jobLevel}
                        onChange={(e) => setJobLevel(e.target.value as JobLevel)}
                        className="input-field"
                        disabled={isStarting}
                      >
                        {JOB_LEVELS.map((jl) => (
                          <option key={jl} value={jl}>
                            {JOB_LEVEL_LABELS[jl][lang]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      data-testid="start-mock-interview"
                      onClick={startMockInterview}
                      disabled={isStarting}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isStarting
                        ? isEnglish
                          ? 'Starting…'
                          : '準備題目中…'
                        : isEnglish
                          ? 'Start mock interview'
                          : '開始模擬面試'}
                      <IconArrowRight size={16} />
                    </button>
                    <Link href="/settings" className="btn-ghost text-sm">
                      <IconSettings size={14} />
                      {isEnglish ? 'Settings (optional API key)' : '設定（選填 API Key）'}
                    </Link>
                  </div>

                  {startError && (
                    <div role="alert" className="p-3 rounded-lg text-sm bg-danger/10 text-danger border border-danger/30">
                      {startError}
                    </div>
                  )}

                  <p className="text-xs text-ink-muted leading-relaxed border-t border-border-subtle pt-4">
                    {isEnglish
                      ? 'This tool is for rehearsal before an interview and review after it. It does not listen to live interviews, generate answers for you, or read answers aloud.'
                      : '本工具只用於面試前演練與面試後複盤：不會聆聽真實面試、不會替你產生答案，也不會用語音唸出答案。'}
                  </p>
                </section>
              )}

              {/* ===== Question bank ===== */}
              {mode === 'questionBank' && (
                <section aria-labelledby="bank-heading" className="space-y-4" data-testid="question-bank-panel">
                  <div className="card">
                    <div className="mb-4">
                      <h2 id="bank-heading" className="text-h4 text-ink mb-1 flex items-center gap-2">
                        <IconFileText size={18} className="text-primary" aria-hidden="true" />
                        {isEnglish ? 'Question bank' : '面試題庫'}
                      </h2>
                      <p className="text-xs text-ink-muted">
                        {isEnglish
                          ? 'Browse questions and answer hints. Draft your own answer — no sample answers are generated.'
                          : '瀏覽題目與答題提示，自行擬答；不會產生示範答案。'}
                      </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor="qb-type" className="text-xs text-ink-muted">{t.interview.questionBank.filterType}:</label>
                        <select
                          id="qb-type"
                          data-testid="qb-filter-type"
                          value={bankFilterType}
                          onChange={(e) => setBankFilterType(e.target.value as QuestionType | 'all')}
                          className="input-field w-auto min-w-[140px] text-xs"
                        >
                          <option value="all">{t.interview.questionBank.allTypes}</option>
                          {QUESTION_TYPES.map((qt) => (
                            <option key={qt} value={qt}>{QUESTION_TYPE_LABELS[qt][lang]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="qb-lang" className="text-xs text-ink-muted">{t.interview.questionBank.filterLang}:</label>
                        <select
                          id="qb-lang"
                          data-testid="qb-filter-lang"
                          value={bankFilterLang}
                          onChange={(e) => setBankFilterLang(e.target.value as Language | 'all')}
                          className="input-field w-auto min-w-[110px] text-xs"
                        >
                          <option value="all">{t.interview.questionBank.allLangs}</option>
                          <option value="en">English</option>
                          <option value="zh">中文</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="qb-job" className="text-xs text-ink-muted">{isEnglish ? 'Role' : '職務'}:</label>
                        <select
                          id="qb-job"
                          data-testid="qb-filter-job"
                          value={bankFilterJob}
                          onChange={(e) => setBankFilterJob(e.target.value as JobType | 'all' | 'general')}
                          className="input-field w-auto min-w-[130px] text-xs"
                        >
                          <option value="all">{isEnglish ? 'All roles' : '全部職務'}</option>
                          <option value="general">{isEnglish ? 'General (no role)' : '通用題'}</option>
                          {JOB_TYPES.map((jt) => (
                            <option key={jt} value={jt}>{JOB_TYPE_LABELS[jt][lang]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="qb-level" className="text-xs text-ink-muted">{isEnglish ? 'Level' : '職級'}:</label>
                        <select
                          id="qb-level"
                          data-testid="qb-filter-level"
                          value={bankFilterLevel}
                          onChange={(e) => setBankFilterLevel(e.target.value as JobLevel | 'all')}
                          className="input-field w-auto min-w-[110px] text-xs"
                        >
                          <option value="all">{isEnglish ? 'All levels' : '全部職級'}</option>
                          {JOB_LEVELS.map((jl) => (
                            <option key={jl} value={jl}>{JOB_LEVEL_LABELS[jl][lang]}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="text-xs text-ink-muted mb-3" data-testid="qb-count">
                      {filteredQuestions.length} {isEnglish ? 'questions' : '題'}
                    </div>

                    {filteredQuestions.length === 0 ? (
                      <div className="text-center py-8 text-ink-muted text-sm">
                        {t.interview.questionBank.noQuestions}
                      </div>
                    ) : (
                      <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1 list-none">
                        {filteredQuestions.map((q) => {
                          const isSelected = bankSelected?.id === q.id;
                          const typeColor =
                            q.type === 'behavioral' ? 'tag-accent' : q.type === 'system-design' ? 'tag-muted' : 'tag';
                          return (
                            <li key={q.id}>
                              <button
                                type="button"
                                data-testid={`qb-item-${q.id}`}
                                onClick={() => setBankSelected(isSelected ? null : q)}
                                aria-expanded={isSelected}
                                className={`w-full text-left p-3 rounded-lg border transition-all text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                  isSelected
                                    ? 'bg-primary/10 border-primary/40'
                                    : 'bg-surface border-border-subtle hover:border-primary/30 hover:bg-surface-hover'
                                }`}
                              >
                                <span className="block text-ink text-xs leading-relaxed">{q.question}</span>
                                <span className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className={typeColor}>{QUESTION_TYPE_LABELS[q.type][lang]}</span>
                                  <span className="text-[10px] text-ink-muted">{q.language === 'en' ? 'EN' : 'ZH'}</span>
                                  {q.jobType && q.jobLevel && (
                                    <span className="text-[10px] text-ink-muted">
                                      {JOB_TYPE_LABELS[q.jobType][lang]} · {JOB_LEVEL_LABELS[q.jobLevel][lang]}
                                    </span>
                                  )}
                                </span>
                                {q.hint && isSelected && (
                                  <span className="block mt-2 text-[11px] text-ink-secondary bg-surface-elevated rounded p-2 leading-relaxed">
                                    {t.interview.questionBank.hint}: {q.hint}
                                    <span className="block mt-1 text-ink-muted">
                                      {isEnglish ? 'Use your own words.' : '請用自己的話作答。'}
                                    </span>
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar: practice tools */}
            <aside aria-label={isEnglish ? 'Practice tools' : '練習工具'} className="animate-fade-in-up stagger-2 space-y-4">
              <div>
                <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider px-1 mb-2">
                  {isEnglish ? 'Practice Tools' : '練習工具'}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'timer', icon: <IconClock size={20} />, label: isEnglish ? 'Timer' : '計時器' },
                    { key: 'video', icon: <IconFileText size={20} />, label: isEnglish ? 'Camera' : '鏡頭預覽' },
                    { key: 'rating', icon: <IconTarget size={20} />, label: isEnglish ? 'Self-rating' : '自評' },
                  ].map((tool) => (
                    <button
                      key={tool.key}
                      onClick={() => setToolPanel(toolPanel === tool.key ? 'none' : (tool.key as ToolPanel))}
                      aria-pressed={toolPanel === tool.key}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        toolPanel === tool.key
                          ? 'bg-primary/15 border-primary/40 text-primary'
                          : 'bg-surface border-border-subtle text-ink-secondary hover:bg-surface-hover hover:text-ink'
                      }`}
                    >
                      {tool.icon}
                      <div className="text-xs font-medium">{tool.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {toolPanel === 'timer' && (
                <div className="card relative">
                  <button
                    onClick={() => setToolPanel('none')}
                    className="btn-icon absolute top-2 right-2"
                    aria-label={isEnglish ? 'Close timer' : '關閉計時器'}
                  >
                    <IconX size={14} />
                  </button>
                  <div className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
                    <IconClock size={16} />
                    {t.interview.timer.title}
                  </div>
                  <Timer initialMinutes={3} isEnglish={isEnglish} onComplete={() => {}} />
                </div>
              )}

              {toolPanel === 'video' && (
                <div className="card relative">
                  <button
                    onClick={() => setToolPanel('none')}
                    className="btn-icon absolute top-2 right-2"
                    aria-label={isEnglish ? 'Close camera preview' : '關閉鏡頭預覽'}
                  >
                    <IconX size={14} />
                  </button>
                  <div className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <IconFileText size={16} />
                    {isEnglish ? 'Camera preview (not recorded)' : '鏡頭預覽（不錄影、不上傳）'}
                  </div>
                  <VideoSimulation isEnglish={isEnglish} />
                </div>
              )}

              {toolPanel === 'rating' && (
                <div className="card relative">
                  <button
                    onClick={() => setToolPanel('none')}
                    className="btn-icon absolute top-2 right-2"
                    aria-label={isEnglish ? 'Close self-rating' : '關閉自評'}
                  >
                    <IconX size={14} />
                  </button>
                  <div className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                    <IconTarget size={16} />
                    {t.interview.rating.title}
                  </div>
                  <RatingForm isEnglish={isEnglish} onSubmit={() => {}} />
                </div>
              )}

              <div className="card">
                <h2 className="text-sm font-semibold text-ink mb-2">{isEnglish ? 'Past practice' : '練習紀錄'}</h2>
                <p className="text-xs text-ink-muted leading-relaxed mb-3">
                  {isEnglish
                    ? 'Finished reports are stored in this browser only.'
                    : '完成的複盤報告只儲存在這個瀏覽器。'}
                </p>
                <Link href="/dashboard" className="btn-ghost text-xs w-full">
                  {isEnglish ? 'View history' : '查看練習紀錄'}
                  <IconArrowRight size={14} />
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </main>

      <Footer locale={lang} />
    </div>
  );
}
