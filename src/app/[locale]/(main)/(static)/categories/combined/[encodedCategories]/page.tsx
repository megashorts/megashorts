import { CategoryType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import PostGrid from "@/components/PostGrid";
import { SliderSetting } from "@/lib/sliderSettings";
import { getLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getContentLanguagePolicy, getContentLanguageWhere } from "@/lib/content-language-server";
import { unstable_cache } from "next/cache";
import { CONTENT_TAGS } from "@/lib/content-revalidation";

export const revalidate = false;
export const dynamic = "force-static";

export async function generateStaticParams() {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { key: 'main_sliders' }
    });

    if (!settings) {
      return [];
    }

    const sliderSettings = settings.value as SliderSetting[];
    
    return sliderSettings
      .filter(s => s.type === 'category' && s.categories && s.categories.length > 1)
      .map(s => ({
        encodedCategories: s.categories!.join('-')
      }));
  } catch (error) {
    console.warn('Skipping combined category static params:', error);
    return [];
  }
}

// 페이지가 존재하는지 확인
export async function generateMetadata({ params }: { params: Promise<{ encodedCategories: string }> }) {
  const { encodedCategories } = await params;
  const categories = encodedCategories.split('-') as CategoryType[];
  const currentLocale = await getLocale();
  const contentLanguagePolicy = await getContentLanguagePolicy();
  const tCat = await getTranslations('Category');
  const tContent = await getTranslations('Content');
  const categoryTitle = categories.map((category) => tCat(category)).join(' & ');
  
  const posts = await prisma.post.findFirst({
    where: {
      status: 'PUBLISHED',
      ...getContentLanguageWhere(currentLocale, contentLanguagePolicy),
      NOT: {
        categories: {
          hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
        }
      },
      categories: {
        hasEvery: categories
      }
    }
  });

  if (!posts) {
    return {
      title: '404 - Page Not Found',
      description: 'This page does not exist'
    };
  }

  return {
    title: tContent('categoryTitle', { category: categoryTitle }),
    description: tContent('categoryDescription', { category: categoryTitle })
  };
}

export default async function CombinedCategoryPage({
  params
}: {
  params: Promise<{ encodedCategories: string }>
}) {
  const { encodedCategories } = await params;
  const categories = encodedCategories.split('-') as CategoryType[];
  const currentLocale = await getLocale();
  const contentLanguagePolicy = await getContentLanguagePolicy();
  const tCat = await getTranslations('Category');
  const tContent = await getTranslations('Content');
  const categoryTitle = categories.map((category) => tCat(category)).join(' & ');
  
  const getCombinedCategoryPosts = unstable_cache(
    async (locale: string, encoded: string, policy: typeof contentLanguagePolicy) => {
      const parsedCategories = encoded.split("-") as CategoryType[];
      return prisma.post.findMany({
        where: {
          ...getContentLanguageWhere(locale, policy),
          categories: {
            hasEvery: parsedCategories
          },
          status: "PUBLISHED",
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
      });
    },
    ["combined-category-page-posts"],
    {
      tags: [
        CONTENT_TAGS.categories,
        `content:locale:${currentLocale}`,
        ...categories.map((category) => `content:category:${category}`),
      ],
      revalidate: false,
    }
  );

  const posts = await getCombinedCategoryPosts(currentLocale, encodedCategories, contentLanguagePolicy);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-xl bg-card p-2 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-base sm:text-xl font-bold">
            {tContent('categoryTitle', { category: categoryTitle })}
          </h1>
        </div>
        <PostGrid 
          initialPosts={posts}
          category={categories[0]} // PostGrid는 단일 카테고리만 지원하므로 첫 번째 카테고리 사용
        />
      </div>
    </main>
  );
}
