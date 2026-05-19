"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Image from "next/image";
import PaymentModal from "@/app/[locale]/(main)/usermenu/payments/PaymentModal";
import BillingModal from "@/app/[locale]/(main)/usermenu/payments/BillingModal";
import { SubscriptionButton } from "./SubscriptionButton";
import { CoinPurchaseButton } from "./CoinPurchaseButton";
import { useTranslations } from "next-intl";

// 구독 정보 타입
type SubscriptionPlanType = 'weekly' | 'yearly';
type BillingType = SubscriptionPlanType | 'upgrade';

interface SubscriptionPlan {
  type: SubscriptionPlanType;
  title: string;
  price: number;
  originalPrice: number;
  period: string;
  description: string;
}

const SubscriptionPage = () => {
  const t = useTranslations('Subscription');

  const subscriptionPlans: Record<'weekly' | 'yearly', SubscriptionPlan> = {
    weekly: {
      type: 'weekly',
      title: t('weeklyPayment'),
      price: 8500,
      originalPrice: 13000,
      period: t('weeklyPeriod'),
      description: t('weeklyDesc')
    },
    yearly: {
      type: 'yearly',
      title: t('yearlyPayment'),
      price: 190000,
      originalPrice: 260000,
      period: t('yearlyPeriod'),
      description: t('yearlyDesc')
    }
  }

  // const [isWeekly, setIsweekly] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)
  // const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>('weekly');
  const [billingType, setBillingType] = useState<BillingType>('weekly');

  interface CoinOption {
    value: number;
    price: number;
  }

  const coinOptions: CoinOption[] = [    
    { value: 10, price: 1_400 },
    { value: 70, price: 10_000 },
    { value: 350, price: 45000 },
    { value: 700, price: 85000 }
  ];

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
              // onValueChange={(value) => setIsweekly(value === "weekly")}
              onValueChange={(value) => setSelectedPlan(value as 'weekly' | 'yearly')}
            >
              <TabsList>
                <TabsTrigger value="weekly">{t('weeklyPayment')}</TabsTrigger>
                <TabsTrigger value="yearly">{t('yearlyPayment')}</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly">
                {/* {isWeekly && (
                  <> */}
                    <p className="text-sm text-neutral-300 mt-5">🚩 {subscriptionPlans.weekly.description}</p>
                    <p className="text-sm text-neutral-300 mt-5">🚩 {subscriptionPlans.weekly.period} {t('autoPayment')}</p>
                    <h3 className=" text-neutral-300 font-bold mt-5">
                      <span className="text-2xl font-normal text-white">{subscriptionPlans.weekly.price.toLocaleString()}{t('currency')} </span>
                      <span className="text-sm line-through text-gray-500">{subscriptionPlans.weekly.originalPrice.toLocaleString()}{t('currency')}</span>
                      <span className="text-sm"> / {subscriptionPlans.weekly.period}</span>
                    </h3>
                  {/* </> */}
                {/* )} */}
              </TabsContent>
              <TabsContent value="yearly">
                {/* {!isWeekly && (
                  <> */}
                    <p className="text-sm text-neutral-300 mt-5">🚩 {subscriptionPlans.yearly.description}</p>
                    <p className="text-sm text-neutral-300 mt-5">🚩 {subscriptionPlans.yearly.period} {t('autoPayment')}</p>
                    <h3 className=" text-neutral-300 font-bold mt-5">
                      {/* <span className="text-2xl font-normal text-white">{subscriptionPlans.yearly.price.toLocaleString()}{t('currency')} </span>
                      <span className="text-sm line-through text-gray-500">{subscriptionPlans.yearly.originalPrice.toLocaleString()}{t('currency')}</span> */}
                      <span className="text-2xl font-normal text-white">190,000{t('currency')} </span>
                      <span className="text-sm line-through text-gray-500">260,000{t('currency')}</span>
                      <span className="text-sm"> / {subscriptionPlans.yearly.period}</span>
                    </h3>
                  {/* </>
                )} */}
              </TabsContent>
            </Tabs>
          </div>
          <div className="mt-auto flex flex-col">
            <SubscriptionButton
              type={selectedPlan}
              title={subscriptionPlans[selectedPlan].title}
              onSubscribe={(type) => {
                setBillingType(type);  // 실제 결제에 사용할 타입
                setShowBillingModal(true);
              }}
            />

            {showBillingModal && (
              <BillingModal
                type={billingType}  // upgrade 타입이 포함된 billingType 사용
                amount={subscriptionPlans[selectedPlan].price}
                onClose={() => setShowBillingModal(false)}
              />
            )}

            {/* <SubscriptionButton
              type={selectedPlan}
              title={subscriptionPlans[selectedPlan].title}
              onSubscribe={() => setShowBillingModal(true)}
            />
            {showBillingModal && (
              <BillingModal
                type={selectedPlan}
                amount={subscriptionPlans[selectedPlan].price}
                onClose={() => setShowBillingModal(false)}
              />
            )} */}

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
                      <span>{option.price.toLocaleString()}{t('currency')}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="text-sm text-neutral-700 dark:text-neutral-500 mt-3">🚩 {t('premiumCoinCost')}</div>
            </div>
          </div>
          <div className="mt-auto flex flex-col">

            {/* <Button>
              <Link href={"/usermenu/payments"}>
                결제
              </Link>
            </Button> */}

            {/* <Button 
              onClick={() => {
                if (!selectedCoin) return
                setShowModal(true)  // 모달 열기
              }}
            >
              {selectedCoin ? `${selectedCoin}코인 구매` : '수량을 선택해주세요'}
            </Button> */}

            {/* <Button 
              onClick={() => setShowModal(true)}
              disabled={!selectedCoin}
              className="mt-4 w-full"
            >
              {selectedCoin ? `${selectedCoin}코인 구매` : '수량을 선택해주세요'}
            </Button> */}

            <CoinPurchaseButton
              selectedCoin={selectedCoin}
              onPurchase={() => setShowModal(true)}
            />

            <p className="mt-3 text-xs dark:text-neutral-400 text-center">
              {t('eventEndWarning')}
            </p>
          </div>
        </div>
      </div>
      {showModal && selectedCoin && (
        <PaymentModal
          paymentAmount={coinOptions.find(opt => opt.value === selectedCoin)?.price || 0}
          coins={selectedCoin}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default SubscriptionPage;
