"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Image from "next/image";
import { SubscriptionButton } from "./SubscriptionButton";
import { CoinPurchaseButton } from "./CoinPurchaseButton";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import {
  DEFAULT_COIN_PACKAGES,
  DEFAULT_SUBSCRIPTION_PACKAGES,
  type CoinPackage,
  type SubscriptionPackage,
} from "@/lib/admin/system-settingspage";

// 구독 정보 타입
type SubscriptionPlanType = 'weekly' | 'yearly';

interface SubscriptionPlan {
  type: SubscriptionPlanType;
  title: string;
  price: number;
  originalPrice: number;
  period: string;
  description: string;
}

const toFiniteNumber = (value: unknown, fallback: number) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getGlobalPrice = (
  pkg: Pick<SubscriptionPackage | CoinPackage, 'price' | 'globalPrice'>,
  fallback: Pick<SubscriptionPackage | CoinPackage, 'price' | 'globalPrice'>,
) => {
  const fallbackGlobal = toFiniteNumber(fallback.globalPrice, toFiniteNumber(fallback.price, 0));
  const directGlobal = toFiniteNumber(pkg.globalPrice, Number.NaN);
  if (Number.isFinite(directGlobal)) return directGlobal;

  const legacyPrice = toFiniteNumber(pkg.price, Number.NaN);
  return Number.isFinite(legacyPrice) ? Number((legacyPrice / 1000).toFixed(2)) : fallbackGlobal;
};

const getOriginalPrice = (price: number) => Number((price * 1.2).toFixed(2));

const SubscriptionPage = () => {
  const t = useTranslations('Subscription');
  const { toast } = useToast();
  const [pricing, setPricing] = useState<{
    subscriptionPackages: SubscriptionPackage[];
    coinPackages: CoinPackage[];
  }>({
    subscriptionPackages: DEFAULT_SUBSCRIPTION_PACKAGES,
    coinPackages: DEFAULT_COIN_PACKAGES,
  });

  useEffect(() => {
    let ignore = false;

    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((settings) => {
        if (ignore) return;
        const subscriptionPackages = settings?.subscriptionPackages?.value;
        const coinPackages = settings?.coinPackages?.value;

        setPricing({
          subscriptionPackages: Array.isArray(subscriptionPackages) && subscriptionPackages.length > 0
            ? subscriptionPackages
            : DEFAULT_SUBSCRIPTION_PACKAGES,
          coinPackages: Array.isArray(coinPackages) && coinPackages.length > 0
            ? coinPackages
            : DEFAULT_COIN_PACKAGES,
        });
      })
      .catch(() => {
        if (!ignore) {
          setPricing({
            subscriptionPackages: DEFAULT_SUBSCRIPTION_PACKAGES,
            coinPackages: DEFAULT_COIN_PACKAGES,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const weeklyPackage = pricing.subscriptionPackages.find((pkg) => pkg.type === 'weekly') || DEFAULT_SUBSCRIPTION_PACKAGES[0];
  const yearlyPackage = pricing.subscriptionPackages.find((pkg) => pkg.type === 'yearly') || DEFAULT_SUBSCRIPTION_PACKAGES[1];

  const subscriptionPlans: Record<'weekly' | 'yearly', SubscriptionPlan> = {
    weekly: {
      type: 'weekly',
      title: t('weeklyPayment'),
      price: getGlobalPrice(weeklyPackage, DEFAULT_SUBSCRIPTION_PACKAGES[0]),
      originalPrice: getOriginalPrice(getGlobalPrice(weeklyPackage, DEFAULT_SUBSCRIPTION_PACKAGES[0])),
      period: t('weeklyPeriod'),
      description: t('weeklyDesc')
    },
    yearly: {
      type: 'yearly',
      title: t('yearlyPayment'),
      price: getGlobalPrice(yearlyPackage, DEFAULT_SUBSCRIPTION_PACKAGES[1]),
      originalPrice: getOriginalPrice(getGlobalPrice(yearlyPackage, DEFAULT_SUBSCRIPTION_PACKAGES[1])),
      period: t('yearlyPeriod'),
      description: t('yearlyDesc')
    }
  }

  const [selectedCoin, setSelectedCoin] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>('weekly');

  interface CoinOption {
    value: number;
    price: number;
  }

  const coinOptions: CoinOption[] = pricing.coinPackages.map((option) => ({
    value: toFiniteNumber(option.amount, 0),
    price: getGlobalPrice(option, DEFAULT_COIN_PACKAGES[0]),
  }));

  const formatUsd = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

  const showPaymentPlaceholder = () => {
    toast({
      title: t('paymentPendingTitle'),
      description: t('paymentPendingDescription'),
    });
  };

  return (
    <div className="overflow-hidden text-sm text-neutral-700 md:text-base pb-24">
      <div className="grid gap-3 lg:grid-cols-3 xl:gap-3">
        {/* 첫 번째 카드 */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border-2 px-6 py-8">
          <div className="mb-8 relative">
            <h3 className="mb-2 block text-sm font-medium uppercase tracking-widest text-neutral-700 dark:text-neutral-500">{t('openEventBadge')}</h3>
            <div className="absolute bottom-0 left-0 h-[10px] bg-amber-400 mb-0 -z-10 w-7/12"></div>
            <h2 className="flex items-center text-2xl leading-none text-neutral-900 dark:text-white">
              <span>{t('openEvent')}</span>
              <span className="ms-1 text-2xl font-normal text-white">{t('openEventSub')}</span>
            </h2>
          </div>
          <div className="mb-8 relative items-center border w-full"></div>
          <div className="flex-1 flex flex-col justify-start">
            <nav className="mb-8 space-y-4 md:py-4">
              <ul>
                <li className="flex items-center">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">🚩 {t('eventDiscount')}</span>
                </li>
                <li className="flex items-center mt-4">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">🚩 {t('eventCoinBonus')}</span>
                </li>
                <li className="flex items-center mt-4">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">🚩 {t('eventAutoSupport')}</span>
                </li>
              </ul>
            </nav>
            <div className="relative w-full h-6 mb-8 mt-1 sm:mt-6">
              <Image
                src="/MS Logo emblem.svg"
                alt="Event Image"
                width={120} 
                height={48} 
                className="relative object-cover items-center justify-center"
              />
            </div>
          </div>
        </div>

        {/* 두 번째 카드 */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border-2 px-6 py-8 border-primary-500 border-red-700/50">
          <div className="mb-8 relative">
            <h3 className="mb-2 block text-sm font-medium uppercase tracking-widest text-neutral-700 dark:text-red-600">{t('megashortsRecommend')}</h3>
            <div className="absolute bottom-0 left-0 h-[10px] bg-red-500 mb-0 -z-10 w-8/12"></div>
            <h2 className="flex items-center text-2xl leading-none text-neutral-900 dark:text-white ml-1">
              <span>{t('unlimited')}</span>
              <span className="ms-1 text-2xl font-normal text-white">{t('pass')}</span>
            </h2>
          </div>
          <div className="mb-8 relative items-center border w-full"></div>
          <div className="flex-1 flex flex-col justify-start ">
            <Tabs 
              defaultValue="weekly" 
              onValueChange={(value) => setSelectedPlan(value as 'weekly' | 'yearly')}
            >
              <TabsList>
                <TabsTrigger value="weekly">{t('weeklyPayment')}</TabsTrigger>
                <TabsTrigger value="yearly">{t('yearlyPayment')}</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly">
                    <p className="text-sm text-neutral-300 mt-5">🚩 {subscriptionPlans.weekly.description}</p>
                    <p className="text-sm text-neutral-300 mt-5">🚩 {subscriptionPlans.weekly.period} {t('autoPayment')}</p>
                    <h3 className=" text-neutral-300 font-bold mt-5">
                      <span className="text-2xl font-normal text-white">{formatUsd(subscriptionPlans.weekly.price)} </span>
                      <span className="text-sm line-through text-gray-500">{formatUsd(subscriptionPlans.weekly.originalPrice)}</span>
                      <span className="text-sm"> / {subscriptionPlans.weekly.period}</span>
                    </h3>
              </TabsContent>
              <TabsContent value="yearly">
                    <p className="text-sm text-neutral-300 mt-5">🚩 {subscriptionPlans.yearly.description}</p>
                    <p className="text-sm text-neutral-300 mt-5">🚩 {subscriptionPlans.yearly.period} {t('autoPayment')}</p>
                    <h3 className=" text-neutral-300 font-bold mt-5">
                      <span className="text-2xl font-normal text-white">{formatUsd(subscriptionPlans.yearly.price)} </span>
                      <span className="text-sm line-through text-gray-500">{formatUsd(subscriptionPlans.yearly.originalPrice)}</span>
                      <span className="text-sm"> / {subscriptionPlans.yearly.period}</span>
                    </h3>
              </TabsContent>
            </Tabs>
          </div>
          <div className="mt-auto flex flex-col">
            <SubscriptionButton
              type={selectedPlan}
              title={subscriptionPlans[selectedPlan].title}
              onSubscribe={showPaymentPlaceholder}
            />

            <p className="mt-3 text-xs dark:text-white text-center">{t('highlyRecommended')}</p>
          </div>
        </div>

        {/* 세 번째 카드 */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border-2 px-6 py-8 border-neutral-100 dark:border-neutral-700">
          <div className="mb-8 relative">
            <h3 className="mb-2 block text-sm font-medium uppercase tracking-widest text-neutral-700 dark:text-red-600">{t('tasteSniper')}</h3>
            <div className="absolute bottom-0 left-0 h-[10px] bg-red-500 mb-0 -z-10 w-6/12"></div>
            <h2 className="flex items-center text-2xl leading-none text-neutral-900 dark:text-white ml-1">
              <span>{t('coins')}</span>
              <span className="ms-1 text-2xl font-normal text-white">{t('buyCoinsTitle')}</span>
            </h2>
          </div>
          <div className="mb-8 relative items-center border w-full"></div>
          <div className="flex-1 flex flex-col justify-start">
            <div className="mb-8 space-y-4">
              <div className="flex flex-col space-y-5">
                {coinOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="coinOption"
                      value={option.value}
                      checked={selectedCoin === option.value}
                      onChange={(e) => setSelectedCoin(Number(e.target.value))}
                      className="form-radio h-4 w-4 text-sm text-white"
                    />
                      <span className="flex-1 flex justify-between text-sm text-neutral-300">
                        <span>{option.value}{t('coins')}</span>
                      <span>{formatUsd(option.price)}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="text-sm text-neutral-700 dark:text-neutral-500 mt-3">🚩 {t('premiumCoinCost')}</div>
            </div>
          </div>
          <div className="mt-auto flex flex-col">
            <CoinPurchaseButton
              selectedCoin={selectedCoin}
              onPurchase={showPaymentPlaceholder}
            />

            <p className="mt-3 text-xs dark:text-neutral-400 text-center">
              {t('eventEndWarning')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
