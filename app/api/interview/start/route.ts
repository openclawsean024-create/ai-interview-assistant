// app/api/interview/start/route.ts
// 開始一場模擬面試：回傳 sessionId 與第一題。無 key → Mock；有 x-api-key → BYOK（失敗自動降級 Mock）。
// 伺服器不保存任何 session 或回答（狀態全部在瀏覽器 localStorage）。

import { NextRequest, NextResponse } from 'next/server';
import { buildCtx, safeCall } from '@/app/lib/llm/router';
import { errorResponse } from '@/app/lib/llm/http-errors';
import { TOTAL_QUESTIONS } from '@/app/lib/practice/constants';
import { readJobLevel, readJobType } from '@/app/lib/practice/request-validation';
import { checkRateLimit } from '@/app/lib/security/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const limited = checkRateLimit(req, { kind: 'api', usesKey: Boolean(req.headers.get('x-api-key')) });
    if (limited) return limited;
    const body = await req.json().catch(() => ({}));
    const jobType = readJobType(body?.jobType);
    const jobLevel = readJobLevel(body?.jobLevel);
    const interviewType = body?.interviewType === 'technical' ? 'technical' : 'behavioral';

    const ctx = buildCtx({ apiKey: req.headers.get('x-api-key') });
    const firstQ = await safeCall(ctx, (p) => p.generateQuestion(ctx, { jobType, jobLevel, askedQuestions: [] }));

    return NextResponse.json({
      success: true,
      data: {
        sessionId: crypto.randomUUID(),
        totalQuestions: TOTAL_QUESTIONS,
        jobType,
        jobLevel,
        interviewType,
        mode: firstQ.mode,
        degraded: firstQ.degraded ?? false,
        degradedReason: firstQ.degradedReason ?? null,
        firstQuestion: { id: 'q1', text: firstQ.question, hint: firstQ.hint },
      },
    });
  } catch (error) {
    return errorResponse(error, req);
  }
}
