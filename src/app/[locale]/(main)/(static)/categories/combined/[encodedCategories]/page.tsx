import { CategoryType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import PostGrid from "@/components/PostGrid";
import { SliderSetting } from "@/lib/sliderSettings";

export const revalidate = false;

export async function generateStaticParams() {
  // SystemSetting에서 복수 카테고리 슬라이더 설정을 가져와서 정적 페이지 생성
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
}

// 페이지가 존재하는지 확인
export async function generateMetadata({ params }: { params: { encodedCategories: string } }) {
  const categories = params.encodedCategories.split('-') as CategoryType[];
  
  const posts = await prisma.post.findFirst({
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
    }
  });

  if (!posts) {
    return {
      title: '404 - Page Not Found',
      description: 'This page does not exist'
    };
  }

  return {
    title: `${categories.join(' & ')} 카테고리`,
    description: `${categories.join(' & ')} 카테고리의 포스트 목록`
  };
}

export default async function CombinedCategoryPage({
  params: { encodedCategories }
}: {
  params: { encodedCategories: string }
}) {
  const categories = encodedCategories.split('-') as CategoryType[];
  
  const posts = await prisma.post.findMany({
    where: {
      categories: {
        hasEvery: categories // AND 조건으로 모든 카테고리를 포함하는 포스트만 선택
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

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-xl bg-card p-2 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-base sm:text-xl font-bold">
            {categories.join(' & ')} 카테고리
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
