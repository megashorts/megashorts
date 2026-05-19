'use client';

import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface CoinPurchaseButtonProps {
  selectedCoin: number | null;
  onPurchase: () => void;
}

export function CoinPurchaseButton({ selectedCoin, onPurchase }: CoinPurchaseButtonProps) {
  const { user } = useSession();
  const t = useTranslations('Subscription');

  if (!user?.id) {
    return (
      <Link href="/login" className="w-full">
        <Button 
          disabled={!selectedCoin}
          className="mt-4 w-full"
        >
          {selectedCoin ? t('buyAmountCoins', { amount: selectedCoin }) : t('selectQuantity')}
        </Button>
      </Link>
    );
  }

  return (
    <Button 
      onClick={onPurchase}
      disabled={!selectedCoin}
      className="mt-4 w-full"
    >
      {selectedCoin ? t('buyAmountCoins', { amount: selectedCoin }) : t('selectQuantity')}
    </Button>
  );
}