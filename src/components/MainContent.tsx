import { PostData } from "@/lib/types";
import prisma from "@/lib/prisma";
import { CategoryType } from "@prisma/client";
import FeaturedPostSlider from "./slider/FeaturedPostSlider";
import PostSlider from "./slider/PostSlider";
import RankedPostSlider from "./slider/RankedPostSlider";
import { SliderSetting } from "@/lib/sliderSettings";

export const dynamic = 'force-static';

const postSelect = {
  id: true,
  postNum: true,
  title: true,
  content: true,
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
      avatarUrl: true
    }
  },
  _count: {
    select: {
      likes: true,
      comments: true
    }
  }
};

async function getLatestPosts(take: number = 20) {
  return await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
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
    take
  }) as PostData[];
}

async function getRankedPosts(take: number = 10, rankingType: 'likes' | 'views' = 'likes') {
  if (rankingType === 'views') {
    return await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
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
      take
    }) as PostData[];
  }

  return await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
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
    take
  }) as PostData[];
}

async function getCategoryPosts(categories: CategoryType[], take: number = 20) {
  return await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      NOT: {
        categories: {
          hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
        }
      },
      categories: {
        hasEvery: categories
      }
    },
    select: postSelect,
    orderBy: [
      { featured: 'desc' },
      { priority: 'desc' },
      { publishedAt: 'desc' }
    ],
    take
  }) as PostData[];
}

export default async function MainContent() {
  // 슬라이더 설정 가져오기
  const settings = await prisma.systemSetting.findUnique({
    where: { key: 'main_sliders' }
  });
  
  const sliderSettings = (settings?.value as SliderSetting[]) || [];

  // 각 슬라이더의 포스트 데이터 가져오기
  const sliderDataPromises = sliderSettings.map(async (slider) => {
    switch (slider.type) {
      case 'latest':
        return {
          ...slider,
          posts: await getLatestPosts(slider.postCount)
        };
      case 'ranked':
        return {
          ...slider,
          posts: await getRankedPosts(slider.postCount, slider.rankingType)
        };
      case 'category':
        return {
          ...slider,
          posts: await getCategoryPosts(slider.categories || [], slider.postCount)
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
      <FeaturedPostSlider posts={sortedSliders[0]?.posts || []} />
      <div className="space-y-6 py-12 md:py-12">
        {sortedSliders.map((slider) => {
          if (slider.type === 'ranked') {
            return (
              <RankedPostSlider
                key={slider.id}
                posts={slider.posts}
                title={slider.title}
                viewAllHref={slider.viewAllHref}
                sliderId={slider.id}
              />
            );
          }
          return (
            <PostSlider
              key={slider.id}
              posts={slider.posts}
              title={slider.title}
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
