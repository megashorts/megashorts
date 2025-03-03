'use client'

import { useSession } from "@/components/SessionProvider";
import { Button } from "@/components/ui/button";
import { logActivity } from "@/lib/activity-logger/client";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect } from "react";

interface PaymentSuccessModalProps {
  type: string;
  amount: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function PaymentSuccessModal({
  type,
  amount,
  onConfirm,
  onClose
}: PaymentSuccessModalProps) {

    const ment = type === 'weekly'
    ? '주간'
    : type === 'yearly'
    ? '연간'
    : type === 'upgrade'
    ? '연간'
    : '알 수 없는 구독 유형입니다.';

    const queryClient = useQueryClient();

    const session = useSession();
    const currentUser = session?.user?.username ? { username: session.user.username, id: session.user.id } : undefined;

    useEffect(() => {
      // 결제 완료 시 로그 기록 및 캐시 무효화
      logActivity({
        type: 'payment',
        event: `${type}-subscription`,
        username: currentUser?.username,
        details: {
          action: amount,
          result: 'success',
          // error: result.error
        }
      });
      
      // 구독페이지에서 사용하는 구독정보 훅과 시청시 재생권한체크에서 사용하는 훅의 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['subscription-info'] });
      queryClient.invalidateQueries({ queryKey: ['userAuth'] });
    }, [queryClient, type, currentUser]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[300px] rounded-lg bg-white dark:bg-black p-6 shadow-xl border flex flex-col items-center justify-evenly h-[400px]">
        {/* 로고 섹션 */}
        <div>
          <Image 
            src="/MS Logo emblem.svg" 
            alt="MEGASHORTS logo emblem" 
            width={100} 
            height={48} 
          />
        </div>

        {/* 텍스트 섹션 */}
        <div className="text-center my-4">
            {type === "upgrade" ? (
                <p className="text-lg text-gray-600 mb-2">{type}구독으로 업그레이드 되었습니다.</p>
            ) : (
                <p className="text-lg text-gray-600 mb-2">{type}구독이 시작되었습니다.</p>
            )}
            <p className="text-muted-foreground">결제금액: {amount}원</p>
        </div>

        {/* 버튼 섹션 */}
        <Button 
          onClick={onConfirm}
          className="w-full text-white py-2.5 px-4 rounded transition-colors text-sm"
        >
          확인
        </Button>
      </div>
    </div>
  );
}



<Image src="/MS Logo emblem.svg" alt="MEGASHORTS logo emblem" width={100} height={48} />
