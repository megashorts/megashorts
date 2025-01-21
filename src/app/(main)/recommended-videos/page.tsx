import prisma from "@/lib/prisma";
import { CategoryType } from '@prisma/client';
import { RecommendedVideosClient } from "./RecommendedVideosClient";
import { Metadata } from "next";

// 5분마다 재렌더링
export const revalidate = 3600;

export const metadata: Metadata = {
  title: '추천 동영상',
  description: '메가쇼츠의 엄선된 추천 동영상을 만나보세요.',
  openGraph: {
    title: '메가쇼츠 추천 동영상',
    description: '메가쇼츠의 엄선된 추천 동영상을 만나보세요.',
    type: 'video.other',
  },
  alternates: {
    canonical: 'https://megashorts.vercel.app/recommended-videos',
  },
};

export default async function RecommendedVideosPage() {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      NOT: {
        categories: {
          hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
        }
      },
      videos: {
        some: {
          sequence: 1,
          isPremium: false,
        }
      }
    },
    select: {
      id: true,
      title: true,
      videos: {
        where: {
          sequence: 1,
          isPremium: false,
        },
        select: {
          id: true,
          url: true,
          sequence: true,
        }
      }
    },
    orderBy: [
      { featured: 'desc' },
      { postNum: 'asc' },
      { createdAt: 'desc' }
    ],
    take: 5  // 초기 5개만 로드
  });

  const validPosts = posts.filter(post => post.videos.length > 0);
  return <RecommendedVideosClient posts={validPosts} />;
}

// import prisma from "@/lib/prisma";
// import { RecommendedVideosClient } from "./RecommendedVideosClient";

// // 5분마다 재렌더링
// export const revalidate = 300;

// // SSR + ISR
// export default async function RecommendedVideosPage() {
//   const posts = await prisma.post.findMany({
//     where: {
//       videos: {
//         some: {
//           sequence: 1
//         }
//       }
//     },
//     select: {
//       id: true,
//       title: true,
//       videos: {
//         where: {
//           sequence: 1
//         },
//         select: {
//           id: true,
//           url: true,
//           sequence: true,
//         }
//       }
//     },
//     orderBy: {
//       createdAt: 'desc'
//     }
//   });

//   const validPosts = posts.filter(post => post.videos.length > 0);

//   return <RecommendedVideosClient posts={validPosts} />;
// }