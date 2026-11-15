// app/api/interview/end/route.ts
// 結束模擬面試並產生複盤報告。報告內容只經由 LlmProvider；伺服器不保存報告或回答。

import { NextRequest, NextResponse } from 'next/server';
import { buildCtx, safeCall } from '@/app/lib/llm/router';
import { errorResponse } from '@/app/lib/llm/http-errors';
import { DEFAULT_JOB_LEVEL, DEFAULT_JOB_TYPE, MAX_ANSWER_CHARS, TOTAL_QUESTIONS } from '@/app/lib/practice/constants';

export const runtime = 'nodejs';

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body?.sessionId;
    const rawAnswers: any[] = Array.isArray(body?.answers) ? body.answers : [];
    const jobType = typeof body?.jobType === 'string' ? body.jobType : DEFAULT_JOB_TYPE;
    const jobLevel = typeof body?.jobLevel === 'string' ? body.jobLevel : DEFAULT_JOB_LEVEL;

    if (!sessionId || typeof sessionId !== 'string' || rawAnswers.length === 0) {
      return NextResponse.json({ error: 'Missing sessionId or answers' }, { status: 400 });
    }
    if (rawAnswers.length > TOTAL_QUESTIONS * 2) {
      return NextResponse.json({ error: 'TOO_MANY_ANSWERS' }, { status: 400 });
    }

    const answers = rawAnswers.map((a, i) => ({
      questionId: typeof a?.questionId === 'string' ? a.questionId : `q${i + 1}`,
      questionText: typeof a?.questionText === 'string' ? a.questionText : '',
      answerText: typeof a?.answerText === 'string' ? a.answerText.slice(0, MAX_ANSWER_CHARS) : '',
      score: typeof a?.score === 'number' && Number.isFinite(a.score) ? Math.max(0, Math.min(100, Math.round(a.score))) : 0,
      feedback: typeof a?.feedback === 'string' ? a.feedback : '',
      evidence: stringList(a?.evidence),
      suggestions: stringList(a?.suggestions),
      dimensions: a?.dimensions ?? null,
    }));

    const ctx = buildCtx({ apiKey: req.headers.get('x-api-key') });
    const report = await safeCall(ctx, (p) => p.finalReport(ctx, { answers, jobType, jobLevel }));
    const overallScore = Math.round(answers.reduce((sum, a) => sum + a.score, 0) / answers.length);

    return NextResponse.json({
      success: true,
      data: {
        reportId: crypto.randomUUID(),
        sessionId,
        jobType,
        jobLevel,
        mode: report.mode,
        degraded: report.degraded ?? false,
        degradedReason: report.degradedReason ?? null,
        overallScore,
        summary: report.summary,
        strengths: report.strengths,
        improvements: report.improvements,
        radarData: report.radarData,
        answers,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
