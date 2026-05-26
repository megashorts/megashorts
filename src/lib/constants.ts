

export const getEmailSender = () => {
  return process.env.SEND_EMAIL || 'noreply@example.com';
};

export const CLOUDFLARE_ACCOUNT_HASH = 'wuhPilUNWOdMaNWjMYkZJg';

const DEFAULT_STREAM_DELIVERY_BASE_URL = "https://videodelivery.net";
const rawStreamDeliveryBaseUrl = process.env.NEXT_PUBLIC_STREAM_DELIVERY_BASE_URL?.trim();

function normalizeStreamDeliveryBaseUrl(raw?: string | null) {
  if (!raw || raw.length === 0) return DEFAULT_STREAM_DELIVERY_BASE_URL;

  try {
    const parsed = new URL(raw);
    // customer-*.cloudflarestream.com 응답은 origin별 CORS 제한이 있어
    // 도메인이 바뀌는 배포 환경에서 재생 실패가 자주 발생함.
    // videodelivery.net 기반 URL은 동일 영상 ID로 안정적으로 동작.
    if (parsed.hostname.endsWith(".cloudflarestream.com")) {
      return DEFAULT_STREAM_DELIVERY_BASE_URL;
    }
    return parsed.origin.replace(/\/+$/, "");
  } catch {
    return DEFAULT_STREAM_DELIVERY_BASE_URL;
  }
}

export const STREAM_DELIVERY_BASE_URL =
  normalizeStreamDeliveryBaseUrl(rawStreamDeliveryBaseUrl);

function extractStreamId(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  if (!trimmed.includes("/")) {
    return trimmed;
  }

  const regexMatch = trimmed.match(
    /(?:videodelivery\.net|cloudflarestream\.com)\/([^/?#]+)/i,
  );
  if (regexMatch?.[1]) {
    return regexMatch[1];
  }

  try {
    const parsed = new URL(trimmed);
    const firstSegment = parsed.pathname.split("/").filter(Boolean)[0];
    return firstSegment || trimmed;
  } catch {
    return trimmed;
  }
}

export const getStreamManifestUrl = (videoId: string) =>
  `${STREAM_DELIVERY_BASE_URL}/${extractStreamId(videoId)}/manifest/video.m3u8`;

export const getStreamThumbnailUrl = (videoId: string, height = 600) =>
  `${STREAM_DELIVERY_BASE_URL}/${extractStreamId(videoId)}/thumbnails/thumbnail.jpg?time=&height=${height}`;

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

export const USER_ROLE_NAME_EN = {
  [USER_ROLE.USER]: "MS Member",
  [USER_ROLE.CREATOR_Lv1]: "Creator Lv1",
  [USER_ROLE.CREATOR_Lv2]: "Creator Lv2",
  [USER_ROLE.CREATOR_Lv3]: "Creator Lv3",
  [USER_ROLE.CREATOR_Lv4]: "Creator Lv4",
  [USER_ROLE.CREATOR_Lv5]: "Creator Lv5",
  [USER_ROLE.CREATOR_Lv6]: "Creator Lv6",
  [USER_ROLE.CREATOR_Lv7]: "Creator Lv7",
  [USER_ROLE.CREATOR_Lv8]: "Creator Lv8",
  [USER_ROLE.SUPPORTER]: "Supporter",
  [USER_ROLE.TEAM_MEMBER]: "Agency Member",
  [USER_ROLE.TEAM_AGENCY]: "Agency Master",
  [USER_ROLE.TEAM_OPERATOR]: "HQ Operator",
  [USER_ROLE.TEAM_MASTER]: "HQ Master",
  [USER_ROLE.NATIONAL_MASTER]: "National Master",
  [USER_ROLE.MARKETING1]: "Marketing Team",
  [USER_ROLE.MARKETING2]: "Marketing Manager",
  [USER_ROLE.OPERATION1]: "Operations Team",
  [USER_ROLE.OPERATION2]: "Operations Manager",
  [USER_ROLE.OPERATION3]: "Operations Master",
  [USER_ROLE.EXECUTIVE]: "Executive",
  [USER_ROLE.MASTER_ADMIN]: "Super Admin",
} as const;
