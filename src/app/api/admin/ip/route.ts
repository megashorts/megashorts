import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  // 실제 IP 가져오기
  const headersList = await headers();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // 디버그: 모든 헤더 로깅
  // console.log('모든 헤더:', {
  //   'request.headers': Object.fromEntries(request.headers.entries()),
  //   'headers()': Object.fromEntries(headersList.entries())
  // });
  
  const ip = cfConnectingIp || 
            forwardedFor?.split(',')[0] || 
            realIp || 
            'unknown';

  // 국가 정보 가져오기 (Vercel에서는 x-vercel-ip-country 헤더도 사용 가능)
  const country = request.headers.get('cf-ipcountry') || 
                 request.headers.get('x-vercel-ip-country') || 
                 'unknown';

  // 디버그 로그
  // console.log('Request headers:', {
  //   host: request.headers.get('host'),
  //   'user-agent': request.headers.get('user-agent'),
  //   'x-forwarded-for': forwardedFor,
  //   'x-real-ip': realIp,
  //   'cf-connecting-ip': cfConnectingIp,
  //   'x-forwarded-host': request.headers.get('x-forwarded-host'),
  //   'x-forwarded-proto': request.headers.get('x-forwarded-proto')
  // });

  return NextResponse.json({
    ip,
    country,
    city: 'unknown'  // Pro 플랜 업그레이드 전까지 unknown
  });
}
