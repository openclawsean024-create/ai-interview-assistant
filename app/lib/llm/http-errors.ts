// app/lib/llm/http-errors.ts
// API route 共用的錯誤回應。訊息只用固定代碼，不回傳內部錯誤細節或 API key。

import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_FAILED_CODE, isAuthError } from './errors';
import { InvalidInputError } from '@/app/lib/practice/request-validation';
import { recordAuthFailure } from '@/app/lib/security/rate-limit';

export function errorResponse(error: unknown, req?: NextRequest) {
  if (error instanceof InvalidInputError) {
    return NextResponse.json({ error: error.code }, { status: 400 });
  }
  if (isAuthError(error)) {
    // 同一來源反覆用無效 key 試探 → 累計後由 checkRateLimit 擋下（見 app/lib/security/rate-limit.ts）。
    if (req) recordAuthFailure(req);
    return NextResponse.json(
      { error: AUTH_FAILED_CODE, message: 'OpenAI API key 失效或無效，請到設定頁重新設定' },
      { status: 400 },
    );
  }
  return NextResponse.json({ error: 'INTERNAL_ERROR', message: '伺服器發生錯誤，請稍後再試' }, { status: 500 });
}
