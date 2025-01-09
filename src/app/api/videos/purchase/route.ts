import { NextRequest } from "next/server";
import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { AccessMethod } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { user } = await validateRequest();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 트랜잭션으로 코인 차감과 시청 권한 부여
  const result = await prisma.$transaction(async (tx) => {
    // 코인 차감
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        mscoin: { decrement: 2 },
      },
    });

    // 시청 권한 기록
    const videoView = await tx.videoView.create({
      data: {
        userId: user.id,
        videoId: params.videoId,
        accessMethod: AccessMethod.POINT_PAYMENT,
      },
    });

    return { updatedUser, videoView };
  });

  return Response.json(result);
}