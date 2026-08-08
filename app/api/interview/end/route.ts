// app/api/interview/end/route.ts
// v3.0 SPEC §16 + §17 Mock + BYOK 雙模式

import { NextRequest, NextResponse } from 'next/server';
import { buildCtx, safeCall } from '@/app/lib/llm/router';
import { logEvent, getOrCreateSession } from '@/app/lib/session/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body?.sessionId;
    const answers = body?.answers ?? [];
    const jobType = body?.jobType ?? 'software-engineer';
    const jobLevel = body?.jobLevel ?? 'mid';

    if (!sessionId || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Missing sessionId or answers' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key') ?? undefined;
    const userId = getOrCreateSession().uid;
    const ctx = buildCtx({ mode: apiKey ? 'byok' : 'mock', apiKey, userId });

    const overallScore = answers.reduce((sum: number, a: any) => sum + (a.score ?? 0), 0) / answers.length;
    const report = await safeCall(ctx, (p) =>
      p.finalReport(ctx, { answers, jobType, jobLevel }),
    );

    logEvent('interview_end', {
      sessionId,
      mode: report.mode,
      overallScore,
      degraded: report.degraded ?? false,
    });

    const reportId = crypto.randomUUID();
    return NextResponse.json({
      success: true,
      data: {
        reportId,
        mode: report.mode,
        degraded: report.degraded ?? false,
        degradedReason: report.reason ?? null,
        overallScore: Math.round(overallScore),
        summary: report.summary,
        strengths: report.strengths,
        improvements: report.improvements,
        radarData: report.radarData,
        answers: answers.map((a: any) => ({
          questionId: a.questionId,
          questionText: a.questionText,
          score: a.score,
          feedback: a.feedback,
          dimensions: a.dimensions,
          answerText: a.answerText,
        })),
      },
    });
  } catch (error: any) {
    if (error?.message === 'OPENAI_AUTH_FAILED') {
      return NextResponse.json(
        { error: 'OPENAI_AUTH_FAILED', message: 'OpenAI API key 失效或無效' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}
