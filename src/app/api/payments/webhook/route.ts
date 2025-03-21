import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let webhookLog;
  
  try {
    // 웹훅 요청 본문 파싱
    const body = await req.json();
    
    // 웹훅 로그 저장
    webhookLog = await prisma.webhookLog.create({
      data: {
        eventType: body.eventType || 'unknown',
        payload: body,
        status: 'received'
      }
    });

    // 토스페이먼츠 웹훅 검증
    // 실제 구현 시에는 토스페이먼츠 문서에 따라 서명 검증 등의 보안 조치를 추가해야 함
    
    // 결제 정보 추출
    const { paymentKey, orderId, status } = body;
    
    if (!paymentKey || !orderId) {
      console.error("Invalid webhook payload:", body);
      
      if (webhookLog) {
        await prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { 
            status: 'failed',
            error: '필수 파라미터가 누락되었습니다'
          }
        });
      }
      
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다" },
        { status: 400 }
      );
    }

    // 결제 정보 조회
    const payment = await prisma.payment.findUnique({
      where: { orderId }
    });

    if (!payment) {
      console.error("Payment not found:", orderId);
      
      if (webhookLog) {
        await prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { 
            status: 'failed',
            error: '결제 정보를 찾을 수 없습니다'
          }
        });
      }
      
      return NextResponse.json(
        { error: "결제 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 메타데이터 추출
    const metadata = payment.metadata as any || {};

    // 결제 상태에 따른 처리
    let dbStatus;
    
    switch (status) {
      case 'DONE':
        dbStatus = 'confirm';
        break;
      case 'CANCELED':
        dbStatus = 'cancelled';
        break;
      case 'READY':
        dbStatus = 'pending';
        break;
      case 'IN_PROGRESS':
        dbStatus = 'processing';
        break;
      case 'WAITING_FOR_DEPOSIT':
        dbStatus = 'waiting';
        break;
      case 'FAILED':
        dbStatus = 'fail';
        break;
      default:
        dbStatus = 'unknown';
    }

    // 결제 상태 업데이트 API 호출
    const statusResponse = await fetch(`${req.nextUrl.origin}/api/payments/statusdb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 웹훅은 서버 간 통신이므로 인증 토큰이 없음
        // 실제 구현 시에는 서버 간 인증을 위한 API 키 등을 사용해야 함
        'X-Webhook-Auth': process.env.WEBHOOK_SECRET_KEY || '',
      },
      body: JSON.stringify({
        orderId: orderId,
        status: dbStatus,
        paymentKey: paymentKey,
        metadata: {
          webhookStatus: status,
          webhookTimestamp: new Date().toISOString()
        }
      }),
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error("Payment status update failed:", errorText);
      
      if (webhookLog) {
        await prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { 
            status: 'failed',
            error: `결제 상태 업데이트 실패: ${errorText}`
          }
        });
      }
      
      throw new Error(`결제 상태 업데이트에 실패했습니다: ${errorText}`);
    }

    // 결제 상태에 따른 추가 처리
    if (status === 'DONE') {
      // 코인 결제인 경우 사용자 코인 증가
      if (payment.type === 'coin' && metadata.coins) {
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            mscoin: { increment: metadata.coins }
          }
        });
        
        // 알림 생성
        await prisma.notification.create({
          data: {
            recipientId: payment.userId,
            issuerId: payment.userId,
            type: 'COIN',
            metadata: {
              amount: metadata.coins,
              reason: '코인구매'
            }
          }
        });
      } 
      // 구독 결제인 경우 구독 정보 업데이트
      else if (payment.type === 'subscription' && metadata.subscriptionType) {
        const periodEnd = metadata.isAutoPayment && metadata.nextPeriodEnd
          ? new Date(metadata.nextPeriodEnd)
          : metadata.periodEnd
          ? new Date(metadata.periodEnd)
          : undefined;

        if (periodEnd) {
          const now = new Date();
          await prisma.subscription.upsert({
            where: { userId: payment.userId },
            update: {
              status: 'active',
              currentPeriodEnd: periodEnd,
              updatedAt: now
            },
            create: {
              userId: payment.userId,
              status: 'active',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              type: metadata.subscriptionType
            }
          });

          await prisma.user.update({
            where: { id: payment.userId },
            data: {
              subscriptionEndDate: periodEnd
            }
          });
        }
      }
    } 
    // 결제 취소인 경우 처리
    else if (status === 'CANCELED') {
      // 코인 결제 취소인 경우 사용자 코인 차감
      if (payment.type === 'coin' && payment.status === 'success' && metadata.coins) {
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            mscoin: { decrement: metadata.coins }
          }
        });
      } 
      // 구독 결제 취소인 경우 구독 상태 업데이트
      else if (payment.type === 'subscription') {
        // 구독 정보 조회
        const subscription = await prisma.subscription.findUnique({
          where: { userId: payment.userId }
        });
        
        if (subscription) {
          // 현재 구독 기간이 남아있는 경우 cancelAtPeriodEnd만 true로 설정
          // 이미 만료된 경우 바로 cancelled로 변경
          const now = new Date();
          if (subscription.currentPeriodEnd > now) {
            await prisma.subscription.update({
              where: { userId: payment.userId },
              data: {
                cancelAtPeriodEnd: true,
                updatedAt: new Date()
              }
            });
          } else {
            await prisma.subscription.update({
              where: { userId: payment.userId },
              data: {
                status: 'cancelled',
                updatedAt: new Date()
              }
            });
          }
        }
      }
    }

    // 웹훅 로그 업데이트
    if (webhookLog) {
      await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { status: 'success' }
      });
    }

    return new Response('OK');
  } catch (err) {
    const error = err as Error;
    console.error('Webhook error:', error);
    
    // 웹훅 로그 업데이트
    if (webhookLog) {
      await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { 
          status: 'failed',
          error: error.message || 'Unknown error'
        }
      });
    }
    
    return new Response('Error', { status: 500 });
  }
}
