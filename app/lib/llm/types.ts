// app/lib/llm/types.ts
// AC-002：AI 供應商可替換介面。所有 AI 相關 API route 只能透過 LlmProvider 取得結果，
// provider 由 app/lib/llm/router.ts 的單一工廠 resolveProvider() 選擇。

import type { Dimensions } from '@/app/lib/scoring/rubric';

export type { Dimensions } from '@/app/lib/scoring/rubric';

export type LlmMode = 'mock' | 'byok';

export interface LlmContext {
  mode: LlmMode;
  /** 使用者自備的 key；只在記憶體中傳遞，不得寫入 log 或錯誤訊息 */
  apiKey?: string;
  retryCount: number;
  /** 這個 HTTP 請求的整體期限（epoch ms）；超過後不再呼叫外部供應商，直接降級 Mock。 */
  deadline?: number;
  /**
   * 同一個請求內，前一次 AI 呼叫已降級時的原因。之後的呼叫直接降級，不再重試外部供應商，
   * 冷卻計數也只記一次（冷卻以「請求」為單位，不是以 AI 呼叫為單位）。
   */
  requestDegradedReason?: string;
}

/** 所有 provider 回傳值共用的模式／降級標示。 */
export interface ProviderMeta {
  mode: LlmMode;
  /** 正式供應商失敗、改由 Mock 回應時為 true */
  degraded?: boolean;
  /** 例如 openai_timeout、openai_429、openai_503、cooldown_active */
  degradedReason?: string;
  fallbackMode?: LlmMode;
}

export interface AnalysisResult extends ProviderMeta {
  questions: Array<{ id: string; text: string; hint?: string }>;
  skills: string[];
  scenarios: string[];
  risks: string[];
}

export interface EvaluationResult extends ProviderMeta {
  /** 0–100 整數 */
  score: number;
  dimensions: Dimensions;
  /** 一句話摘要 */
  feedback: string;
  /** 可觀察的證據：從使用者回答中實際偵測到的事實（一律由本機 rubric 產生，不由 LLM 生成） */
  evidence: string[];
  /** 建議：改進方向，不含替使用者撰寫的答案 */
  suggestions: string[];
}

export interface QuestionResult extends ProviderMeta {
  questionId?: string;
  question: string;
  hint: string;
}

export interface ReportResult extends ProviderMeta {
  summary: string;
  strengths: string[];
  improvements: string[];
  radarData: Dimensions;
}

export interface KeyValidationResult {
  ok: boolean;
  status?: number;
  /** 固定代碼，不含上游回傳的原始訊息（避免洩漏 key 片段） */
  error?: string;
}

export interface Answer {
  questionId: string;
  questionText: string;
  answerText: string;
  score?: number;
}

export interface LlmProvider {
  analyze(ctx: LlmContext, params: { resumeText: string; jobText: string }): Promise<AnalysisResult>;
  evaluate(ctx: LlmContext, params: { answer: string; questionText: string }): Promise<EvaluationResult>;
  generateQuestion(
    ctx: LlmContext,
    params: { jobType: string; jobLevel: string; askedQuestions: string[] },
  ): Promise<QuestionResult>;
  finalReport(ctx: LlmContext, params: { answers: Answer[]; jobType: string; jobLevel: string }): Promise<ReportResult>;
  validateKey(ctx: LlmContext): Promise<KeyValidationResult>;
}
