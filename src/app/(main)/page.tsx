import MainContent from '@/components/MainContent';
import { Suspense } from 'react'


// 24시간마다 재생성
export const revalidate = 86400;

// 페이지 자체는 동적으로 유지
export default async function Home() {
  return (
    <Suspense>
      <MainContent />
    </Suspense>
  )
}

// // src/app/page.tsx
// import SlideVideo from "@/components/SlideVideo";
// import { PostWithVideos } from "@/lib/types";
// import prisma from "@/lib/prisma";
// import { CategoryType } from "@prisma/client";
// import PostSlider from "@/components/PostSlider";
// import RankedPostSlider from "@/components/RankedPostSlider";
// //import { Footer } from "@/components/footer";
// import Footer from "@/components/footer";

// export const dynamic = 'force-static'  // 정적 페이지로 설정
// export const revalidate = false        // 수동 재검증만 허용

// // 관리자가 선택한 드라마 포스트 번호들
// const FEATURED_DRAMA_POST_NUMS = [1, 2, 3]; // 예시 포스트 번호

// export async function generateMetadata() {
//   return {
//     title: 'MS Making - 최고의 영상 컨텐츠',
//     description: '다양한 장르의 영상 컨텐츠를 제공합니다.',
//   }
// }

// async function getFeaturedPosts() {
//   const posts = await prisma.post.findMany({
//     where: {
//       status: 'PUBLISHED',
//     },
//     select: {
//       id: true,
//       postNum: true,
//       title: true,
//       content: true,
//       thumbnailUrl: true,
//       status: true,
//       featured: true,
//       priority: true,
//       userId: true,
//       categories: true,
//       viewCount: true,
//       createdAt: true,
//       updatedAt: true,
//       publishedAt: true,
//       videos: {
//         where: {
//           sequence: 1
//         },
//         take: 1
//       }
//     },
//     orderBy: {
//       priority: 'desc'
//     },
//     take: 10
//   });
  
//   return posts as PostWithVideos[];
// }

// async function getRomancePosts() {
//   return await prisma.post.findMany({
//     where: {
//       status: 'PUBLISHED',
//       categories: {
//         has: CategoryType.ROMANCE
//       }
//     },
//     select: {
//       id: true,
//       postNum: true,
//       title: true,
//       content: true,
//       thumbnailUrl: true,
//       categories: true,
//       videos: {
//         where: { sequence: 1 },
//         take: 1
//       }
//     },
//     orderBy: {
//       priority: 'desc'
//     },
//     take: 10
//   }) as PostWithVideos[];
// }

// async function getLatestPosts() {
//   return await prisma.post.findMany({
//     where: {
//       status: 'PUBLISHED',
//     },
//     select: {
//       id: true,
//       postNum: true,
//       title: true,
//       content: true,
//       thumbnailUrl: true,
//       categories: true,
//       videos: {
//         where: { sequence: 1 },
//         take: 1
//       }
//     },
//     orderBy: {
//       publishedAt: 'desc'
//     },
//     take: 10
//   }) as PostWithVideos[];
// }

// async function getFeaturedDramaPosts() {
//   return await prisma.post.findMany({
//     where: {
//       status: 'PUBLISHED',
//       categories: {
//         has: CategoryType.DRAMA
//       },
//       postNum: {
//         in: FEATURED_DRAMA_POST_NUMS
//       }
//     },
//     select: {
//       id: true,
//       postNum: true,
//       title: true,
//       content: true,
//       thumbnailUrl: true,
//       categories: true,
//       videos: {
//         where: { sequence: 1 },
//         take: 1
//       }
//     },
//     orderBy: {
//       postNum: 'asc'
//     }
//   }) as PostWithVideos[];
// }

// async function getMostLikedPosts() {
//   return await prisma.post.findMany({
//     where: {
//       status: 'PUBLISHED',
//     },
//     select: {
//       id: true,
//       postNum: true,
//       title: true,
//       content: true,
//       thumbnailUrl: true,
//       categories: true,
//       videos: {
//         where: { sequence: 1 },
//         take: 1
//       }
//     },
//     orderBy: {
//       likes: {
//         _count: 'desc'
//       }
//     },
//     take: 10
//   }) as PostWithVideos[];
// }

// export default async function Home() {
//   // 각 섹션별로 필요한 데이터만 가져오기
//   const [getFeaturedPost, romancePosts, latestPosts, featuredDramaPosts, mostLikedPosts] = await Promise.all([
//     getFeaturedPosts(),
//     getRomancePosts(),
//     getLatestPosts(),
//     getFeaturedDramaPosts(),
//     getMostLikedPosts()
//   ]);

//   return (
//     <div className="container mx-auto px-4 py-4 z-5">
//       {/* <SlideVideo posts={[]} /> */}
//       <SlideVideo posts={getFeaturedPost} />
      
//       {/* 슬라이더 섹션 */}
//       <div className="space-y-6 py-12">
//         {/* TOP 10 인기작품 슬라이더 */}
//         <RankedPostSlider
//           posts={mostLikedPosts}
//           title="TOP 10 인기작품"
//           viewAllHref={""}
//         />

//         {/* 로맨스 카테고리 슬라이더 */}
//         <PostSlider
//           posts={romancePosts}
//           title="❤️ 인기 로맨스"
//           category={CategoryType.ROMANCE}
//           viewAllHref={""}
//         />

//         {/* 최신 등록순 슬라이더 */}
//         <PostSlider
//           posts={latestPosts}
//           title="최신 업데이트"
//           category={null}
//           viewAllHref={""}
//         />

//         {/* 관리자 선택 드라마 슬라이더 */}
//         <PostSlider
//           posts={featuredDramaPosts}
//           title="추천 드라마"
//           category={CategoryType.DRAMA}
//           viewAllHref={""}
//         />
//       </div>
//       <Footer />
//     </div>
//   );
// }
