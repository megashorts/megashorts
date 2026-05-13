import { validateRequest } from '@/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      console.error('Missing Cloudflare credentials:', { accountId: !!accountId, apiToken: !!apiToken });
      throw new Error("Cloudflare credentials not found");
    }
    
    console.log('Requesting upload URL for user:', user.username);

    // 1. 직접 업로드 URL 발급
    const uploadUrlResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxDurationSeconds: 3600,
          creator: user.username,
          requireSignedURLs: false,
          allowedOrigins: [
            "megashorts.com",          // 메인 도메인
            "www.megashorts.com",      // www 서브도메인
            "*.megashorts.com",        // 모든 서브도메인 (모바일 웹 포함)
            "m.megashorts.com",        // 모바일 전용 도메인 (필요한 경우)
            "localhost:3000"           // 개발 환경
          ],
          scheduledDeletion: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()  // 30일 후 (최소 요구사항)
        })
      }
    );

    const responseText = await uploadUrlResponse.text();
    console.log('Cloudflare raw response:', responseText);

    if (!uploadUrlResponse.ok) {
      console.error('Cloudflare API error:', responseText);
      return NextResponse.json(
        { error: "Failed to get upload URL" },
        { status: 500 }
      );
    }

    const { result } = JSON.parse(responseText);
    console.log('Cloudflare parsed response:', result);
    
    if (!result || !result.uploadURL || !result.uid) {
      throw new Error('Invalid response from Cloudflare');
    }

    // uploadURL을 uploadUrl로 변환
    const uploadUrl = result.uploadURL;
    const videoId = result.uid;

    // 2. HLS URL 생성 (videodelivery.net 사용)
    const hlsUrl = `https://videodelivery.net/${videoId}/manifest/video.m3u8`;

    const response = {
      uploadUrl,
      id: videoId,
      url: hlsUrl,
      filename: '',
      sequence: 0,
      isPremium: true,
      createdAt: new Date(),
      subtitle: [],
      views: []
    };

    console.log('Sending response to client:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
