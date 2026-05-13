// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  // 구글 인증 콜백 등 특정 경로는 통과
  if (request.nextUrl.pathname.startsWith('/api/auth/callback')) {
    return NextResponse.next();
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // API 경로에 대해서는 CORS 헤더 추가 후 통과 (next-intl 적용 안함)
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // 기타 경로(페이지)에 대해서는 next-intl 적용
  return intlMiddleware(request);
}

// 매처 설정: API 경로와 페이지 경로 모두 매칭 (정적 파일 및 내부 파일 제외)
export const config = {
  matcher: [
    '/api/:path*', 
    // Enable a redirect to a matching locale at the root
    '/',
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(ko|zh|en)/:path*',
    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
};