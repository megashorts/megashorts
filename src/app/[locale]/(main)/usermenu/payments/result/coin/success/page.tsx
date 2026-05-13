'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PaymentSuccessModal from '../../../PaymentSuccessModal'
import { Button } from '@/components/ui/button'


export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // orderId에서 코인 수량 추출
  const getCoinsFromOrderId = (orderId: string | null) => {
    if (!orderId) return null;
    const parts = orderId.split('_');
    return parts.length === 3 ? parseInt(parts[2]) : null;
  };

  const coins = getCoinsFromOrderId(searchParams.get('orderId'));
  const amount = searchParams.get('amount');

  useEffect(() => {
    const processPayment = async () => {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      // const amount = searchParams.get('amount')
    
      try {
        const response = await fetch('/api/payments/coin/success?' + new URLSearchParams({
          paymentKey: paymentKey || '',
          orderId: orderId || '',
          amount: amount || '',
        }))
    
        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(errorData || '결제 처리 중 오류가 발생했습니다.')
        }

        // 결제 성공 시 모달 표시
        setShowSuccessModal(true)
      } catch (error) {
        console.error('Payment confirmation failed:', error)
        setError(error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.')
      }
    }

    if (searchParams.get('paymentKey')) {
      processPayment()
    } else {
      setError('결제 정보가 올바르지 않습니다.')
    }
  }, [searchParams])

  const handleConfirm = () => {
    router.push('/subscription?success=true')
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full p-6 bg-slate-900 rounded-lg shadow-lg border">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">결제 처리 실패</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Button 
              onClick={() => router.push('/subscription')}
              className="text-white px-6 py-2 rounded-lg transition-colors"
            >
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {showSuccessModal && coins && amount && (
        <PaymentSuccessModal
          coins={coins}
          amount={Number(amount).toLocaleString()}
          onConfirm={handleConfirm}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </>
  )
}
