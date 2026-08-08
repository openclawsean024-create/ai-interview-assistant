// app/api/interview/start/route.ts
// v3.0 SPEC §16 + §17 Mock + BYOK 雙模式

import { NextRequest, NextResponse } from 'next/server';
import { buildCtx, safeCall } from '@/app/lib/llm/router';
import { mockProvider } from '@/app/lib/llm/mock-provider';
import { logEvent, getOrCreateSession } from '@/app/lib/session/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const jobType = body?.jobType ?? 'software-engineer';
    const jobLevel = body?.jobLevel ?? 'mid';
    const interviewType = body?.interviewType ?? 'behavioral';

    const apiKey = req.headers.get('x-api-key') ?? undefined;
    const userId = getOrCreateSession().uid;

    const ctx = buildCtx({
      mode: apiKey ? 'byok' : 'mock',
      apiKey,
      userId,
    });

    const sessionId = crypto.randomUUID();
    const askedQuestions: string[] = [];
    const totalQuestions = 5;

    // 先取第一題
    const firstQ = await safeCall(ctx, (p) =>
      p.generateQuestion(ctx, { jobType, jobLevel, askedQuestions }),
    );
    askedQuestions.push(firstQ.question);

    logEvent('interview_start', {
      sessionId,
      jobType,
      jobLevel,
      mode: firstQ.mode,
      degraded: firstQ.degraded ?? false,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        totalQuestions,
        jobType,
        jobLevel,
        interviewType,
        mode: firstQ.mode,
        degraded: firstQ.degraded ?? false,
        degradedReason: firstQ.reason ?? null,
        firstQuestion: {
          id: 'q1',
          text: firstQ.question,
          hint: firstQ.hint,
        },
      },
    });
  } catch (error: any) {
    // OPENAI_AUTH_FAILED → 4000 提示 key 失效
    if (error?.message === 'OPENAI_AUTH_FAILED') {
      return NextResponse.json(
        { error: 'OPENAI_AUTH_FAILED', message: 'OpenAI API key 失效或無效，請到 Settings 重新設定' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}
