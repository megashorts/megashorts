// 'use client'

// import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk"
// import { useEffect, useState } from "react"
// import { useSearchParams } from 'next/navigation'
// import { nanoid } from 'nanoid'

// const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || ''

// export default function PaymentsPage() {
//   const searchParams = useSearchParams()
//   const amount = Number(searchParams.get('amount')) || 50000
//   const coins = Number(searchParams.get('coins')) || 0
  
//   const [ready, setReady] = useState(false)
//   const [widgets, setWidgets] = useState<any>(null)
//   const [error, setError] = useState<string | null>(null)
//   const orderId = `order_${nanoid()}`

//   useEffect(() => {
//     async function fetchPaymentWidgets() {
//       try {
//         const tossPayments = await loadTossPayments(clientKey)
//         const paymentWidgets = tossPayments.widgets({ customerKey: ANONYMOUS })
//         setWidgets(paymentWidgets)
//       } catch (err) {
//         console.error('결제 위젯 초기화 실패:', err)
//         setError('결제 위젯을 불러오는데 실패했습니다.')
//       }
//     }

//     fetchPaymentWidgets()
//   }, [])

//   useEffect(() => {
//     async function renderPaymentWidgets() {
//       if (!widgets) return
  
//       try {
//         // 1. 먼저 금액 설정
//         await widgets.setAmount({
//           value: 5000,
//           currency: 'KRW'
//         })
  
//         // 2. 결제 UI 렌더링
//         await widgets.renderPaymentMethods({
//           selector: "#payment-method",
//           variantKey: "DEFAULT",
//         })
        
//         // 3. 이용약관 UI 렌더링
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
  
//     renderPaymentWidgets()
//   }, [widgets, amount])

//   // useEffect(() => {
//   //   async function renderPaymentWidgets() {
//   //     if (!widgets) return

//   //     try {
//   //       await widgets.renderPaymentMethods("#payment-widget", {
//   //         value: amount,
//   //         currency: "KRW",
//   //         country: "KR",
//   //       })
//   //       await widgets.renderAgreement('#agreement')
//   //       setReady(true)
//   //     } catch (err) {
//   //       console.error('결제 위젯 렌더링 실패:', err)
//   //       setError('결제 수단을 불러오는데 실패했습니다.')
//   //     }
//   //   }

//   //   renderPaymentWidgets()
//   // }, [widgets, amount])

//   const handlePayment = async () => {
//     if (!widgets || !ready) return

//     try {
//       await widgets.requestPayment({
//         orderId: orderId,
//         orderName: coins ? `MS Making ${coins}코인` : "MS Making 구독",
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
//     <div className="w-full max-w-[480px] mx-auto bg-white p-5">
//       <h1 className="text-lg font-bold mb-4 text-gray-900">
//         {coins ? `${coins}코인 구매` : '구독 결제'}
//       </h1>
//       {error && (
//         <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
//           {error}
//         </div>
//       )}
//       <div id="payment-method" className="mb-4" />
//       <div id="agreement" className="mb-4" />
//       <button 
//         onClick={handlePayment}
//         disabled={!ready}
//         className="w-full bg-red-500 text-white py-2.5 px-4 rounded hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
//       >
//         {!ready ? '로딩중...' : '결제하기'}
//       </button>
//     </div>
//   )
// }