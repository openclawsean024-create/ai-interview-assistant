// app/lib/practice/store.ts
// 模擬面試在瀏覽器端的資料模型與存取（全部存在 localStorage 的 aiia.* key）。

import type { Dimensions } from '@/app/lib/scoring/rubric';
import { STORAGE_KEYS, readJson, writeJson } from '@/app/lib/storage/local';

export interface PracticeQuestion {
  id: string;
  text: string;
  hint: string;
}

export interface PracticeAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
  score: number;
  feedback: string;
  /** 可觀察的證據 */
  evidence: string[];
  /** 建議 */
  suggestions: string[];
  dimensions: Dimensions;
}

export interface PracticeSession {
  sessionId: string;
  jobType: string;
  jobLevel: string;
  totalQuestions: number;
  mode: 'mock' | 'byok';
  /** 已出過的題目（最後一題是目前這題） */
  questions: PracticeQuestion[];
  answers: PracticeAnswer[];
  /** 已評分、但使用者還沒按「下一題」時暫存的下一題 */
  pendingNext: PracticeQuestion | null;
  startedAt: string;
}

export interface PracticeReport {
  reportId: string;
  sessionId: string;
  jobType: string;
  jobLevel: string;
  mode: 'mock' | 'byok';
  degraded: boolean;
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  radarData: Dimensions;
  answers: PracticeAnswer[];
  createdAt: string;
}

export interface PracticeHistoryEntry {
  reportId: string;
  sessionId: string;
  jobType: string;
  jobLevel: string;
  overallScore: number;
  questionCount: number;
  completedAt: string;
}

export function loadSession(sessionId: string): PracticeSession | null {
  return readJson<PracticeSession | null>(STORAGE_KEYS.interviewSession(sessionId), null);
}

export function saveSession(session: PracticeSession): void {
  writeJson(STORAGE_KEYS.interviewSession(session.sessionId), session);
}

export function loadReport(reportId: string): PracticeReport | null {
  return readJson<PracticeReport | null>(STORAGE_KEYS.report(reportId), null);
}

export function saveReport(report: PracticeReport): void {
  writeJson(STORAGE_KEYS.report(report.reportId), report);
  const history = loadHistory();
  const entry: PracticeHistoryEntry = {
    reportId: report.reportId,
    sessionId: report.sessionId,
    jobType: report.jobType,
    jobLevel: report.jobLevel,
    overallScore: report.overallScore,
    questionCount: report.answers.length,
    completedAt: report.createdAt,
  };
  writeJson(STORAGE_KEYS.practiceHistory, [entry, ...history.filter((h) => h.reportId !== report.reportId)].slice(0, 50));
}

export function loadHistory(): PracticeHistoryEntry[] {
  const list = readJson<PracticeHistoryEntry[]>(STORAGE_KEYS.practiceHistory, []);
  return Array.isArray(list) ? list : [];
}
