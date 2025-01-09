import PostGrid from "@/components/PostGrid";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";

// export const dynamic = 'force-static';
// export const revalidate = false;
// export const fetchCache = 'force-cache';

// 포스트 작업 시에만 재생성되도록 설정
export const revalidate = false;

export default async function RecentPage() {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: getPostDataInclude(""),
    orderBy: { 
      createdAt: "desc"
    },
    take: 20
  });

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">
            최신 업데이트
          </h1>
        </div>
        <PostGrid initialPosts={posts} />
      </div>
    </main>
  );
}

// import prisma from "@/lib/prisma";
// import { getPostDataInclude } from "@/lib/types";
// import RecentGrid from "./RecentGrid";

// export const dynamic = 'force-static';
// export const revalidate = false;
// export const fetchCache = 'force-cache';

// export default async function RecentPage() {
//   const posts = await prisma.post.findMany({
//     where: {
//       status: "PUBLISHED",
//     },
//     include: getPostDataInclude(""),
//     orderBy: { 
//       createdAt: "desc"
//     },
//     take: 20
//   });

//   return (
//     <main className="flex w-full min-w-0 gap-5">
//       <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
//         <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
//           <h1 className="text-center text-lg sm:text-2xl font-bold">
//             최신 업데이트
//           </h1>
//         </div>
//         <RecentGrid posts={posts} />
//       </div>
//     </main>
//   );
// }