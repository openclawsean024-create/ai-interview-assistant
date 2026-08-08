// app/lib/llm/types.ts
// v3.0 SPEC §16.2 LLM Provider 介面

export type LlmMode = 'mock' | 'byok';

export interface LlmContext {
  mode: LlmMode;
  apiKey?: string;
  userId: string;
  retryCount: number;
}

export interface AnalysisResult {
  mode: LlmMode;
  degraded?: boolean;
  reason?: string;
  fallbackMode?: LlmMode;
  questions: Array<{ id: string; text: string; hint?: string }>;
  skills: string[];
  scenarios: string[];
  risks: string[];
}

export interface EvaluationResult {
  mode: LlmMode;
  degraded?: boolean;
  reason?: string;
  fallbackMode?: LlmMode;
  score: number;
  dimensions: {
    structure: number;
    depth: number;
    relevance: number;
    clarity: number;
    confidence: number;
  };
  feedback: string;
}

export interface QuestionResult {
  mode: LlmMode;
  degraded?: boolean;
  reason?: string;
  fallbackMode?: LlmMode;
  question: string;
  hint: string;
}

export interface ReportResult {
  mode: LlmMode;
  degraded?: boolean;
  reason?: string;
  fallbackMode?: LlmMode;
  summary: string;
  strengths: string[];
  improvements: string[];
  radarData: {
    structure: number;
    depth: number;
    relevance: number;
    clarity: number;
    confidence: number;
  };
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
  generateQuestion(ctx: LlmContext, params: { jobType: string; jobLevel: string; askedQuestions: string[] }): Promise<QuestionResult>;
  finalReport(ctx: LlmContext, params: { answers: Answer[]; jobType: string; jobLevel: string }): Promise<ReportResult>;
}
