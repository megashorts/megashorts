import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from '@/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const videos = await prisma.video.findMany({
      where: { postId },
      include: {
        views: true  // subtitle은 이제 include에서 제거
      },
      orderBy: { sequence: "asc" }
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("GET /api/videos error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { videos } = await req.json();

    await prisma.$transaction(
      videos.map((video: any) =>
        prisma.video.update({
          where: { id: video.id },
          data: { sequence: video.sequence }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/videos error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { videoId } = await req.json();

    const existingView = await prisma.videoView.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId
        }
      }
    });

    if (existingView) {
      return NextResponse.json({ success: true });
    }

    await prisma.videoView.create({
      data: {
        userId: user.id,
        videoId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/videos error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}