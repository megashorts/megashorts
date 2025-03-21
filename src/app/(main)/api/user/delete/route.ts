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

    // 사용자 정보 가져오기 (추천인 구조 워커에 필요한 정보)
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        referredBy: true,
        teamMaster: true,
        createdAt: true
      }
    });

    if (!userInfo) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 추천인 구조 워커 호출 (팀마스터가 있는 경우)
    if (userInfo.teamMaster) {
      try {
        const apiKey = process.env.WORKER_API_KEY || process.env.CRON_SECRET;
        const apiBaseUrl = 'https://referral-structure.msdevcm.workers.dev';
        
        // 팀마스터 정보는 이미 teamMaster으로 알고 있으므로 불필요한 DB 조회 제거
        // 워커에서는 username만 사용하므로 직접 전달
        
        // 워커로 전달하는 내용 로그 출력
        const requestBody = {
          masterUserId: userInfo.teamMaster,
          // userInfo를 최상위 레벨로 이동 (SyncReferralStructureRequest 인터페이스와 일치)
          userInfo: {
            username: userInfo.teamMaster // teamMaster이 실제로는 유저네임
          },
          options: {
            deleteMemberEvent: {
              userId: user.id,
              username: userInfo.username
            }
          }
        };
        
        console.log('추천인 구조 워커로 전달하는 내용 (삭제):', JSON.stringify(requestBody, null, 2));
        console.log('팀마스터 유저네임 (userInfo.teamMaster):', userInfo.teamMaster);
        
        // 추천인 구조 워커 호출 (sync 엔드포인트 사용)
        const response = await fetch(`${apiBaseUrl}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log('추천인 구조 워커 응답:', result);
        
        // 워커에서 로그를 기록하므로 클라이언트 측 로그는 제거
      } catch (error) {
        console.error('추천인 구조 워커 호출 오류:', error);
        
        // 워커에서 로그를 기록하므로 클라이언트 측 로그는 제거
        
        // 워커 호출 실패해도 계속 진행
      }
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

      // 사용자 정보 업데이트 (완전 삭제 대신 필수 정보만 남기고 나머지 삭제)
      await tx.user.update({
        where: { id: user.id },
        data: {
          // 유지할 필드: id, username(유니크한 값으로), referredBy, teamMaster, createdAt, subscriptionEndDate
          username: `deleted_${user.id}_${Date.now()}`, // 유저네임은 유니크한 값으로 처리
          displayName: "탈퇴한 사용자",
          email: null,
          passwordHash: null,
          googleId: null,
          // avatarUrl: null,
          bio: null,
          points: 0,
          adultauth: false,
          emailVerified: false,
          kakaoId: null,
          naverId: null,
          postCount: 0,
          userRole: 0,
          mscoin: 0,
          loginAttempts: 0,
          blockedUntil: null,
          // 탈퇴 날짜를 구독 종료일에 기록
          subscriptionEndDate: new Date()
        }
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
