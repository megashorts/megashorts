// import { Prisma, Post, Video, Subtitle, CategoryType, Language, AccessMethod } from '@prisma/client';

// // 1. 권한 관리
// export const USER_ROLES = {
//   USER: 0,
//   CREATOR: 100,
//   SALES: 200,
//   MARKETING: 300,
//   ADMIN: 900,
//   SUPER_ADMIN: 999,
// } as const;

// export type UserRoleNumber = typeof USER_ROLES[keyof typeof USER_ROLES];
// export type SubscriptionType = "weekly" | "yearly" | "upgrade" | null;

// // 2. 사용자 관련
// export interface AuthUser {
//   id: string;
//   username: string;
//   displayName: string;
//   email: string | null;
//   avatarUrl: string | null;
//   userRole: number;
//   subscription: SubscriptionType;
//   subscriptionEndDate: Date | null;
//   mscoin: number;
//   adultauth: boolean;
// }

// export function getUserDataSelect(loggedInUserId: string) {
//   return {
//     id: true,
//     username: true,
//     email: true,
//     displayName: true,
//     avatarUrl: true,
//     userRole: true,
//     subscription: true,
//     subscriptionEndDate: true,
//     mscoin: true,
//     adultauth: true,
//     _count: {
//       select: {
//         posts: true,
//         followers: true,
//       },
//     },
//   } satisfies Prisma.UserSelect;
// }

// export type UserData = Prisma.UserGetPayload<{
//   select: ReturnType<typeof getUserDataSelect>;
// }>;

// // 3. 포스트 관련
// export function getPostDataSelect(loggedInUserId: string) {
//   return {
//     id: true,
//     title: true,
//     titleOriginal: true,
//     content: true,
//     thumbnailUrl: true,
//     status: true,
//     featured: true,
//     priority: true,
//     ageLimit: true,
//     categories: true,
//     createdAt: true,
//     publishedAt: true,
//     postLanguage: true,
//     videoCount: true,
//     userId: true,
//     titleI18n: true,
//     contentI18n: true,
//     user: {
//       select: getUserDataSelect(loggedInUserId),
//     },
//     videos: {
//       select: {
//         id: true,
//         url: true,
//         filename: true,
//         sequence: true,
//         isPremium: true,
//         language: true,
//         views: {
//           where: {
//             userId: loggedInUserId,
//           },
//           select: {
//             lastTimestamp: true,
//             accessMethod: true,
//           },
//         },
//         Subtitle: {
//           select: {
//             id: true,
//             language: true,
//             url: true,
//           },
//         },
//       },
//       orderBy: {
//         sequence: 'asc'
//       }
//     },
//     likes: {
//       where: { userId: loggedInUserId },
//       select: { userId: true },
//     },
//     bookmarks: {
//       where: { userId: loggedInUserId },
//       select: { userId: true },
//     },
//     _count: {
//       select: {
//         likes: true,
//         comments: true,
//       },
//     },
//   } satisfies Prisma.PostSelect;
// }

// export type PostData = Prisma.PostGetPayload<{
//   select: ReturnType<typeof getPostDataSelect>;
// }>;

// // 4. 비디오 관련
// export interface VideoPlayInfo {
//   id: string;
//   url: string;
//   filename: string;
//   sequence: number;
//   isPremium: boolean;
//   language: Language;
//   ageLimit?: number;
//   lastTimestamp?: number;
//   accessMethod?: AccessMethod;
//   Subtitle: {
//     id: string;
//     language: Language;
//     url: string;
//   }[];
// }

// // 5. 알림 관련
// export type NotificationMetadata = {
//   amount?: number;
//   reason?: string;
//   postId?: string;
//   commentId?: string;
// };

// export const notificationsInclude = {
//   issuer: {
//     select: {
//       username: true,
//       displayName: true,
//       avatarUrl: true,
//     },
//   },
// } satisfies Prisma.NotificationInclude;

// export type NotificationData = Prisma.NotificationGetPayload<{
//   include: typeof notificationsInclude;
// }> & {
//   metadata: NotificationMetadata | null;
// };

// // 6. 페이지네이션
// export interface PageInfo {
//   nextCursor: string | null;
//   hasMore: boolean;
// }

// export interface PostsPage {
//   posts: PostData[];
//   pageInfo: PageInfo;
// }

// // 7. 상태 관련
// export interface FollowerInfo {
//   followers: number;
//   isFollowedByUser: boolean;
// }

// export interface LikeInfo {
//   likes: number;
//   isLikedByUser: boolean;
// }

// export interface BookmarkInfo {
//   isBookmarkedByUser: boolean;
// }

// export interface NotificationCountInfo {
//   unreadCount: number;
// }

// export function getCommentDataInclude(loggedInUserId: string) {
//   return {
//     user: {
//       select: getUserDataSelect(loggedInUserId),
//     },
//   } satisfies Prisma.CommentInclude;
// }

// export type CommentData = Prisma.CommentGetPayload<{
//   include: ReturnType<typeof getCommentDataInclude>;
// }>;

// export interface CommentsPage {
//   comments: CommentData[];
//   previousCursor: string | null;
// }


// import { Prisma, CategoryType, Language, PostStatus } from "@prisma/client";
// import { Post, Video } from '@prisma/client';
import { Prisma, Post, Video, CategoryType, VideoView, Language } from '@prisma/client';

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MARKETING" | "SALES" | "CREATOR" | "USER";
export type SubscriptionType = "weekly" | "yearly" | null;

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  googleId: string | null;
  role: UserRole;
  email: string | null;
  subscriptionEndDate: string | null;
  subscription: SubscriptionType;
}

export function getUserDataSelect(loggedInUserId: string) {
  return {
    id: true,
    username: true,
    email: true,
    googleId: true,
    naverId: true,
    kakaoId: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    createdAt: true,
    adultauth: true,
    subscription: true,
    subscriptionEndDate: true,
    mscoin: true,
    points: true,
    userRole: true,
    myLanguage: true,
    followers: {
      where: {
        followerId: loggedInUserId,
      },
      select: {
        followerId: true,
      },
    },
    _count: {
      select: {
        posts: true,
        followers: true,
      },
    },
  } satisfies Prisma.UserSelect;
}

export type UserData = Prisma.UserGetPayload<{
  select: ReturnType<typeof getUserDataSelect>;
}>;

export function getPostDataInclude(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
    videos: {
      include: {
        views: true,
      },
      orderBy: {
        sequence: 'asc'
      }
    },
    likes: {
      where: {
        userId: loggedInUserId,
      },
      select: {
        userId: true,
      },
    },
    bookmarks: {
      where: {
        userId: loggedInUserId,
      },
      select: {
        userId: true,
      },
    },
    _count: {
      select: {
        likes: true,
        comments: true,
      },
    },
  } satisfies Prisma.PostInclude;
}

export type PostData = Prisma.PostGetPayload<{
  include: ReturnType<typeof getPostDataInclude>;
}>;

export interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}

export function getCommentDataInclude(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
  } satisfies Prisma.CommentInclude;
}

export type CommentData = Prisma.CommentGetPayload<{
  include: ReturnType<typeof getCommentDataInclude>;
}>;

export interface CommentsPage {
  comments: CommentData[];
  previousCursor: string | null;
}

// 알림 메타데이터 타입 정의
export interface NotificationMetadata {
  amount?: number;
  reason?: string;
}

export const notificationsInclude = {
  issuer: {
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  post: {
    select: {
      title: true,
      content: true,
    },
  },
} satisfies Prisma.NotificationInclude;

// export type NotificationData = Prisma.NotificationGetPayload<{
//   include: typeof notificationsInclude;
// }>;

export type NotificationData = Prisma.NotificationGetPayload<{
  include: typeof notificationsInclude;
}> & {
  metadata: NotificationMetadata | null;
};

export interface NotificationsPage {
  notifications: NotificationData[];
  nextCursor: string | null;
}

export interface FollowerInfo {
  followers: number;
  isFollowedByUser: boolean;
}

export interface LikeInfo {
  likes: number;
  isLikedByUser: boolean;
}

export interface BookmarkInfo {
  isBookmarkedByUser: boolean;
}

export interface NotificationCountInfo {
  unreadCount: number;
}

export interface PostWithVideos extends Post {
  videos: (Video & {
    views: VideoView[];
    subtitle: Language[];
  })[];
  categories: CategoryType[];
}

// PostWithVideos의 videos 배열의 요소 타입을 별도로 export
export type VideoWithSubtitles = Video & {
  views: VideoView[];
  subtitle: Language[];
};

// // Video 타입에 subtitles 포함하도록 확장
// export type VideoWithSubtitles = PrismaVideo & {
//   subtitles: Subtitle[];
// };

// IndexedDB 저장용 타입
interface VideoViewStore {
  // 시청한 유료 동영상 ID 저장
  watchedVideos: {
    videoId: string;
    timestamp: number;
    accessMethod: 'SUBSCRIPTION' | 'POINT_PAYMENT';
  }[];
  
  // 포스트별 마지막 시청 정보
  lastViews: {
    postId: string;
    sequence: number;
    timestamp: number;
    updatedAt: string;
  }[];
}

// 권한 체크 결과 타입
interface VideoPermissionResult {
  allowed: boolean;
  reason?: 'AGE_RESTRICTION' | 'LOGIN_REQUIRED' | 'SUBSCRIPTION_REQUIRED' | 'COIN_REQUIRED';
  message?: string;
  redirectUrl?: string;
}

// 시청 기록 저장용 타입
interface VideoViewData {
  videoId: string;
  postId: string;
  sequence: number;
  timestamp: number;
  duration: number;
  accessMethod: 'FREE' | 'SUBSCRIPTION' | 'POINT_PAYMENT';
}