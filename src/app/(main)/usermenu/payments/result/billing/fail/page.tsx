'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export default function BillingFailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || '결제 중 문제가 발생했습니다.'
  const code = searchParams.get('code')
  const orderId = searchParams.get('orderId')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const updatePaymentStatus = async () => {
      if (!orderId) {
        console.error('결제 실패: orderId가 없습니다.');
        return;
      }
      
      try {
        // 결제 실패 상태 업데이트
        const response = await fetch('/api/payments/statusdb', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            status: 'fail',
            failureReason: message || '알 수 없는 오류',
          }),
        });
        
        if (!response.ok) {
          console.error('결제 실패 상태 업데이트 실패:', await response.text());
          setError('결제 상태 업데이트에 실패했습니다.');
        }
      } catch (error) {
        console.error('결제 실패 상태 업데이트 중 오류:', error);
        setError('결제 상태 업데이트 중 오류가 발생했습니다.');
      }
    };
    
    if (orderId) {
      updatePaymentStatus();
    }
  }, [orderId, message]);

  const handleClose = () => {
    router.push('/subscription?error=' + encodeURIComponent(message))
  }

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="sm:max-w-md">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-lg font-semibold">
            결제에 실패했습니다
          </h2>
          <p className="mb-6 text-gray-600 text-sm dark:text-gray-300">
            {decodeURIComponent(message)}
          </p>
          <div className="space-x-4">
            <Button 
              onClick={handleClose}
              className="w-full text-white py-2.5 px-4 rounded transition-colors text-sm"
            >
              확인
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
