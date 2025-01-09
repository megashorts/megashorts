import prisma from "@/lib/prisma";
import { RecommendedVideosClient } from "./RecommendedVideosClient";

// 5분마다 재렌더링
export const revalidate = 300;

export default async function RecommendedVideosPage() {
  const posts = await prisma.post.findMany({
    where: {
      videos: {
        some: {
          sequence: 1
        }
      }
    },
    select: {
      id: true,
      title: true,
      videos: {
        where: {
          sequence: 1
        },
        select: {
          id: true,
          url: true,
          sequence: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
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