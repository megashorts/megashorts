import { CategoryType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import PostGrid from "@/components/PostGrid";
import { getContentLanguagePolicy, getContentLanguageWhere } from "@/lib/content-language-server";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { CONTENT_TAGS } from "@/lib/content-revalidation";

// 디버깅을 위한 로그 추가
export async function generateStaticParams() {
  return [];
}

export const dynamic = "force-static";
export const revalidate = false;

export default async function CategoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const params = await paramsPromise;
  const categoryType = params.category.toUpperCase() as CategoryType;
  const contentLanguagePolicy = await getContentLanguagePolicy();
  const tCat = await getTranslations('Category');
  const tContent = await getTranslations('Content');
  
  const getCategoryPagePosts = unstable_cache(
    async (locale: string, category: CategoryType, policy: typeof contentLanguagePolicy) => prisma.post.findMany({
      where: {
        ...getContentLanguageWhere(locale, policy),
        categories: {
          has: category
        },
        status: "PUBLISHED",
      },
      include: getPostDataInclude(""),
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    }),
    ["category-page-posts"],
    {
      tags: [CONTENT_TAGS.categories, `content:category:${categoryType}`, `content:locale:${params.locale}`],
      revalidate: false,
    }
  );

  const posts = await getCategoryPagePosts(params.locale, categoryType, contentLanguagePolicy);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-xl bg-card p-2 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-base sm:text-xl font-bold">
            {tContent('categoryTitle', { category: tCat(categoryType) })}
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
