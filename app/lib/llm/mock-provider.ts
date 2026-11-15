// app/lib/llm/mock-provider.ts
// Mock provider：完全不連網、輸出確定（同樣輸入 → 同樣輸出）。
// 題目來自單一題庫（app/lib/questions/bank.ts），評分來自明文 rubric（app/lib/scoring/rubric.ts）。

import type { LlmProvider } from './types';
import { getDefaultQuestionSet, getInterviewQuestionSet } from '@/app/lib/questions/bank';
import { scoreAnswer, summarizeAnswers } from '@/app/lib/scoring/rubric';

const DEFAULT_HINT = '描述 Situation、Task、Action、Result 四個部分，盡量量化你的成果。';

export const mockProvider: LlmProvider = {
  async analyze() {
    return {
      mode: 'mock',
      questions: getDefaultQuestionSet().map((q) => ({ id: q.id, text: q.question, hint: q.hint ?? DEFAULT_HINT })),
      skills: ['溝通能力', '團隊合作', '解決問題', '邏輯思考'],
      scenarios: ['技術面試', '行為面試'],
      risks: ['STAR 結構不完整', '量化不足', '情境描述模糊'],
    };
  },

  async evaluate(_ctx, params) {
    const result = scoreAnswer({ answer: params.answer ?? '', questionText: params.questionText ?? '' });
    return {
      mode: 'mock',
      score: result.score,
      dimensions: result.dimensions,
      feedback: result.feedback,
      evidence: result.evidence,
      suggestions: result.suggestions,
    };
  },

  async generateQuestion(_ctx, params) {
    const pool = getInterviewQuestionSet(params.jobType, params.jobLevel);
    const asked = new Set(params.askedQuestions ?? []);
    const next = pool.find((q) => !asked.has(q.question)) ?? pool[0];
    return {
      mode: 'mock',
      questionId: next.id,
      question: next.question,
      hint: next.hint ?? DEFAULT_HINT,
    };
  },

  async finalReport(_ctx, params) {
    const report = summarizeAnswers(
      (params.answers ?? []).map((a) => ({ answerText: a.answerText ?? '', questionText: a.questionText ?? '' })),
    );
    return {
      mode: 'mock',
      summary: report.summary,
      strengths: report.strengths,
      improvements: report.improvements,
      radarData: report.radarData,
    };
  },

  async validateKey() {
    return { ok: false, error: 'MOCK_MODE_NO_KEY' };
  },
};
