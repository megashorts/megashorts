'use client';

import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";

interface CoinPurchaseButtonProps {
  selectedCoin: number | null;
  onPurchase: () => void;
}

export function CoinPurchaseButton({ selectedCoin, onPurchase }: CoinPurchaseButtonProps) {
  const { user } = useSession();

  if (!user?.id) {
    return (
      <Link href="/login" className="w-full">
        <Button 
          disabled={!selectedCoin}
          className="mt-4 w-full"
        >
          {selectedCoin ? `${selectedCoin}코인 구매` : '수량을 선택해주세요'}
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
      {selectedCoin ? `${selectedCoin}코인 구매` : '수량을 선택해주세요'}
    </Button>
  );
}