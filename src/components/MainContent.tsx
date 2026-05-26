import { PostData } from "@/lib/types";
import prisma from "@/lib/prisma";
import { CategoryType } from "@prisma/client";
import FeaturedPostSlider from "./slider/FeaturedPostSlider";
import PostSlider from "./slider/PostSlider";
import RankedPostSlider from "./slider/RankedPostSlider";
import { SliderSetting, defaultSliderSettings } from "@/lib/sliderSettings";
import { getLocale } from 'next-intl/server';
import { getDynamicContent } from '@/lib/i18n-utils';
import { getContentLanguagePolicy, getContentLanguageWhere } from '@/lib/content-language-server';
import type { ContentLanguagePolicy } from '@/lib/content-language';
import { unstable_cache } from "next/cache";
import { CONTENT_TAGS } from "@/lib/content-revalidation";

export const dynamic = 'force-static';

const postSelect = {
  id: true,
  postNum: true,
  title: true,
  titleI18n: true,
  content: true,
  contentI18n: true,
  postLanguage: true,
  thumbnailId: true,
  categories: true,
  status: true,
  featured: true,
  priority: true,
  userId: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  videoCount: true,
  ageLimit: true,
  videos: {
    where: { sequence: 1 },
    take: 1
  },
  likes: {
    select: {
      userId: true
    }
  },
  bookmarks: {
    select: {
      userId: true
    }
  },
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      // avatarUrl: true
    }
  },
  _count: {
    select: {
      likes: true,
      comments: true
    }
  }
};

async function getLatestPosts(locale: string, policy: ContentLanguagePolicy, take: number = 20) {
  const getCachedLatestPosts = unstable_cache(
    async (cacheLocale: string, cachePolicy: ContentLanguagePolicy, cacheTake: number) => {
      return prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          ...getContentLanguageWhere(cacheLocale, cachePolicy),
          NOT: {
            categories: {
              hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
            }
          }
        },
        select: postSelect,
        orderBy: {
          publishedAt: 'desc'
        },
        take: cacheTake
      });
    },
    ["main-content-latest-posts"],
    {
      tags: [CONTENT_TAGS.home, CONTENT_TAGS.recent, CONTENT_TAGS.categories, `content:locale:${locale}`],
      revalidate: false,
    }
  );

  return getCachedLatestPosts(locale, policy, take) as Promise<PostData[]>;
}

async function getRankedPosts(
  locale: string,
  policy: ContentLanguagePolicy,
  take: number = 10,
  rankingType: 'likes' | 'views' = 'likes',
) {
  const getCachedRankedPosts = unstable_cache(
    async (
      cacheLocale: string,
      cachePolicy: ContentLanguagePolicy,
      cacheTake: number,
      cacheRankingType: 'likes' | 'views',
    ) => {
      if (cacheRankingType === 'views') {
        return prisma.post.findMany({
          where: {
            status: 'PUBLISHED',
            ...getContentLanguageWhere(cacheLocale, cachePolicy),
            NOT: {
              categories: {
                hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
              }
            },
          },
          select: postSelect,
          orderBy: {
            viewCount: 'desc'
          },
          take: cacheTake
        });
      }

      return prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          ...getContentLanguageWhere(cacheLocale, cachePolicy),
          NOT: {
            categories: {
              hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
            }
          },
        },
        select: postSelect,
        orderBy: {
          likes: {
            _count: 'desc'
          }
        },
        take: cacheTake
      });
    },
    ["main-content-ranked-posts"],
    {
      tags: [CONTENT_TAGS.home, CONTENT_TAGS.categories, `content:locale:${locale}`],
      revalidate: false,
    }
  );

  return getCachedRankedPosts(locale, policy, take, rankingType) as Promise<PostData[]>;
}

async function getFeaturedPosts(
  locale: string,
  policy: ContentLanguagePolicy,
  take: number = 10,
  manualPosts: string[] = [],
) {
  const getCachedFeaturedPosts = unstable_cache(
    async (
      cacheLocale: string,
      cachePolicy: ContentLanguagePolicy,
      cacheTake: number,
      cacheManualPosts: string[],
    ) => {
      const contentLanguageWhere = getContentLanguageWhere(cacheLocale, cachePolicy);

      const manualPostsData = cacheManualPosts.length > 0
        ? await prisma.post.findMany({
            where: {
              id: { in: cacheManualPosts },
              status: 'PUBLISHED',
              ...contentLanguageWhere,
              NOT: {
                categories: {
                  hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
                }
              }
            },
            select: postSelect,
          })
        : [];

      const sortedManualPosts = cacheManualPosts
        .map(id => manualPostsData.find(post => post.id === id))
        .filter((post): post is PostData => post !== undefined);

      const remainingCount = cacheTake - sortedManualPosts.length;
      const featuredPosts = remainingCount > 0
        ? await prisma.post.findMany({
            where: {
              status: 'PUBLISHED',
              featured: true,
              ...contentLanguageWhere,
              NOT: {
                OR: [
                  { id: { in: cacheManualPosts } },
                  { categories: { hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION] } }
                ]
              }
            },
            select: postSelect,
            orderBy: [
              { priority: 'desc' },
              { publishedAt: 'desc' }
            ],
            take: remainingCount
          })
        : [];

      return [...sortedManualPosts, ...featuredPosts] as PostData[];
    },
    ["main-content-featured-posts"],
    {
      tags: [CONTENT_TAGS.home, CONTENT_TAGS.sliders, CONTENT_TAGS.categories, `content:locale:${locale}`],
      revalidate: false,
    }
  );

  return getCachedFeaturedPosts(locale, policy, take, manualPosts) as Promise<PostData[]>;
}

async function getCategoryPosts(
  locale: string,
  policy: ContentLanguagePolicy,
  categories: CategoryType[],
  take: number = 20,
) {
  const getCachedCategoryPosts = unstable_cache(
    async (
      cacheLocale: string,
      cachePolicy: ContentLanguagePolicy,
      cacheCategories: CategoryType[],
      cacheTake: number,
    ) => {
      return prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          ...getContentLanguageWhere(cacheLocale, cachePolicy),
          NOT: {
            categories: {
              hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
            }
          },
          categories: {
            hasEvery: cacheCategories
          }
        },
        select: postSelect,
        orderBy: [
          { featured: 'desc' },
          { priority: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: cacheTake
      });
    },
    ["main-content-category-posts"],
    {
      tags: [
        CONTENT_TAGS.home,
        CONTENT_TAGS.categories,
        `content:locale:${locale}`,
        ...categories.map((category) => `content:category:${category}`),
      ],
      revalidate: false,
    }
  );

  return getCachedCategoryPosts(locale, policy, categories, take) as Promise<PostData[]>;
}

export default async function MainContent() {
  const currentLocale = await getLocale();
  const contentLanguagePolicy = await getContentLanguagePolicy();
  // 슬라이더 설정 가져오기
  const getMainSliderSettings = unstable_cache(
    async () => prisma.systemSetting.findUnique({
      where: { key: 'main_sliders' }
    }),
    ["main-content-slider-settings"],
    {
      tags: [CONTENT_TAGS.home, CONTENT_TAGS.sliders, CONTENT_TAGS.settings],
      revalidate: false,
    }
  );

  const settings = await getMainSliderSettings();
  
  const sliderSettings = (settings?.value as SliderSetting[]) || [];

  // 각 슬라이더의 포스트 데이터 가져오기
  const sliderDataPromises = sliderSettings.map(async (slider) => {
    switch (slider.type) {
      case 'featured':
        return {
          ...slider,
          posts: await getFeaturedPosts(currentLocale, contentLanguagePolicy, slider.postCount, slider.manualPosts)
        };
      case 'latest':
        return {
          ...slider,
          posts: await getLatestPosts(currentLocale, contentLanguagePolicy, slider.postCount)
        };
      case 'ranked':
        return {
          ...slider,
          posts: await getRankedPosts(currentLocale, contentLanguagePolicy, slider.postCount, slider.rankingType)
        };
      case 'category':
        return {
          ...slider,
          posts: await getCategoryPosts(currentLocale, contentLanguagePolicy, slider.categories || [], slider.postCount)
        };
      default:
        return {
          ...slider,
          posts: []
        };
    }
  });

  const slidersWithData = await Promise.all(sliderDataPromises);

  // 슬라이더 순서대로 정렬
  const sortedSliders = slidersWithData.sort((a, b) => a.order - b.order);

  return (
    <div className="container mx-auto px-4 py-4 z-5">
      {/* Featured 슬라이더 */}
      {/* Featured 슬라이더는 항상 하나만 존재 */}
      {sortedSliders.find(s => s.type === 'featured') && (() => {
        const featuredSlider = sortedSliders.find(s => s.type === 'featured')!;
        const title = getDynamicContent(
          featuredSlider.title || defaultSliderSettings.featured.title,
          featuredSlider.titleI18n,
          currentLocale
        );
        return (
          <FeaturedPostSlider 
            key="featured"
            posts={featuredSlider.posts || []}
            title={title}
            viewAllHref={featuredSlider.viewAllHref}
            sliderId="featured-slider"
          />
        );
      })()}
      
      {/* 나머지 슬라이더들 */}
      <div className="space-y-6 py-12 md:py-12">
        {sortedSliders
          .filter(slider => slider.type !== 'featured')
          .map((slider) => {
            // title이 없는 경우 기본값 설정
            const title = getDynamicContent(
              slider.title || defaultSliderSettings[slider.type].title,
              slider.titleI18n,
              currentLocale
            );

            if (slider.type === 'ranked') {
              return (
                <RankedPostSlider
                  key={slider.id}
                  posts={slider.posts}
                  title={title}
                  viewAllHref={slider.viewAllHref}
                  sliderId={slider.id}
                />
              );
            }
            return (
              <PostSlider
                key={slider.id}
                posts={slider.posts}
                title={title}
                category={slider.categories?.[0] || null}
                viewAllHref={slider.viewAllHref}
                sliderId={slider.id}
              />
            );
          })}
      </div>
    </div>
  );
}
