// src/lib/admin/system-settingspage.ts

import {
  DEFAULT_CONTENT_LANGUAGE_POLICY,
  type ContentLanguagePolicy,
} from '@/lib/content-language';
import { DEFAULT_ANALYTICS_TIME_ZONE } from '@/lib/analytics-timezone';

// 시스템 설정 타입 정의
export interface SystemSettingValue<T = number | string | boolean> {
  enabled: boolean;
  value: T;
  description?: string;  // 설정 설명 (이벤트 코인 등에 사용)
}

// 업로더 레벨 정보
export interface UploaderLevel {
  level: number;
  minViews: number;
  shareRatio: number;
}

// 코인 패키지 정보
export interface CoinPackage {
  amount: number;      // 코인 수량
  price: number;       // 한국 가격
  globalPrice: number; // 글로벌 가격
}

// 구독 패키지 정보
export interface SubscriptionPackage {
  type: 'weekly' | 'yearly';
  price: number;       // 한국 가격
  globalPrice: number; // 글로벌 가격
}

// 전체 시스템 설정
export interface SystemSettings {
  // 가격 및 이벤트 설정
  subscriptionPackages: SystemSettingValue<SubscriptionPackage[]>;  // 구독 패키지 목록
  coinPackages: SystemSettingValue<CoinPackage[]>;                 // 코인 패키지 목록
  eventCoin1Amount: SystemSettingValue<number>;                    // 이벤트 코인1 지급량
  eventCoin2Amount: SystemSettingValue<number>;                    // 이벤트 코인2 지급량
  
  // 시스템 설정
  minWithdrawPoint: SystemSettingValue<number>;        // 최소 출금 포인트
  viewCoinAmount: SystemSettingValue<number>;          // 시청시 코인 소모 수량
  referralCoinAmount: SystemSettingValue<number>;      // 추천인 가입 코인 지급 수량
  serviceLogEnabled: SystemSettingValue<boolean>;      // 서비스 로그 작성 여부
  analyticsTimeZone: SystemSettingValue<string>;       // 분석/로그 기준 타임존
  contentLanguagePolicy: SystemSettingValue<ContentLanguagePolicy>; // 콘텐츠 언어 노출 정책
  
  // 업로더 레벨 설정
  uploaderQualification: SystemSettingValue<UploaderLevel[]>; // 업로더 자격 기준
  coinToPoint: SystemSettingValue<number>;                 // 코인의 포인트 변환비율
  noteamReffererPointRatio: SystemSettingValue<number>;                 // 코인의 포인트 변환비율
}

// 기본 구독 패키지
export const DEFAULT_SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  { type: 'weekly', price: 8500, globalPrice: 8.50 },
  { type: 'yearly', price: 190000, globalPrice: 190.00 }
];

// 기본 코인 패키지
export const DEFAULT_COIN_PACKAGES: CoinPackage[] = [
  { amount: 10, price: 1400, globalPrice: 1.40 },
  { amount: 70, price: 10000, globalPrice: 10.00 },
  { amount: 350, price: 45000, globalPrice: 45.00 },
  { amount: 700, price: 85000, globalPrice: 85.00 }
];

// 업로더 레벨 기본값
export const DEFAULT_UPLOADER_LEVELS: UploaderLevel[] = [
  { level: 1, minViews: 1, shareRatio: 10 },      // Star
  { level: 2, minViews: 100, shareRatio: 15 },    // Bronze
  { level: 3, minViews: 300, shareRatio: 20 },    // Silver
  { level: 4, minViews: 500, shareRatio: 25 },    // Gold
  { level: 5, minViews: 1000, shareRatio: 30 },   // Platinum
  { level: 6, minViews: 2000, shareRatio: 35 },   // Diamond
  { level: 7, minViews: 5000, shareRatio: 40 },   // Master
  { level: 8, minViews: 10000, shareRatio: 50 }   // Legend
];

// 섹션 정보
export interface SectionInfo {
  title: string;
  description: string;
  keys: Array<keyof SystemSettings>;
}

// 설정 섹션 정의
export const SECTIONS: Record<string, SectionInfo> = {
  PRICE_EVENT: {
    title: 'Pricing & Event Settings',
    description: 'Manage subscriptions, coin prices, and event coins',
    keys: [
      'subscriptionPackages',
      'coinPackages',
      'eventCoin1Amount',
      'eventCoin2Amount'
    ]
  },
  UPLOADER_CONFIG: {
    title: 'Uploader & Settlement Settings',
    description: 'Manage monthly views requirements and revenue share rates by level',
    keys: [
      'uploaderQualification',
      'coinToPoint',
      'noteamReffererPointRatio'
    ]
  },
  SYSTEM_CONFIG: {
    title: 'System Settings',
    description: 'Manage point withdrawals, coin consumption, and service logging',
    keys: [
      'viewCoinAmount',
      'referralCoinAmount',
      'minWithdrawPoint',
      'serviceLogEnabled',
      'analyticsTimeZone',
      'contentLanguagePolicy'
    ]
  }
} as const;

// 설정 키 상수
export const SETTING_KEYS = {
  subscriptionPackages: 'subscriptionPackages',
  coinPackages: 'coinPackages',
  eventCoin1Amount: 'eventCoin1Amount',
  eventCoin2Amount: 'eventCoin2Amount',
  minWithdrawPoint: 'minWithdrawPoint',
  viewCoinAmount: 'viewCoinAmount',
  referralCoinAmount: 'referralCoinAmount',
  uploaderQualification: 'uploaderQualification',
  coinToPoint: 'coinToPoint',
  noteamReffererPointRatio: 'noteamReffererPointRatio',
  serviceLogEnabled: 'serviceLogEnabled',
  analyticsTimeZone: 'analyticsTimeZone',
  contentLanguagePolicy: 'contentLanguagePolicy'
} as const;

// 설정 표시 이름
export const SETTING_LABELS = {
  subscriptionPackages: 'Subscription Packages',
  coinPackages: 'Coin Packages',
  eventCoin1Amount: 'Event Coin 1',
  eventCoin2Amount: 'Event Coin 2',
  minWithdrawPoint: 'Minimum Withdrawal Points',
  viewCoinAmount: 'Coin Consumption per View',
  referralCoinAmount: 'Referral Registration Coin Award',
  uploaderQualification: 'Uploader Qualification',
  coinToPoint: '1 Coin to Points Exchange Rate',
  noteamReffererPointRatio: 'Unaffiliated Referrer Point Ratio (%)',
  serviceLogEnabled: 'Service Logging',
  analyticsTimeZone: 'Analytics Time Zone',
  contentLanguagePolicy: 'Content Language Visibility Policy'
} as const;

// 기본 설정값
export const DEFAULT_SETTINGS: SystemSettings = {
  subscriptionPackages: { enabled: true, value: DEFAULT_SUBSCRIPTION_PACKAGES },
  coinPackages: { enabled: true, value: DEFAULT_COIN_PACKAGES },
  eventCoin1Amount: { 
    enabled: true, 
    value: 10,
    description: 'Event coins awarded upon new registration'
  },
  eventCoin2Amount: { 
    enabled: true, 
    value: 20,
    description: 'Event coins awarded upon completing referral conditions'
  },
  minWithdrawPoint: { enabled: true, value: 50000 },
  viewCoinAmount: { enabled: true, value: 2 },
  referralCoinAmount: { enabled: true, value: 2 },
  uploaderQualification: { enabled: true, value: DEFAULT_UPLOADER_LEVELS },
  coinToPoint: { enabled: true, value: 120 },
  noteamReffererPointRatio: { enabled: true, value: 1 },
  serviceLogEnabled: { enabled: true, value: true },
  analyticsTimeZone: {
    enabled: true,
    value: DEFAULT_ANALYTICS_TIME_ZONE,
    description: 'Single source-of-truth time zone for log display and reporting boundaries.',
  },
  contentLanguagePolicy: {
    enabled: true,
    value: DEFAULT_CONTENT_LANGUAGE_POLICY,
    description: 'Determines whether to filter the content list by selected language or show all content with locale-based fallbacks.'
  }
};
