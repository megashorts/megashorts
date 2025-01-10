import { PostData } from "@/lib/types";
import prisma from "@/lib/prisma";
import { CategoryType } from "@prisma/client";
import FeaturedPostSlider from "./slider/FeaturedPostSlider";
import PostSlider from "./slider/PostSlider";
import RankedPostSlider from "./slider/RankedPostSlider";


// 컨텐츠 부분만 정적으로 설정
// export const dynamic = 'force-static'
// export const revalidate = 0
// 위 주석처리후 ISR변경
// export const revalidate = 86400; // 24시간마다 재생성

export const dynamic = 'force-static';

// 관리자가 선택한 드라마 포스트 번호들
const FEATURED_DRAMA_POST_NUMS = [1, 2, 3]; // 예시 포스트 번호

const postSelect = {
  id: true,
  postNum: true,
  title: true,
  content: true,
  thumbnailUrl: true,
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
  // PostModal에 필요한 필드들 추가
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

async function getFeaturedPosts() {
  const posts = await prisma.post.findMany({
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
      priority: 'desc'
    },
    take: 20,
  });
  
  return posts as PostData[];
}

async function getRomancePosts() {
  return await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      NOT: {
        categories: {
          hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
        }
      },
      categories: {
        has: CategoryType.ROMANCE
      }
    },
    select: postSelect,
    orderBy: {
      priority: 'desc'
    },
    take: 20
  }) as PostData[];
}

async function getLatestPosts() {
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
    take: 20
  }) as PostData[];
}

async function getFeaturedDramaPosts() {
  return await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      NOT: {
        categories: {
          hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
        }
      },
      categories: {
        has: CategoryType.DRAMA
      },
      // postNum: {
      //   in: FEATURED_DRAMA_POST_NUMS
      // }
    },
    select: postSelect,
    orderBy: {
      postNum: 'asc'
    }
  }) as PostData[];
}

async function getMostLikedPosts() {
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
    take: 10
  }) as PostData[];
}

async function getActionPosts() {
  return await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      NOT: {
        categories: {
          hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
        }
      },
      categories: {
        has: CategoryType.ACTION
      }
    },
    select: postSelect,
    orderBy: {
      priority: 'desc'
    },
    take: 20
  }) as PostData[];
}


export default async function MainContent() {
    const [getFeaturedPost, romancePosts, latestPosts, featuredDramaPosts, mostLikedPosts, actionPosts] = await Promise.all([
      getFeaturedPosts(),
      getRomancePosts(),
      getLatestPosts(),
      getFeaturedDramaPosts(),
      getMostLikedPosts(),
      getActionPosts()
    ]);
  
    return (
      <div className="container mx-auto px-4 py-4 z-5">
        <FeaturedPostSlider posts={getFeaturedPost} />
        <div className="space-y-6 py-12 md:py-12">
           <PostSlider
            posts={latestPosts}
            title="⚡️ 최신 업데이트 ⚡️"
            category={null}
            viewAllHref={"/categories/recent"}
            sliderId="latest-updates"  // 추가
          />
          <RankedPostSlider
            posts={mostLikedPosts}
            title="🎉 TOP 10 인기작품"
            viewAllHref={""}
            sliderId="ranked-posts"  // 추가
          />
          <PostSlider
            posts={romancePosts}
            title="❤️ 인기 로맨스"
            category={CategoryType.ROMANCE}
            viewAllHref={"/categories/ROMANCE"}
            sliderId="romance-posts"  // 추가
          />
          <PostSlider
            posts={featuredDramaPosts}
            title="😭 감동적인 드라마"
            category={CategoryType.DRAMA}
            viewAllHref={"/categories/DRAMA"}
            sliderId="drama-posts"  // 추가
          />
          <PostSlider
            posts={actionPosts}
            title="⚔️ 숨막히는 액션"
            category={CategoryType.ACTION}
            viewAllHref={"/categories/ACTION"}
            sliderId="action-posts"  // 추가
          />
        </div>
      </div>
    )
  }
