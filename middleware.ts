// middleware.ts
// v3.0 SPEC §17 (anonymous-first) + §5.2 (webhook signature verification hook)
//
// 目前是 placeholder middleware — 只設定安全 headers 並放行請求。
// 未來要加：
//   - IP-level rate limiting (SPEC §5.2)
//   - Stripe webhook 簽章驗證 (SPEC §5.2)
//   - 區域性內容協商 (i18n)
//
// 排除 _next/*、靜態檔、Chrome extension 檔、icons

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // v3.0 banner — 方便 monitoring / curl 偵測
  response.headers.set('x-aiia-version', 'v3.0');

  // 安全 headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  // 跑在 pages,排除 _next、靜態檔、icons、public assets、API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|.*\\.[\\w]+$).*)'],
};
