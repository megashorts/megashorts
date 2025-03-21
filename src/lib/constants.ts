import { CategoryType } from "@prisma/client";

export const getEmailSender = () => {
  return process.env.SEND_EMAIL || 'noreply@example.com';
};

export const CLOUDFLARE_ACCOUNT_HASH = 'wuhPilUNWOdMaNWjMYkZJg';

export const getThumbnailUrl = (thumbnailId: string | null | undefined, variant: 'thumbnail' | 'public' = 'thumbnail') => {
  if (!thumbnailId) return '/post-placeholder.jpg';
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${thumbnailId}/${variant}`;
};

// import { env } from "@env";


// // This function should only be called on the server side
// export function getEmailSender() {
//   return process.env.NODE_ENV === "development"
//     ? "onboarding@resend.dev"
//     : '"Acme" <noreply@acme.com>';
// }

export const CATEGORIES: Record<CategoryType, Record<string, string>> = {
  COMEDY: {
    ko: "즐거운",
    en: "Comedy",
    // 다른 언어 추가 가능
  },
  ROMANCE: {
    ko: "로맨스",
    en: "Romance",
  },
  ACTION: {
    ko: "액션",
    en: "Action",
  },
  THRILLER: {
    ko: "스릴러",
    en: "Thriller",
  },
  DRAMA: {
    ko: "감동적인",
    en: "Drama",
  },
  PERIODPLAY: {
    ko: "시대극",
    en: "PeriodPlay",
  },
  FANTASY: {
    ko: "환타지",
    en: "Fantasy",
  },
  HIGHTEEN: {
    ko: "하이틴",
    en: "Highteen",
  },
  ADULT: {
    ko: "성인",
    en: "Romance",          
  },
  HUMANE: {
    ko: "인간적인",
    en: "Humane",
  },
  CALM: {
    ko: "잔잔한",
    en: "Calm",
  },
  VARIETYSHOW: {
    ko: "예능",
    en: "VarietyShow",
  },
  NOTIFICATION: {
    ko: "안내",
    en: "Notificaiton",
  },
  MSPOST: {
    ko: "블로그",
    en: "MSPost",
  },
} as const;

export const getCategoryName = (category: CategoryType, lang = 'ko') => {
  return CATEGORIES[category]?.[lang] || category;
};

// src/lib/constants.ts에 추가
export const USER_ROLE = {
  USER: 10,
  CREATOR_Lv1: 20,
  CREATOR_Lv2: 22,
  CREATOR_Lv3: 24,
  CREATOR_Lv4: 26,
  CREATOR_Lv5: 28,
  CREATOR_Lv6: 30,
  CREATOR_Lv7: 32,
  CREATOR_Lv8: 34,
  SUPPORTER: 38,
  TEAM_MEMBER: 40,
  TEAM_AGENCY: 45,
  TEAM_OPERATOR: 48,
  TEAM_MASTER: 50,
  NATIONAL_MASTER: 51,
  MARKETING1: 52,
  MARKETING2: 55,
  OPERATION1: 60,
  OPERATION2: 70,
  OPERATION3: 80,
  EXECUTIVE: 90,
  MASTER_ADMIN: 99,
} as const;

// 임시로 한국어 이름만 사용 (나중에 next-i18next로 교체 예정)
export const USER_ROLE_NAME = {
  [USER_ROLE.USER]: "MS멤버",
  [USER_ROLE.CREATOR_Lv1]: "크리에이터 Lv1",
  [USER_ROLE.CREATOR_Lv2]: "크리에이터 Lv2",
  [USER_ROLE.CREATOR_Lv3]: "크리에이터 Lv3",
  [USER_ROLE.CREATOR_Lv4]: "크리에이터 Lv4",
  [USER_ROLE.CREATOR_Lv5]: "크리에이터 Lv5",
  [USER_ROLE.CREATOR_Lv6]: "크리에이터 Lv6",
  [USER_ROLE.CREATOR_Lv7]: "크리에이터 Lv7",
  [USER_ROLE.CREATOR_Lv8]: "크리에이터 Lv8",
  [USER_ROLE.SUPPORTER]: "서포터",
  [USER_ROLE.TEAM_MEMBER]: "에이젼시 멤버",
  [USER_ROLE.TEAM_AGENCY]: "에이젼시 마스터",
  [USER_ROLE.TEAM_OPERATOR]: "본부 운영자",
  [USER_ROLE.TEAM_MASTER]: "본부 마스터",
  [USER_ROLE.NATIONAL_MASTER]: "국가 마스터",
  [USER_ROLE.MARKETING1]: "마케팅팀",
  [USER_ROLE.MARKETING2]: "마케팅 매니저",
  [USER_ROLE.OPERATION1]: "운영팀",
  [USER_ROLE.OPERATION2]: "운영팀 매니저",
  [USER_ROLE.OPERATION3]: "운영팀 마스터",
  [USER_ROLE.EXECUTIVE]: "임원진",
  [USER_ROLE.MASTER_ADMIN]: "최고 관리자",
} as const;