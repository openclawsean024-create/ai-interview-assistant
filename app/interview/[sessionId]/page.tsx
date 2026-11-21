'use client';

// app/interview/[sessionId]/page.tsx
// 模擬面試逐題作答（AC-006）：不需登入、不需 API key。
// 流程：作答 → 送出 → 顯示分數、可觀察證據、建議 → 下一題 … → 第 5 題後結束 → 導向 /report/[id]。
// 所有狀態存在瀏覽器 localStorage（aiia.interview.session.<id>）；伺服器不保存回答。

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { incrementQuota } from '@/app/lib/session/quota';
import { readApiKey } from '@/app/lib/storage/local';
import {
  loadSession,
  saveReport,
  saveSession,
  type PracticeAnswer,
  type PracticeReport,
  type PracticeSession,
} from '@/app/lib/practice/store';
import { DIMENSION_LABELS, type DimensionKey } from '@/app/lib/scoring/rubric';
import { MAX_ANSWER_CHARS } from '@/app/lib/practice/constants';

const DIMENSION_ORDER: DimensionKey[] = ['structure', 'depth', 'relevance', 'clarity', 'confidence'];

function scoreTone(score: number) {
  return score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
}

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = readApiKey();
  if (apiKey) headers['x-api-key'] = apiKey; // 只有使用者自備 key 時才送出
  return headers;
}

export default function InterviewSessionPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const router = useRouter();

  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState('');
  const [degradedReason, setDegradedReason] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadSession(sessionId);
    // 已結束的場次：直接導向報告，不再顯示作答與「結束」按鈕。
    if (stored?.reportId) {
      router.replace(`/report/${stored.reportId}`);
      return;
    }
    setSession(stored);
    setLoaded(true);
  }, [sessionId, router]);

  function persist(next: PracticeSession) {
    setSession(next);
    saveSession(next);
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-[#667eea] animate-pulse">載入中...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center gap-4">
        <p className="text-[#888]" data-testid="session-not-found">找不到這場模擬面試的紀錄</p>
        <Link href="/interview" className="btn-primary">
          重新開始
        </Link>
      </div>
    );
  }

  const total = session.totalQuestions;
  const answeredCount = session.answers.length;
  const currentQ = session.questions[session.questions.length - 1];
  // 目前這題是否已作答（已作答 → 顯示回饋，等待「下一題」或「結束」）
  const currentAnswered = answeredCount === session.questions.length;
  const lastAnswer: PracticeAnswer | null = currentAnswered ? session.answers[answeredCount - 1] : null;
  const allDone = answeredCount >= total;
  const displayNumber = session.questions.length;
  const progress = Math.round((answeredCount / total) * 100);

  async function submitAnswer() {
    if (!session || isSubmitting || currentAnswered) return;
    const text = answerText.trim();
    if (!text) return;

    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/interview/answer/', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          questionText: currentQ.text,
          answerText: text,
          jobType: session.jobType,
          jobLevel: session.jobLevel,
          askedQuestions: session.questions.map((q) => q.text),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || payload?.error || '評分失敗');
      }
      const result = payload.data;
      const newAnswer: PracticeAnswer = {
        questionId: currentQ.id,
        questionText: currentQ.text,
        answerText: text,
        score: result.score,
        feedback: result.feedback,
        evidence: Array.isArray(result.evidence) ? result.evidence : [],
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
        dimensions: result.dimensions,
      };
      setDegradedReason(result.degraded ? result.degradedReason ?? 'unknown' : null);
      persist({
        ...session,
        answers: [...session.answers, newAnswer],
        pendingNext: result.nextQuestion ?? null,
      });
      setAnswerText('');
    } catch (err: any) {
      // 失敗時保留使用者已輸入的內容
      setError(err?.message || '發生錯誤，請再試一次');
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToNextQuestion() {
    if (!session || !session.pendingNext) return;
    persist({
      ...session,
      questions: [...session.questions, session.pendingNext],
      pendingNext: null,
    });
    setError('');
  }

  async function endInterview() {
    if (!session || isEnding || session.answers.length === 0) return;
    // 以 localStorage 的最新狀態為準：另一個分頁已結束這場時，不再產生第二份報告。
    const latest = loadSession(sessionId);
    if (latest?.reportId) {
      router.replace(`/report/${latest.reportId}`);
      return;
    }
    setIsEnding(true);
    setError('');
    try {
      const response = await fetch('/api/interview/end/', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          sessionId,
          answers: session.answers,
          jobType: session.jobType,
          jobLevel: session.jobLevel,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || payload?.error || '產生報告失敗');
      }
      const data = payload.data;
      const report: PracticeReport = {
        reportId: data.reportId,
        sessionId,
        jobType: session.jobType,
        jobLevel: session.jobLevel,
        mode: data.mode === 'byok' ? 'byok' : 'mock',
        degraded: Boolean(data.degraded),
        overallScore: data.overallScore,
        summary: data.summary,
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        radarData: data.radarData,
        answers: session.answers,
        createdAt: new Date().toISOString(),
      };
      saveReport(report);
      saveSession({ ...session, reportId: report.reportId });

      // 完成一次練習就計一次免費額度（僅計數與提示，不阻擋使用）。
      const quota = incrementQuota();
      window.dispatchEvent(new CustomEvent('aiia:quota-changed', { detail: { used: quota.used } }));

      router.push(`/report/${report.reportId}`);
    } catch (err: any) {
      setError(err?.message || '發生錯誤，請再試一次');
      setIsEnding(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <nav className="flex justify-between items-center px-4 md:px-12 lg:px-16 py-4 border-b border-white/5">
        <Link href="/" className="text-xl font-bold text-white">
          <span className="gradient-text">AI Interview</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[#888] text-xs" data-testid="question-progress">
            第 {displayNumber} / {total} 題
          </span>
          <span
            data-testid="session-mode"
            data-mode={session.mode}
            className="px-2 py-0.5 rounded-full border border-white/10 text-[10px] text-[#aaa]"
          >
            {session.mode === 'byok' ? '自備 API Key 模式' : 'Demo 模式（Mock）'}
          </span>
          {answeredCount > 0 && !allDone && (
            <button
              onClick={endInterview}
              disabled={isEnding}
              data-testid="end-early-btn"
              className="text-[#ef4444] text-xs hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {isEnding ? '結束中...' : '提前結束'}
            </button>
          )}
        </div>
      </nav>

      <main id="main-content" className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-[#888] mb-2">
            <span>已完成 {answeredCount} / {total} 題</span>
            <span>{progress}%</span>
          </div>
          <div
            className="w-full bg-white/5 rounded-full h-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 bg-[#667eea]/15 text-[#667eea] text-xs font-semibold rounded-full">
              問題 {displayNumber}
            </span>
            <span className="text-[#888] text-xs">STAR 行為面試</span>
          </div>

          <h1 className="text-lg md:text-xl text-white font-semibold leading-relaxed mb-4" data-testid="question-text">
            {currentQ.text}
          </h1>

          {currentQ.hint && (
            <div className="flex items-start gap-2 p-3 bg-[#667eea]/8 border border-[#667eea]/15 rounded-lg mb-4">
              <p className="text-[#aaa] text-xs leading-relaxed">提示：{currentQ.hint} 請用自己的話作答。</p>
            </div>
          )}

          {!currentAnswered ? (
            <>
              <label htmlFor="answer-input" className="sr-only">你的回答</label>
              <textarea
                id="answer-input"
                data-testid="answer-input"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                maxLength={MAX_ANSWER_CHARS}
                placeholder="用自己的話、依 STAR（情境、任務、行動、結果）描述一個真實經驗…"
                className="input-field resize-none min-h-[160px] text-sm leading-relaxed"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-[#888] text-xs">{answerText.length} 字</span>
                <button
                  onClick={submitAnswer}
                  data-testid="submit-answer"
                  disabled={isSubmitting || answerText.trim().length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm px-6"
                >
                  {isSubmitting ? '評分中...' : '送出回答'}
                </button>
              </div>
            </>
          ) : (
            <details className="text-sm">
              <summary className="cursor-pointer text-[#888] text-xs">你的回答</summary>
              <p className="mt-2 text-[#ccc] leading-relaxed whitespace-pre-wrap" data-testid="submitted-answer">
                {lastAnswer?.answerText}
              </p>
            </details>
          )}
        </div>

        {error && (
          <div role="alert" data-testid="session-error" className="card mb-6 border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Feedback Panel */}
        {lastAnswer && (
          <section className="card mb-6 border-green-500/20 animate-fade-in" data-testid="feedback-panel" aria-live="polite">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-white">本題評分</h2>
              <span className={`ml-auto text-2xl font-bold ${scoreTone(lastAnswer.score)}`} data-testid="answer-score">
                {lastAnswer.score}
              </span>
              <span className="text-[#888] text-xs">/ 100</span>
            </div>

            {degradedReason && (
              <p className="mb-3 text-xs text-yellow-300" data-testid="degraded-notice">
                AI 服務暫時無法使用，本題已改用 Mock rubric 評分（{degradedReason}）。
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {DIMENSION_ORDER.map((key) => {
                const value = lastAnswer.dimensions?.[key] ?? 0;
                return (
                  <div key={key} className="bg-white/3 rounded-lg p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[#aaa] text-[11px]">{DIMENSION_LABELS[key]}</span>
                      <span className="text-white text-xs font-semibold" data-testid={`dimension-${key}`}>{value}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${value}%`,
                          background: value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[#ccc] text-sm leading-relaxed mb-4" data-testid="answer-feedback">{lastAnswer.feedback}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/3 rounded-lg p-3" data-testid="feedback-evidence">
                <h3 className="text-xs font-semibold text-[#8ea2ff] mb-2">可觀察證據</h3>
                <ul className="space-y-1.5 text-xs text-[#ccc] leading-relaxed list-disc pl-4">
                  {lastAnswer.evidence.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/3 rounded-lg p-3" data-testid="feedback-suggestions">
                <h3 className="text-xs font-semibold text-[#f5b942] mb-2">建議</h3>
                <ul className="space-y-1.5 text-xs text-[#ccc] leading-relaxed list-disc pl-4">
                  {lastAnswer.suggestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Next / End */}
        {currentAnswered && !allDone && session.pendingNext && (
          <div className="text-center">
            <button onClick={goToNextQuestion} data-testid="next-question" className="btn-primary px-10 py-3 text-base">
              下一題
            </button>
          </div>
        )}

        {currentAnswered && (allDone || !session.pendingNext) && (
          <div className="text-center">
            <p className="text-[#888] text-sm mb-4">已完成全部題目，結束後會產生複盤報告。</p>
            <button
              onClick={endInterview}
              disabled={isEnding}
              data-testid="end-interview"
              className="btn-primary px-10 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnding ? '產生報告中...' : '結束面試並查看報告'}
            </button>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
