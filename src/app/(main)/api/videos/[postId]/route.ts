import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    // URL에서 쿼리 파라미터 가져오기
    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');
    const sequence = url.searchParams.get('sequence');

    // sequence로 조회
    if (sequence) {
      const video = await prisma.video.findFirst({
        where: {
          postId,
          sequence: parseInt(sequence)
        }
      });

      if (!video) {
        return new NextResponse(null, { status: 404 });
      }

      return NextResponse.json(video);
    }

    // videoId로 조회 (기존 로직)
    if (videoId) {
      const video = await prisma.video.findUnique({
        where: { id: videoId }
      });

      if (!video) {
        return new NextResponse(null, { status: 404 });
      }

      return NextResponse.json(video);
    }

    return new NextResponse(null, { status: 400 });
  } catch (error) {
    console.error('Error fetching video:', error);
    return new NextResponse(null, { status: 500 });
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { postId: string } }
// ) {
//   try {
//     const resolvedParams = await Promise.resolve(params);
//     const postId = resolvedParams.postId;

//     // URL에서 videoId 쿼리 파라미터 가져오기
//     const url = new URL(request.url);
//     const videoId = url.searchParams.get('videoId');

//     if (!videoId) {
//       return new NextResponse(null, { status: 400 });
//     }

//     const video = await prisma.video.findUnique({
//       where: { id: videoId }
//     });

//     if (!video) {
//       return new NextResponse(null, { status: 404 });
//     }

//     return NextResponse.json(video);
//   } catch (error) {
//     console.error('Error fetching video:', error);
//     return new NextResponse(null, { status: 500 });
//   }
// }