import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function POST(req: NextRequest) {
  const { user } = await validateRequest();
  if (!user) {
    return new NextResponse(null, { status: 401 });
  }

  const body = await req.json();
  const { videoId, timestamp, postId } = body;

  // 비동기로 저장 처리
  queueMicrotask(async () => {
    try {
      await prisma.videoView.upsert({
        where: {
          userId_videoId: {
            userId: user.id,
            videoId,
          }
        },
        update: { 
          lastTimestamp: timestamp,
        },
        create: {
          userId: user.id,
          videoId,
          lastTimestamp: timestamp,
          accessMethod: 'FREE',
        }
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  });

  // 즉시 응답
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ lastTimestamp: 0 });
    }

    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');
    if (!videoId) {
      return NextResponse.json({ lastTimestamp: 0 });
    }

    const progress = await prisma.videoView.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId,
        }
      }
    });

    return NextResponse.json({
      lastTimestamp: progress?.lastTimestamp || 0
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ lastTimestamp: 0 });
  }
}