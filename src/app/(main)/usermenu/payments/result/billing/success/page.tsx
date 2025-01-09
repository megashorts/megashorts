'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import BillingSuccessModal from '../../../BillingSuccessModal'
import { Button } from '@/components/ui/button'

export default function BillingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const type = searchParams.get('type');
  const amount = searchParams.get('amount');
  const customerKey = searchParams.get('customerKey');
  const authKey = searchParams.get('authKey');

  useEffect(() => {
    const processPayment = async () => {
      // const paymentKey = searchParams.get('paymentKey')
      // const orderId = searchParams.get('orderId')
      // const amount = searchParams.get('amount')
    
      try {
        const response = await fetch('/api/payments/billing/success?' + new URLSearchParams({
          type: type || '',
          amount: amount || '',
          customerKey: customerKey || '',
          authKey: authKey || '',
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

    if (type && amount && customerKey && authKey) {
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
      {showSuccessModal && type && amount && (
        <BillingSuccessModal
          type={type}
          amount={Number(amount).toLocaleString()}
          onConfirm={handleConfirm}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </>
  )
}



// 'use client'

// import { useRouter } from 'next/navigation'
// import { Button } from '@/components/ui/button'
// import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
// import Image from "next/image";

// export default function BillingSuccessPage() {
//   const router = useRouter()

//   const handleClose = () => {
//     router.push('/')
//   }

//   return (
//     <Dialog open={true} onOpenChange={handleClose}>
//       <DialogTitle></DialogTitle>
//       <DialogContent className="sm:max-w-md">
//         <div className="text-center">

//           {/* 로고 섹션 */}
//           <div>
//             <Image 
//               src="/MS Logo emblem.svg" 
//               alt="MEGASHORTS logo emblem" 
//               width={100} 
//               height={48} 
//             />
//           </div>

//           {/* <div className="mb-4 text-green-500">
//             <svg
//               className="mx-auto h-12 w-12"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M5 13l4 4L19 7"
//               />
//             </svg>
//           </div> */}
//           <h2 className="mb-4 text-2xl font-semibold">
//             구독 신청이 완료되었습니다!
//           </h2>
//           <p className="mb-6 text-gray-600 dark:text-gray-300">
//             이제 프리미엄 콘텐츠를 자유롭게 이용하실 수 있습니다.
//           </p>
//           {/* <Button onClick={handleClose}>
//             확인
//           </Button> */}
//           <Button 
//             onClick={handleClose}
//             className="w-full text-white py-2.5 px-4 rounded transition-colors text-sm"
//           >
//             확인
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }
