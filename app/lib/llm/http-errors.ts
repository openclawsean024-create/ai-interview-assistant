// app/lib/llm/http-errors.ts
// API route 共用的錯誤回應。訊息只用固定代碼，不回傳內部錯誤細節或 API key。

import { NextResponse } from 'next/server';
import { AUTH_FAILED_CODE, isAuthError } from './errors';

export function errorResponse(error: unknown) {
  if (isAuthError(error)) {
    return NextResponse.json(
      { error: AUTH_FAILED_CODE, message: 'OpenAI API key 失效或無效，請到設定頁重新設定' },
      { status: 400 },
    );
  }
  return NextResponse.json({ error: 'INTERNAL_ERROR', message: '伺服器發生錯誤，請稍後再試' }, { status: 500 });
}
