'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PaymentSuccessModal from '../../PaymentSuccessModal'
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
        const response = await fetch('/api/payments/success?' + new URLSearchParams({
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

// 'use client'

// import { useEffect, useState } from 'react'
// import { useSearchParams, useRouter } from 'next/navigation'
// import PaymentSuccessModal from '../../PaymentSuccessModal'

// export default function PaymentSuccessPage() {
//   const searchParams = useSearchParams()
//   const router = useRouter()
//   const [error, setError] = useState<string | null>(null)
//   const [showSuccessModal, setShowSuccessModal] = useState(false)

//   // orderId에서 코인 수량 추출
//   const getCoinsFromOrderId = (orderId: string | null) => {
//     if (!orderId) return null;
//     const parts = orderId.split('_');
//     return parts.length === 3 ? parseInt(parts[2]) : null;
//   };

//   const coins = getCoinsFromOrderId(searchParams.get('orderId'));
//   const amount = searchParams.get('amount');

//   useEffect(() => {
//     // 결제 성공 처리
//     const processPayment = async () => {
//       const paymentKey = searchParams.get('paymentKey')
//       const orderId = searchParams.get('orderId')
//       const amount = searchParams.get('amount')
    
//       try {
//         // GET 메서드 사용 및 쿼리 파라미터로 전달
//         const response = await fetch('/api/payments/success?' + new URLSearchParams({
//           paymentKey: paymentKey || '',
//           orderId: orderId || '',
//           amount: amount || '',
//         }))
    
//         // 리다이렉트 응답 처리
//         if (response.redirected) {
//           // API route에서 설정한 리다이렉트 URL로 이동
//           window.location.href = response.url
//           return
//         }
    
//         // 리다이렉트가 아닌 경우에만 JSON 파싱 시도
//         if (!response.ok) {
//           const errorData = await response.text()
//           throw new Error(errorData || '결제 처리 중 오류가 발생했습니다.')
//         }
    
//         // 성공적으로 처리되면 subscription 페이지로 리다이렉트
//         router.push('/subscription?success=true')
//       } catch (error) {
//         console.error('Payment confirmation failed:', error)
//         setError(error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.')
//       }
//     }

//     if (searchParams.get('paymentKey')) {
//       processPayment()
//     } else {
//       setError('결제 정보가 올바르지 않습니다.')
//     }
//   }, [searchParams, router])

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
//           <div className="text-center">
//             <h1 className="text-2xl font-bold text-red-600 mb-4">결제 처리 실패</h1>
//             <p className="text-gray-600 mb-8">{error}</p>
//             <button 
//               onClick={() => router.push('/subscription')}
//               className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
//             >
//               돌아가기
//             </button>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="result wrapper">
//       <div className="box_section">
//         <h2>
//           결제 성공
//         </h2>
//         <p>{`주문 수량: ${coins}`}</p> 
//         <p>{`결제 금액: ${Number(
//           searchParams.get("amount")
//         ).toLocaleString()}원`}</p>
//         {/* <p>{`paymentKey: ${searchParams.get("paymentKey")}`}</p> */}
//       </div>
//     </div>
//   )
// }
