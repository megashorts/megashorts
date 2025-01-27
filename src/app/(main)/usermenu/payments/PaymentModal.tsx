'use client'

import { useEffect, useState } from 'react'
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk"
import { nanoid } from 'nanoid'
import { useSession } from '@/components/SessionProvider'
import { AuthUser } from '@/lib/types'

interface PaymentModalProps {
  paymentAmount: number
  coins?: number
  onClose: () => void
}

// const customerKey = "Lf_QiT4USZ9eANDbcpXxi";

export default function PaymentModal({ paymentAmount: paymentAmount, coins, onClose }: PaymentModalProps) {
  // const [, setAmount] = useState(false)
  const [ready, setReady] = useState(false)
  const [widgets, setWidgets] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const orderId = `order_${nanoid()}_${coins}`
  const session = useSession();
  const user = session.user as AuthUser;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  // const customerKey = `${user?.id}_${dateStr}_${paymentAmount}`;
  const customerKey = `${user?.id}`;

  useEffect(() => {
    async function fetchPaymentWidgets() {

      // ------  결제위젯 초기화 ------
      // const tossPayments = await loadTossPayments(clientKey);
      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || '')
      const widgets = tossPayments.widgets({ 
        customerKey, 
      })
      // 회원 결제
      // const widgets = tossPayments.widgets({
      //   customerKey,
      // });
      // 비회원 결제
      // const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
  
      setWidgets(widgets);
    }
  
    fetchPaymentWidgets();
  }, [customerKey]);

  useEffect(() => {
    async function renderPaymentWidgets() {
      if (!widgets) return

      try {
        // 금액 설정
        await widgets.setAmount({
          value: paymentAmount,
          currency: 'KRW'
        })

        // DOM id를 토스 문서와 일치시킴
        await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#payment-method",  
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#agreement",
            variantKey: "AGREEMENT",
          })
        ])

        setReady(true)
      } catch (err) {
        console.error('결제 위젯 렌더링 실패:', err)
        setError('결제 수단을 불러오는데 실패했습니다.')
      }
    }

    renderPaymentWidgets()
  }, [widgets, paymentAmount]);

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handlePayment = async () => {
    if (!widgets || !ready) return

    try {
      // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
      // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
      // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
      await widgets.requestPayment({
        orderId: orderId,
        orderName: coins + "MS코인",
        successUrl: `${window.location.origin}/usermenu/payments/result/success`,
        failUrl: `${window.location.origin}/usermenu/payments/result/fail`,
        customerEmail: user.email,
        customerName: user.username,
        customerMobilePhone: "01012341234",
      })
    } catch (err) {
      console.error('결제 요청 실패:', err)
      setError('결제 처리 중 모달페이지에서 오류가 발생했습니다. ')
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-1">
        <div className="w-full max-w-[450px] rounded-lg bg-white dark:bg-white p-1 shadow-xl">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-gray-900 dark:text-black pl-6 pt-2">
              💎 {coins ? `${coins}코인 구매` : '구독 결제'}
            </h1>
            <button
              onClick={onClose}
              className="pl-2 pr-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="닫기"
            >
              <svg 
                className="w-5 h-5 text-gray-500" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded text-sm">
              {error}
            </div>
          )}
          
          <div id="payment-method" className="mb-0" />
          <div id="agreement" className="mb-0" />
          
          <button 
            onClick={handlePayment}
            disabled={!ready}
            className="w-full bg-red-500 text-white py-2.5 px-6 mb-2 rounded rounded-2xl hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            {!ready ? '로딩중...' : '결제하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 'use client'

// import {
//   Dialog,
//   DialogContent,
//   DialogOverlay,
//   DialogPortal,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import { useEffect, useState } from 'react'
// import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk"
// import { nanoid } from 'nanoid'

// interface PaymentModalProps {
//   amount: number
//   coins?: number
//   onClose: () => void
// }

// export default function PaymentModal({ amount, coins, onClose }: PaymentModalProps) {
//   const [ready, setReady] = useState(false)
//   const [widgets, setWidgets] = useState<any>(null)
//   const [error, setError] = useState<string | null>(null)
//   const orderId = `order_${nanoid()}`

//   useEffect(() => {
//     const initPayment = async () => {
//       try {
//         // 토스페이먼츠 SDK 초기화
//         const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || '')
//         const paymentWidgets = tossPayments.widgets({ customerKey: ANONYMOUS })
        
//         // 금액 설정
//         await paymentWidgets.setAmount({
//           value: amount,
//           currency: 'KRW'
//         })
        
//         setWidgets(paymentWidgets)
//         setError(null)
//       } catch (err) {
//         console.error('결제 위젯 초기화 실패:', err)
//         setError('결제 위젯을 불러오는데 실패했습니다.')
//       }
//     }

//     // 모달이 마운트된 후 초기화 시작
//     const timer = setTimeout(() => {
//       initPayment()
//     }, 0)

//     return () => clearTimeout(timer)
//   }, [amount])

//   useEffect(() => {
//     if (!widgets) return

//     const renderWidgets = async () => {
//       try {
//         // UI 렌더링
//         await widgets.renderPaymentMethods({
//           selector: "#payment-widget",
//           variantKey: "DEFAULT",
//         })
//         await widgets.renderAgreement({
//           selector: "#agreement",
//           variantKey: "AGREEMENT",
//         })
//         setReady(true)
//       } catch (err) {
//         console.error('결제 위젯 렌더링 실패:', err)
//         setError('결제 수단을 불러오는데 실패했습니다.')
//       }
//     }

//     renderWidgets()
//   }, [widgets])

//   const handlePayment = async () => {
//     if (!widgets || !ready) return

//     try {
//       await widgets.requestPayment({
//         orderId: orderId,
//         orderName: coins ? `메가쇼츠 ${coins}코인` : "메가쇼츠 구독",
//         customerEmail: "subscriber@example.com",
//         customerName: "구독자",
//         successUrl: `${window.location.origin}/usermenu/payments/result/success`,
//         failUrl: `${window.location.origin}/usermenu/payments/result/fail`,
//       })
//     } catch (err) {
//       console.error('결제 요청 실패:', err)
//       setError('결제 처리 중 오류가 발생했습니다.')
//     }
//   }

//   return (
//     <Dialog open onOpenChange={onClose}>
//       <DialogPortal>
//         <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
//         <DialogContent className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-[560px] bg-white p-5 shadow-xl rounded-lg">
//           <DialogTitle className="sr-only">
//             {coins ? `${coins}코인 구매` : '구독 결제'}
//           </DialogTitle>
          
//           <h1 className="text-lg font-bold mb-4 ml-6 text-gray-900">
//             {coins ? `${coins}코인 구매` : '구독 결제'}
//           </h1>
          
//           {error && (
//             <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded text-sm">
//               {error}
//             </div>
//           )}
          
//           <div id="payment-widget" className="mb-4" />
//           <div id="agreement" className="mb-4" />
          
//           <button 
//             onClick={handlePayment}
//             disabled={!ready}
//             className="w-full bg-red-500 text-white py-2.5 px-4 rounded hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
//           >
//             {!ready ? '로딩중...' : '결제하기'}
//           </button>
//         </DialogContent>
//       </DialogPortal>
//     </Dialog>
//   )
// }
