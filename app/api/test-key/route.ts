// app/api/test-key/route.ts
// v3.0 SPEC §16.4 BYOK key validation
// 本路由**僅**驗證 BYOK key 是否有效；無 key 時回 400，
// 不是 fallback 路徑（分析請用 /api/analyze）

import { NextRequest, NextResponse } from 'next/server';
import { logEvent, getOrCreateSession } from '@/app/lib/session/session';

export const runtime = 'nodejs';

const OPENAI_TIMEOUT_MS = 15_000;

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const { apiKey } = await req.json().catch(() => ({}));
    const userId = getOrCreateSession().uid;

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'No API key provided' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });

      if (response.ok) {
        logEvent('test_key_ok', { userId, durationMs: Date.now() - startedAt });
        return NextResponse.json({ ok: true });
      }

      const err = await response.json().catch(() => ({}));
      logEvent('test_key_invalid', {
        userId,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        { ok: false, error: err.error?.message || 'Invalid API key' },
        { status: 401 },
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError';
    return NextResponse.json(
      { ok: false, error: isTimeout ? 'Request timed out (15s)' : error?.message ?? 'Network error' },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
