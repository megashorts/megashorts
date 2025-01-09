'use client'

import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PaymentSuccessModalProps {
  coins: number;
  amount: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function PaymentSuccessModal({
  coins,
  amount,
  onConfirm,
  onClose
}: PaymentSuccessModalProps) {
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
          <p className="text-lg text-gray-600 mb-2">{coins} MS코인이 충전되었습니다.</p>
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