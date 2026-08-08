// app/api/interview/answer/route.ts
// v3.0 SPEC §16 + §17 Mock + BYOK 雙模式

import { NextRequest, NextResponse } from 'next/server';
import { buildCtx, safeCall } from '@/app/lib/llm/router';
import { logEvent, getOrCreateSession } from '@/app/lib/session/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body?.sessionId;
    const questionId = body?.questionId ?? 'q?';
    const questionText = body?.questionText ?? '';
    const answerText = body?.answerText ?? '';
    const jobType = body?.jobType ?? 'software-engineer';
    const jobLevel = body?.jobLevel ?? 'mid';
    const askedQuestions: string[] = body?.askedQuestions ?? [];

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    if (!answerText || answerText.trim().length === 0) {
      // §3.1 AC-003 不可捏造事實 → 空字串給低分與明確回饋
      return NextResponse.json({
        success: true,
        data: {
          mode: 'mock',
          score: 0,
          dimensions: { structure: 0, depth: 0, relevance: 0, clarity: 0, confidence: 0 },
          feedback: '未填寫回答。請用自己的話描述一個真實經驗。',
          nextQuestion: null,
          isComplete: false,
        },
      });
    }

    const apiKey = req.headers.get('x-api-key') ?? undefined;
    const userId = getOrCreateSession().uid;
    const ctx = buildCtx({ mode: apiKey ? 'byok' : 'mock', apiKey, userId });

    const evalResult = await safeCall(ctx, (p) =>
      p.evaluate(ctx, { answer: answerText, questionText }),
    );

    logEvent('interview_answer', {
      sessionId,
      questionId,
      mode: evalResult.mode,
      score: evalResult.score,
      degraded: evalResult.degraded ?? false,
    });

    return NextResponse.json({
      success: true,
      data: {
        mode: evalResult.mode,
        degraded: evalResult.degraded ?? false,
        degradedReason: evalResult.reason ?? null,
        score: evalResult.score,
        dimensions: evalResult.dimensions,
        feedback: evalResult.feedback,
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
