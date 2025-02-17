import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다" },
        { status: 401 }
      );
    }

    // 관련된 데이터를 트랜잭션으로 삭제
    await prisma.$transaction(async (tx) => {
      // 비디오 조회 기록 삭제
      await tx.videoView.deleteMany({
        where: { userId: user.id },
      });

      // 비디오 진행상태 삭제
      await tx.userVideoProgress.deleteMany({
        where: { userId: user.id },
      });

      // 좋아요 삭제
      await tx.like.deleteMany({
        where: { userId: user.id },
      });

      // 북마크 삭제
      await tx.bookmark.deleteMany({
        where: { userId: user.id },
      });

      // 댓글 삭제
      await tx.comment.deleteMany({
        where: { userId: user.id },
      });

      // 알림 삭제 (발신/수신)
      await tx.notification.deleteMany({
        where: {
          OR: [
            { recipientId: user.id },
            { issuerId: user.id }
          ]
        },
      });

      // 비밀번호 재설정 토큰 삭제
      await tx.passwordResetToken.deleteMany({
        where: { user_id: user.id },
      });

      // 문의사항 삭제
      await tx.inquiry.deleteMany({
        where: { userId: user.id },
      });

      // 구독 정보 삭제
      await tx.subscription.deleteMany({
        where: { userId: user.id },
      });

      // 빌링키 삭제
      await tx.billingKey.deleteMany({
        where: { userId: user.id },
      });

      // 결제 내역 삭제
      await tx.payment.deleteMany({
        where: { userId: user.id },
      });

      // 팔로우 관계 삭제
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: user.id },
            { followingId: user.id }
          ]
        },
      });

      // 포스트 삭제
      await tx.post.deleteMany({
        where: { userId: user.id },
      });

      // 세션 삭제
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // 마지막으로 사용자 삭제
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    return NextResponse.json({ message: "계정이 삭제되었습니다" });
  } catch (error) {
    console.error("Account deletion error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "계정 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
