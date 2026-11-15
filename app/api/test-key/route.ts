// app/api/test-key/route.ts
// 驗證使用者自備的 API key 是否有效。驗證動作由 LlmProvider.validateKey 執行，
// route 內不直接呼叫外部端點；回應只含固定錯誤代碼，不回傳上游原始訊息。

import { NextRequest, NextResponse } from 'next/server';
import { buildCtx, resolveProvider } from '@/app/lib/llm/router';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'No API key provided' }, { status: 400 });
    }

    const ctx = buildCtx({ apiKey });
    const result = await resolveProvider(ctx).validateKey(ctx);
    if (result.ok) return NextResponse.json({ ok: true });

    const status = result.status === 401 || result.status === 403 ? 401 : result.status === 504 ? 504 : 502;
    return NextResponse.json({ ok: false, error: result.error ?? 'KEY_CHECK_FAILED' }, { status });
  } catch {
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
