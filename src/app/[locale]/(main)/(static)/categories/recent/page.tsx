import PostGrid from "@/components/PostGrid";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { CategoryType } from "@prisma/client";
import { getLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getContentLanguagePolicy, getContentLanguageWhere } from "@/lib/content-language-server";
import { unstable_cache } from "next/cache";
import { CONTENT_TAGS } from "@/lib/content-revalidation";

// export const dynamic = 'force-static';
// export const revalidate = false;
// export const fetchCache = 'force-cache';

export const dynamic = 'force-static';
export const revalidate = false;

export default async function RecentPage() {
  const currentLocale = await getLocale();
  const contentLanguagePolicy = await getContentLanguagePolicy();
  const tContent = await getTranslations('Content');

  const getRecentPosts = unstable_cache(
    async (locale: string, policy: typeof contentLanguagePolicy) => prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        ...getContentLanguageWhere(locale, policy),
        NOT: {
          categories: {
            hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
          }
        }
      },
      include: getPostDataInclude(""),
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    }),
    ["recent-page-posts"],
    {
      tags: [CONTENT_TAGS.recent, CONTENT_TAGS.categories, `content:locale:${currentLocale}`],
      revalidate: false,
    }
  );

  const posts = await getRecentPosts(currentLocale, contentLanguagePolicy);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-xl bg-card p-2 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-base sm:text-xl font-bold">{tContent('latestUpdates')}</h1>
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
