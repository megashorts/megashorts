import prisma from "@/lib/prisma";
import { CategoryType } from '@prisma/client';
import { RecommendedVideosClient } from "./RecommendedVideosClient";
import { Metadata } from "next";

export const revalidate = 3600;

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
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
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
        }
      }
    },
    orderBy: [
      { featured: 'desc' },
      { priority: 'asc' },
      { createdAt: 'desc' }
    ],
    take: 15  // 다시 15개로
  });

  const validPosts = posts.filter(post => post.videos.length > 0);
  return <RecommendedVideosClient posts={validPosts} />;
}
