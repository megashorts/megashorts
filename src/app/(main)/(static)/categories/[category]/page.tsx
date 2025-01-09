import { CategoryType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import PostGrid from "@/components/PostGrid";

// 디버깅을 위한 로그 추가
export async function generateStaticParams() {
  const categories = Object.values(CategoryType);
  console.log('Generating static params for categories:', categories);
  
  return categories.map((category) => {
    console.log('Processing category:', category);
    return {
      category: category.toString()
    };
  });
}

export default async function CategoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ category: string }>
}) {
  const params = await paramsPromise;
  const categoryType = params.category.toUpperCase() as CategoryType;
  
  console.log('Building page for category:', categoryType);

  const posts = await prisma.post.findMany({
    where: {
      categories: {
        has: categoryType
      },
      status: "PUBLISHED",
    },
    include: getPostDataInclude(""),
    orderBy: { 
      createdAt: "desc"
    },
    take: 20
  });

  console.log(`Found ${posts.length} posts for category:`, categoryType);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">
            {categoryType} 카테고리
          </h1>
        </div>
        <PostGrid 
          initialPosts={posts}
          category={categoryType}
        />
      </div>
    </main>
  );
}

// import { CategoryType } from "@prisma/client";
// import prisma from "@/lib/prisma";
// import { getPostDataInclude } from "@/lib/types";
// import PostGrid from "@/components/PostGrid";

// // export const dynamic = 'force-static';
// // export const revalidate = false;
// // export const fetchCache = 'force-cache';

// // 포스트 작업 시에만 재생성되도록 설정
// export const revalidate = false;

// export async function generateStaticParams() {
//   return Object.values(CategoryType).map((category) => ({
//     category: category.toString()
//   }));
// }

// export default async function CategoryPage({
//   params: paramsPromise,
// }: {
//   params: Promise<{ category: string }>
// }) {
//   const params = await paramsPromise;
//   const categoryType = params.category.toUpperCase() as CategoryType;

//   const posts = await prisma.post.findMany({
//     where: {
//       categories: {
//         has: categoryType
//       },
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
//             {categoryType} 카테고리
//           </h1>
//         </div>
//         <PostGrid 
//           initialPosts={posts}
//           category={categoryType}
//         />
//       </div>
//     </main>
//   );
// }