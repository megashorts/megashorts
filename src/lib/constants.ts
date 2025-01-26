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
