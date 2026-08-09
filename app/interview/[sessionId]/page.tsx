'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { incrementQuota } from '@/app/lib/session/quota';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Answer {
  questionId: string;
  questionText: string;
  answerText: string;
  score: number;
  feedback: string;
  dimensions: { structure: number; depth: number; relevance: number; clarity: number };
}

interface SessionData {
  sessionId: string;
  jobType: string;
  jobLevel: string;
  interviewType: string;
  totalQuestions: number;
  currentQuestion: number;
  questions: Array<{ id: string; text: string; hint: string }>;
  answers: Answer[];
  startedAt: string;
}

interface ReportData {
  reportId: string;
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  radarData: { structure: number; depth: number; relevance: number; clarity: number; confidence: number };
  answers: Answer[];
}

export default function InterviewSessionPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const { user, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<SessionData | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{ score: number; feedback: string; dimensions: any } | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isSignedIn && user?.id) {
      const stored = localStorage.getItem(`apikey_${user.id}`);
      if (stored) setApiKey(stored);

      const sessionData = localStorage.getItem(`interview_session_${sessionId}`);
      if (sessionData) {
        setSession(JSON.parse(sessionData));
      } else {
        router.push('/interview');
      }
    }
  }, [isSignedIn, user?.id, sessionId, router]);

  const currentQ = session?.questions[session.questions.length - 1];

  async function submitAnswer() {
    if (!answerText.trim() || !session || !apiKey || isSubmitting) return;

    setIsSubmitting(true);
    setCurrentFeedback(null);

    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ?.id,
          answerText: answerText.trim(),
          jobType: session.jobType,
          jobLevel: session.jobLevel,
          askedQuestions: session.questions.map((q) => q.text),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '評分失敗');
      }

      const result = data.data;
      const newAnswer: Answer = {
        questionId: currentQ?.id || '',
        questionText: currentQ?.text || '',
        answerText: answerText.trim(),
        score: result.score,
        feedback: result.feedback,
        dimensions: result.dimensions,
      };

      const updatedSession: SessionData = {
        ...session,
        answers: [...session.answers, newAnswer],
        currentQuestion: session.currentQuestion + 1,
        questions: result.nextQuestion
          ? [...session.questions, { id: result.nextQuestion.id, text: result.nextQuestion.text, hint: result.nextQuestion.hint }]
          : session.questions,
      };

      setSession(updatedSession);
      localStorage.setItem(`interview_session_${sessionId}`, JSON.stringify(updatedSession));

      setCurrentFeedback({ score: result.score, feedback: result.feedback, dimensions: result.dimensions });

      if (result.isLast || session.currentQuestion >= session.totalQuestions) {
        // Will show end button after feedback
      }

      setAnswerText('');
    } catch (err: any) {
      alert(err.message || '發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function endInterview() {
    if (!session || !apiKey || isEnding) return;

    setIsEnding(true);

    try {
      const response = await fetch('/api/interview/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          sessionId,
          answers: session.answers,
          jobType: session.jobType,
          jobLevel: session.jobLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成報告失敗');
      }

      const reportData = data.data;
      setReport(reportData);
      setShowReport(true);

      // v3.0 SPEC §17.2 / AC-017: 完成一次 interview 就扣一次免費額度,
      // 達上限時 SessionInit 會自動顯示 paywall modal
      const quota = incrementQuota();
      window.dispatchEvent(new CustomEvent('aiia:quota-changed', { detail: { used: quota.used } }));

      // Save report to localStorage
      localStorage.setItem(`report_${reportData.reportId}`, JSON.stringify(reportData));

      // Update sessions list
      if (isSignedIn && user?.id) {
        const sessionsKey = `interview_sessions_${user.id}`;
        const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
        const updated = sessions.map((s: any) =>
          s.sessionId === sessionId ? { ...s, status: 'completed', reportId: reportData.reportId } : s
        );
        localStorage.setItem(sessionsKey, JSON.stringify(updated));
      }
    } catch (err: any) {
      alert(err.message || '發生錯誤');
      setIsEnding(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-[#667eea] animate-pulse">載入中...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center gap-4">
        <p className="text-[#888]">請先登入</p>
        <Link href="/sign-in">
          <button className="btn-brand">前往登入</button>
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center gap-4">
        <p className="text-[#888]">找不到面試記錄</p>
        <Link href="/interview">
          <button className="btn-brand">重新開始</button>
        </Link>
      </div>
    );
  }

  if (showReport && report) {
    return (
      <div className="min-h-screen bg-[#0f0f1a]">
        <nav className="flex justify-between items-center px-4 md:px-12 lg:px-16 py-4 border-b border-white/5">
          <Link href="/" className="text-xl font-bold text-white">
            <span className="gradient-text">AI Interview</span>
          </Link>
          <Link href="/dashboard" className="text-[#aaa] text-sm hover:text-white transition-colors">返回儀表板</Link>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-10">
          {/* Score Hero */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-white mb-2">{report.overallScore}</div>
            <div className="text-[#888] text-sm">滿分 100</div>
            <div className="mt-3 inline-block px-4 py-1.5 bg-[#667eea]/15 border border-[#667eea]/30 rounded-full text-[#667eea] text-sm font-semibold">
              {report.overallScore >= 80 ? '🌟 優秀' : report.overallScore >= 65 ? '👍 良好' : '💪 需要加強'}
            </div>
          </div>

          {/* Summary */}
          <div className="card mb-5">
            <h3 className="text-base font-semibold text-white mb-3">📝 AI 總結</h3>
            <p className="text-[#ccc] text-sm leading-relaxed">{report.summary}</p>
          </div>

          {/* Per-question scores */}
          <div className="card mb-5">
            <h3 className="text-base font-semibold text-white mb-4">📊 各題分數</h3>
            <div className="space-y-3">
              {report.answers.map((a, i) => (
                <div key={i} className="bg-white/3 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#667eea] text-xs font-semibold">Q{i + 1}</span>
                    <span className={`text-lg font-bold ${a.score >= 80 ? 'text-green-400' : a.score >= 65 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {a.score}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#555] leading-relaxed">{a.questionText}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="card">
              <h3 className="text-base font-semibold text-green-400 mb-3">💚 強項</h3>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="text-[#ccc] text-xs flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3 className="text-base font-semibold text-orange-400 mb-3">🧡 待改進</h3>
              <ul className="space-y-2">
                {report.improvements.map((item, i) => (
                  <li key={i} className="text-[#ccc] text-xs flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Radar Data */}
          {report.radarData && (
            <div className="card mb-5">
              <h3 className="text-base font-semibold text-white mb-4">📡 能力雷達圖</h3>
              <div className="space-y-2">
                {Object.entries(report.radarData).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[#aaa] text-xs w-20 capitalize">{key === 'relevance' ? '相關性' : key === 'structure' ? '結構' : key === 'depth' ? '深度' : key === 'clarity' ? '清晰度' : '信心'}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${value}%`,
                          background: value >= 80 ? '#22c55e' : value >= 65 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-white text-xs font-semibold w-8 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/interview" className="flex-1">
              <button className="w-full btn-brand py-3">🔄 再試一次</button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <button className="w-full btn-outline py-3 px-4">📊 儀表板</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = (session.currentQuestion / session.totalQuestions) * 100;
  const isLastQuestion = session.currentQuestion >= session.totalQuestions;

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 md:px-12 lg:px-16 py-4 border-b border-white/5">
        <Link href="/" className="text-xl font-bold text-white">
          <span className="gradient-text">AI Interview</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[#555] text-xs">
            {session.currentQuestion} / {session.totalQuestions}
          </span>
          <button
            onClick={endInterview}
            disabled={isEnding}
            className="text-[#ef4444] text-xs hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {isEnding ? '結束中...' : '提前結束'}
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-[#666] mb-2">
            <span>面試進度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
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
              問題 {session.currentQuestion}
            </span>
            <span className="text-[#555] text-xs">STAR 行為面試</span>
          </div>

          <h2 className="text-lg md:text-xl text-white font-semibold leading-relaxed mb-4">
            {currentQ?.text}
          </h2>

          {currentQ?.hint && (
            <div className="flex items-start gap-2 p-3 bg-[#667eea]/8 border border-[#667eea]/15 rounded-lg mb-4">
              <span className="text-[#667eea] text-sm mt-0.5">💡</span>
              <p className="text-[#aaa] text-xs leading-relaxed">{currentQ.hint}</p>
            </div>
          )}

          {/* Answer Input */}
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="用 STAR 法則回答這道問題...（至少 50 字）"
            className="input-field resize-none min-h-[140px] text-sm leading-relaxed"
            disabled={isSubmitting}
          />

          <div className="flex justify-between items-center mt-4">
            <span className="text-[#555] text-xs">{answerText.length} 字</span>
            <button
              onClick={submitAnswer}
              disabled={isSubmitting || answerText.trim().length < 10}
              className="btn-brand disabled:opacity-50 disabled:cursor-not-allowed text-sm px-6"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  評分中...
                </span>
              ) : (
                '送出回答'
              )}
            </button>
          </div>
        </div>

        {/* Feedback Panel */}
        {currentFeedback && (
          <div className="card mb-6 border-green-500/20 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <h3 className="text-base font-semibold text-white">AI 即時回饋</h3>
              <span className={`ml-auto text-2xl font-bold ${
                currentFeedback.score >= 80 ? 'text-green-400' : currentFeedback.score >= 65 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {currentFeedback.score}
              </span>
            </div>

            {/* Mini dimensions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(currentFeedback.dimensions).map(([key, value]) => (
                <div key={key} className="bg-white/3 rounded-lg p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#aaa] text-xs capitalize">
                      {key === 'structure' ? '結構' : key === 'depth' ? '深度' : key === 'relevance' ? '相關性' : '清晰度'}
                    </span>
                    <span className="text-white text-xs font-semibold">{value as number}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${value}%`,
                        background: (value as number) >= 80 ? '#22c55e' : (value as number) >= 65 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[#ccc] text-sm leading-relaxed">{currentFeedback.feedback}</p>
          </div>
        )}

        {/* Last Question - Show End Button */}
        {isLastQuestion && !showReport && (
          <div className="text-center">
            <p className="text-[#666] text-sm mb-4">這是最後一題！回答完成後點擊結束面試查看報告。</p>
            <button
              onClick={endInterview}
              disabled={isEnding}
              className="btn-brand px-10 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnding ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  生成報告中...
                </span>
              ) : (
                '📊 結束面試並查看報告'
              )}
            </button>
          </div>
        )}

        {/* Navigation hint */}
        {!currentFeedback && session.currentQuestion > 1 && (
          <div className="text-center text-[#555] text-xs">
            送出回答後，AI 將即時評分並提供下一題
          </div>
        )}
      </div>

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
