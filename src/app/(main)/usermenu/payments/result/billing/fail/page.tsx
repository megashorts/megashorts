'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export default function BillingFailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || '결제 중 문제가 발생했습니다.'
  const code = searchParams.get('code')

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
