'use client';

import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";
import { useSubscription } from "@/hooks/useSubscription";
import Link from "next/link";
import { useTranslations } from "next-intl";

type SubscriptionType = 'weekly' | 'yearly' | 'upgrade';

interface SubscriptionButtonProps {
  type: 'weekly' | 'yearly';
  title: string;
  onSubscribe: (type: SubscriptionType) => void;
}

export function SubscriptionButton({ type, title, onSubscribe }: SubscriptionButtonProps) {
  const { user } = useSession();
  const t = useTranslations('Subscription');
  const tCommon = useTranslations('Common');
  // useSubscription을 항상 호출 (enabled 옵션으로 제어)
  const { data: status, isLoading } = useSubscription();

  // 로그인하지 않은 경우 기본 버튼 표시
  // if (!user?.id) {
  //   return (
  //     <Button
  //       onClick={() => onSubscribe(type)}
  //       className="mt-4 w-full"
  //     >
  //       {title} 시작하기
  //     </Button>
  //   );
  // }

  if (!user?.id) {
    return (
      <Link href="/login" className="w-full">
        <Button className="mt-4 w-full">
          {t('startPlan', { title })}
        </Button>
      </Link>
    );
  }

  if (isLoading) {
    return (
      <Button className="mt-4 w-full" disabled>
        {tCommon('loading')}
      </Button>
    );
  }

  let buttonText = t('startPlan', { title });
  let isDisabled = false;
  let subscriptionType: SubscriptionType = type;

  if (status?.isActive) {
    if (status.subscription === 'yearly') {
      buttonText = t('currentlySubscribed');
      isDisabled = true;
    } else if (status.subscription === 'weekly') {
      if (type === 'weekly') {
        buttonText = t('currentlySubscribed');
        isDisabled = true;
      } else if (type === 'yearly') {
        buttonText = t('upgradeYearly');
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