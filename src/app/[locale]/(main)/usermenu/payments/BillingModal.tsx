'use client'

import { useEffect } from 'react'
import { loadTossPayments } from "@tosspayments/tosspayments-sdk"
import { useSession } from '@/components/SessionProvider'
import { AuthUser } from '@/lib/types'

interface BillingModalProps {
  type: 'weekly' | 'yearly' | 'upgrade'; 
  amount: number;
  onClose: () => void;
}

export default function BillingModal({ type, amount, onClose }: BillingModalProps) {
  const session = useSession();
  // const user = session.user as AuthUser;
  const user = session.user as unknown as AuthUser;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const customerKey = `${user?.id}_${dateStr}_${amount}`;
  const clientKey = process.env.NEXT_PUBLIC_BILLING_PAYMENTS_CLIENT_KEY || '';

  useEffect(() => {
    let isSubscribed = true;

    const initBilling = async () => {
      if (!clientKey) {
        console.error('결제 클라이언트 키가 설정되지 않았습니다.');
        onClose();
        return;
      }

      try {
        if (!isSubscribed) return;
        
        // 결제 시도 정보 저장 (orderId 생성)
        const orderId = `billing_${customerKey}_${Date.now()}`;
        
        try {
          // 결제 시도 정보 저장
          const statusResponse = await fetch('/api/payments/statusdb', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
              status: 'try',
              amount: amount,
              type: 'subscription',
              method: type, // weekly, yearly, upgrade 등
              metadata: {
                subscriptionType: type,
                currency: 'KRW'
              }
            }),
          });

          if (!statusResponse.ok) {
            const errorData = await statusResponse.json();
            console.error('결제 시도 정보 저장 실패:', errorData);
            // 실패해도 결제는 계속 진행 (로깅만 함)
          }
        } catch (tryError) {
          console.error('결제 시도 정보 저장 실패:', tryError);
          // 실패해도 결제는 계속 진행 (로깅만 함)
        }
        
        if (!isSubscribed) return;
        
        const tossPayments = await loadTossPayments(clientKey)
        if (!isSubscribed) return;
        
        const payment = tossPayments.payment({ customerKey })
        if (!isSubscribed) return;
        
        await payment.requestBillingAuth({
          method: "CARD",
          // successUrl: `${window.location.origin}/api/payments/billing/success?type=${type}&amount=${amount}`,
          // failUrl: `${window.location.origin}/api/payments/billing/fail`,
          // successUrl: `${window.location.origin}/usermenu/payments/result/billing/success`,
          successUrl: `${window.location.origin}/usermenu/payments/result/billing/success?type=${type}&amount=${amount}&orderId=${orderId}`,
          failUrl: `${window.location.origin}/usermenu/payments/result/billing/fail?orderId=${orderId}`,
          customerEmail: user.email || '',
          customerName: user.username,
        })
      } catch (err) {
        if (isSubscribed) {
          // 에러 로깅 제거하고 모달만 닫기
          setTimeout(() => {
            if (isSubscribed) {
              onClose();
            }
          }, 0);
        }
      }
    }

    // 모달 열릴 때 스크롤 방지
    document.body.style.overflow = 'hidden'
    initBilling()
    
    // cleanup
    return () => {
      isSubscribed = false
      document.body.style.overflow = 'unset'
    }
  }, [type, amount, customerKey, onClose, clientKey, user.email, user.username])

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-[480px] rounded-lg bg-white dark:bg-gray-800 p-5 shadow-xl">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-2" />
            <p className="text-gray-600 dark:text-gray-300">
              결제창을 불러오는 중입니다...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
