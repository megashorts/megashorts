import prisma from "@/lib/prisma";
import { CategoryType } from '@prisma/client';
import { RecommendedVideosClient } from "./RecommendedVideosClient";
import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getContentLanguagePolicy, getContentLanguageWhere } from "@/lib/content-language-server";
import { unstable_cache } from "next/cache";
import { CONTENT_TAGS } from "@/lib/content-revalidation";

export const dynamic = 'force-static';
export const revalidate = false;

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
  const currentLocale = await getLocale();
  const contentLanguagePolicy = await getContentLanguagePolicy();

  const getRecommendedPosts = unstable_cache(
    async (locale: string, policy: typeof contentLanguagePolicy) => prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        ...getContentLanguageWhere(locale, policy),
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
        titleI18n: true,
        content: true,
        contentI18n: true,
        postLanguage: true,
        featured: true,
        priority: true,
        videos: {
          where: {
            sequence: 1,
            isPremium: false,
          },
          select: {
            id: true,
            sequence: true,
            subtitle: true,
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { priority: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 15
    }),
    ["recommended-videos-page-posts"],
    {
      tags: [CONTENT_TAGS.recommended, CONTENT_TAGS.categories, `content:locale:${currentLocale}`],
      revalidate: false,
    }
  );

  const posts = await getRecommendedPosts(currentLocale, contentLanguagePolicy);

  const validPosts = posts.filter(post => post.videos.length > 0);
  return <RecommendedVideosClient posts={validPosts} />;
}
