'use client';

import { formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Payment } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Ban } from 'lucide-react';

interface PaymentHistoryProps {
  userId: string;
  isAdmin?: boolean;
}

interface PaymentMetadata {
  coins?: number;
  subscriptionType?: 'weekly' | 'yearly';
  isAutoPayment?: boolean;
  cancelReason?: string;  // 취소 사유 추가
}

export default function PaymentHistory({ userId, isAdmin }: PaymentHistoryProps) {
  const { data: payments, refetch } = useQuery<Payment[]>({
    queryKey: ['payments', userId],
    queryFn: () => fetch(`/api/users/${userId}/payments`).then(res => res.json()),
    initialData: []
  });

  const handleCancel = async (paymentKey: string) => {
    if (!confirm('이 결제를 취소하시겠습니까?')) return;

    const res = await fetch('/api/payments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey })
    });

    if (res.ok) {
      refetch();
    }
  };

  const getPaymentInfo = (payment: Payment) => {
    const metadata = payment.metadata as PaymentMetadata | null;
    
    if (payment.type === 'coin' && metadata?.coins) {
      return {
        title: `${metadata.coins}코인 구매`,
        description: `${payment.amount.toLocaleString()}원`
      };
    }

    if (metadata?.subscriptionType) {
      const type = metadata.subscriptionType === 'weekly' ? '주간' : '연간';
      const isAuto = metadata.isAutoPayment ? ' (자동결제)' : '';
      return {
        title: `${type} 구독${isAuto}`,
        description: `${payment.amount.toLocaleString()}원`
      };
    }

    return {
      title: '결제',
      description: `${payment.amount.toLocaleString()}원`
    };
  };

  return (
    <div className="space-y-4">
      {payments?.map((payment: Payment) => {
        const info = getPaymentInfo(payment);
        const metadata = payment.metadata as PaymentMetadata | null;
        
        return (
          <div key={payment.id} 
               className={`rounded-lg bg-card p-4 ${
                 payment.status === 'cancelled' ? 'opacity-75' : ''
               }`}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{info.title}</h4>
                <p className="text-lg">{info.description}</p>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    payment.status === 'success' ? 'bg-green-100 text-green-800' :
                    payment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    payment.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''
                  }`}>
                    {payment.status === 'success' ? '결제 완료' :
                     payment.status === 'cancelled' ? '취소됨' :
                     payment.status === 'pending' ? '처리 중' : payment.status}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {formatDate(payment.createdAt, 'yyyy-MM-dd HH:mm')}
                </p>
                {isAdmin && payment.status === 'success' && payment.paymentKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(payment.paymentKey!)}
                    className="mt-2"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    취소
                  </Button>
                )}
              </div>
            </div>

            {metadata?.cancelReason && (
              <p className="mt-2 text-sm text-muted-foreground">
                취소 사유: {metadata.cancelReason}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}