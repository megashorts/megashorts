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
  
  // 업로더 레벨 설정
  uploaderQualification: SystemSettingValue<UploaderLevel[]>; // 업로더 자격 기준
  masterFeeRatio: SystemSettingValue<number>;                 // 팀마스터 수수료 비율
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
    title: '가격 및 이벤트 설정',
    description: '구독, 코인 가격 및 이벤트 코인 관리',
    keys: [
      'subscriptionPackages',
      'coinPackages',
      'eventCoin1Amount',
      'eventCoin2Amount'
    ]
  },
  UPLOADER_CONFIG: {
    title: '업로더 레벨 설정',
    description: '레벨별 조회수 기준 및 수익 분배율 관리',
    keys: [
      'uploaderQualification',
      'masterFeeRatio'
    ]
  },
  SYSTEM_CONFIG: {
    title: '시스템 설정',
    description: '포인트, 코인 소모량 및 로그 설정',
    keys: [
      'viewCoinAmount',
      'referralCoinAmount',
      'minWithdrawPoint',
      'serviceLogEnabled'
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
  masterFeeRatio: 'masterFeeRatio',
  serviceLogEnabled: 'serviceLogEnabled'
} as const;

// 설정 표시 이름
export const SETTING_LABELS = {
  subscriptionPackages: '구독 패키지',
  coinPackages: '코인 패키지',
  eventCoin1Amount: '이벤트 코인 1',
  eventCoin2Amount: '이벤트 코인 2',
  minWithdrawPoint: '최소 출금 포인트',
  viewCoinAmount: '시청 코인 소모량',
  referralCoinAmount: '추천인 코인 지급량',
  uploaderQualification: '업로더 자격',
  masterFeeRatio: '팀마스터 수수료 (%)',
  serviceLogEnabled: '서비스 로그'
} as const;

// 기본 설정값
export const DEFAULT_SETTINGS: SystemSettings = {
  subscriptionPackages: { enabled: true, value: DEFAULT_SUBSCRIPTION_PACKAGES },
  coinPackages: { enabled: true, value: DEFAULT_COIN_PACKAGES },
  eventCoin1Amount: { 
    enabled: true, 
    value: 10,
    description: '신규 가입 시 지급되는 이벤트 코인'
  },
  eventCoin2Amount: { 
    enabled: true, 
    value: 20,
    description: '추천인 이벤트 달성 시 지급되는 코인'
  },
  minWithdrawPoint: { enabled: true, value: 50000 },
  viewCoinAmount: { enabled: true, value: 2 },
  referralCoinAmount: { enabled: true, value: 2 },
  uploaderQualification: { enabled: true, value: DEFAULT_UPLOADER_LEVELS },
  masterFeeRatio: { enabled: true, value: 5.00 },
  serviceLogEnabled: { enabled: true, value: true }
};
