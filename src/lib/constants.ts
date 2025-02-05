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
  COMIC: {
    ko: "만화",
    en: "Comic",
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
    en: "Action",
  },
  DRAMA: {
    ko: "드라마",
    en: "Comic",
  },
  PERIOD: {
    ko: "시대극",
    en: "Romance",
  },
  FANTASY: {
    ko: "환타지",
    en: "Action",
  },
  HIGHTEEN: {
    ko: "하이틴",
    en: "Action",
  },
  ADULT: {
    ko: "성인",
    en: "Romance",
  },
  NOTIFICATION: {
    ko: "안내",
    en: "Action",
  },
  MSPOST: {
    ko: "블로그",
    en: "Action",
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
  SUPPORTERS: 38,
  TEAM_MEMBER: 40,
  TEAM_AGENCY: 45,
  TEAM_MASTER: 50,
  MARKETING2: 52,
  MARKETING1: 55,
  OPERATION3: 60,
  OPERATION2: 70,
  OPERATION1: 80,
  ADMIN: 90,
  SUPER_ADMIN: 99,
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
  [USER_ROLE.SUPPORTERS]: "서포터즈",
  [USER_ROLE.TEAM_MEMBER]: "팀원",
  [USER_ROLE.TEAM_AGENCY]: "에이젼시",
  [USER_ROLE.TEAM_MASTER]: "본부",
  [USER_ROLE.MARKETING2]: "마케팅팀",
  [USER_ROLE.MARKETING1]: "마케팅 매니저",
  [USER_ROLE.OPERATION3]: "운영팀 CS",
  [USER_ROLE.OPERATION2]: "운영팀 매니저",
  [USER_ROLE.OPERATION1]: "운영팀 리더",
  [USER_ROLE.ADMIN]: "관리자",
  [USER_ROLE.SUPER_ADMIN]: "최고 관리자",
} as const;