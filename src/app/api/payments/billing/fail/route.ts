'use server'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const message = searchParams.get('message')

  // 실패 페이지로 리다이렉트 (에러 정보와 함께)
  const failUrl = new URL('/usermenu/payments/result/billing/fail', request.url)
  if (code) failUrl.searchParams.set('code', code)
  if (message) failUrl.searchParams.set('message', message)
  
  return NextResponse.redirect(failUrl)
}
