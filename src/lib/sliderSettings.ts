import { CategoryType } from "@prisma/client";

export type SliderSetting = {
  id: string;
  title?: string; // Featured 슬라이더는 title 불필요
  postCount: number;
  categories?: CategoryType[];
  type: 'featured' | 'latest' | 'ranked' | 'category';
  rankingType?: 'likes' | 'views';
  order: number;
  viewAllHref: string;
  manualPosts?: string[]; // Featured 슬라이더용 수동 추가 포스트 ID 배열
};

export const defaultSliderSettings = {
  featured: {
    postCount: 10,
    title: "추천 작품",
    viewAllHref: "",
    order: 0, // 항상 최상단
    manualPosts: []
  },
  latest: {
    postCount: 20,
    title: "최신 업데이트",
    viewAllHref: "/categories/recent"
  },
  ranked: {
    postCount: 10,
    title: "인기 작품",
    rankingType: "likes" as const,
    viewAllHref: ""
  },
  category: {
    postCount: 20,
    title: "새 카테고리",
    viewAllHref: "" // 카테고리 선택 시 자동 생성
  }
};

export async function getMainSliderSettings(): Promise<SliderSetting[]> {
  try {
    const response = await fetch('/api/admin/slider-settings');
    if (!response.ok) {
      console.error('Failed to fetch slider settings');
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching slider settings:', error);
    return [];
  }
}

export async function saveMainSliderSettings(settings: SliderSetting[]) {
  const response = await fetch('/api/admin/slider-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings)
  });

  if (!response.ok) {
    throw new Error('Failed to save slider settings');
  }

  return response.json();
}

export function generateCategoryViewAllHref(categories: CategoryType[]): string {
  if (categories.length === 0) return '';
  if (categories.length === 1) return `/categories/${categories[0]}`;
  return `/categories/combined/${categories.join('-')}`;
}

export function generateSliderId(type: string, categories?: CategoryType[], order?: number): string {
  if (type === 'featured') return `featured-posts${order !== undefined ? `-${order}` : ''}`;
  if (type === 'latest') return 'latest-updates';
  if (type === 'ranked') return 'ranked-posts';
  if (type === 'category' && categories) {
    const orderSuffix = order ? `-${order}` : '';
    return `${categories.join('-').toLowerCase()}-slider${orderSuffix}`;
  }
  return '';
}
