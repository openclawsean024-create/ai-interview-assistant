// app/api/interview/answer/route.ts
// 評分一題回答，並回傳下一題（或 isComplete）。評分與出題都只經由 LlmProvider。
// 回饋分成 evidence（可觀察的證據）與 suggestions（建議）。伺服器不保存回答。

import { NextRequest, NextResponse } from 'next/server';
import { buildCtx, safeCall } from '@/app/lib/llm/router';
import { errorResponse } from '@/app/lib/llm/http-errors';
import {
  DEFAULT_JOB_LEVEL,
  DEFAULT_JOB_TYPE,
  MAX_ANSWER_CHARS,
  TOTAL_QUESTIONS,
} from '@/app/lib/practice/constants';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body?.sessionId;
    const questionText = typeof body?.questionText === 'string' ? body.questionText : '';
    const answerText = typeof body?.answerText === 'string' ? body.answerText : '';
    const jobType = typeof body?.jobType === 'string' ? body.jobType : DEFAULT_JOB_TYPE;
    const jobLevel = typeof body?.jobLevel === 'string' ? body.jobLevel : DEFAULT_JOB_LEVEL;
    const askedFromBody: string[] = Array.isArray(body?.askedQuestions)
      ? body.askedQuestions.filter((q: unknown): q is string => typeof q === 'string')
      : [];
    const askedQuestions = askedFromBody.length > 0 ? askedFromBody : questionText ? [questionText] : [];

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    if (answerText.length > MAX_ANSWER_CHARS) {
      return NextResponse.json({ error: 'ANSWER_TOO_LONG', maxChars: MAX_ANSWER_CHARS }, { status: 400 });
    }

    const ctx = buildCtx({ apiKey: req.headers.get('x-api-key') });
    const isBlank = answerText.trim().length === 0;
    // 空白回答一律由 Mock rubric 給 0 分：不把空白送給外部 AI，也不產生任何捏造的回饋。
    const evalCtx = isBlank ? buildCtx({}) : ctx;
    const evalResult = await safeCall(evalCtx, (p) => p.evaluate(evalCtx, { answer: answerText, questionText }));

    const isComplete = askedQuestions.length >= TOTAL_QUESTIONS;
    const nextQ = isComplete
      ? null
      : await safeCall(ctx, (p) => p.generateQuestion(ctx, { jobType, jobLevel, askedQuestions }));

    return NextResponse.json({
      success: true,
      data: {
        mode: evalResult.mode,
        degraded: Boolean(evalResult.degraded || nextQ?.degraded),
        degradedReason: evalResult.degradedReason ?? nextQ?.degradedReason ?? null,
        score: evalResult.score,
        dimensions: evalResult.dimensions,
        feedback: evalResult.feedback,
        evidence: evalResult.evidence,
        suggestions: evalResult.suggestions,
        nextQuestion: nextQ
          ? { id: `q${askedQuestions.length + 1}`, text: nextQ.question, hint: nextQ.hint }
          : null,
        isComplete,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
