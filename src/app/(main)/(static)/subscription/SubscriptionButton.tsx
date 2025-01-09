'use client';

import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";
import { useSubscription } from "@/hooks/useSubscription";

type SubscriptionType = 'weekly' | 'yearly' | 'upgrade';

interface SubscriptionButtonProps {
  type: 'weekly' | 'yearly';
  title: string;
  onSubscribe: (type: SubscriptionType) => void;
}

export function SubscriptionButton({ type, title, onSubscribe }: SubscriptionButtonProps) {
  const { user } = useSession();
  // useSubscription을 항상 호출 (enabled 옵션으로 제어)
  const { data: status, isLoading } = useSubscription();

  // 로그인하지 않은 경우 기본 버튼 표시
  if (!user?.id) {
    return (
      <Button
        onClick={() => onSubscribe(type)}
        className="mt-4 w-full"
      >
        {title} 시작하기
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button className="mt-4 w-full" disabled>
        로딩중...
      </Button>
    );
  }

  let buttonText = `${title} 시작하기`;
  let isDisabled = false;
  let subscriptionType: SubscriptionType = type;

  if (status?.isActive) {
    if (status.subscription === 'yearly') {
      buttonText = '현재 구독중입니다';
      isDisabled = true;
    } else if (status.subscription === 'weekly') {
      if (type === 'weekly') {
        buttonText = '현재 구독중입니다';
        isDisabled = true;
      } else if (type === 'yearly') {
        buttonText = '연간 구독 업그레이드';
        subscriptionType = 'upgrade';
      }
    }
  }

  return (
    <Button
      onClick={() => onSubscribe(subscriptionType)}
      className="mt-4 w-full"
      disabled={isDisabled}
    >
      {buttonText}
    </Button>
  );
}