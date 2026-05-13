import { NextRequest } from 'next/server';
import { CategoryType } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const skip = parseInt(searchParams.get('skip') || '0');
  const take = parseInt(searchParams.get('take') || '5');

  try {
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
            sequence: 1,  // sequence=1인 비디오만
            isPremium: false,
          }
        }
      },
      select: {  // include 대신 select 사용
        id: true,
        title: true,
        featured: true,
        priority: true,
        videos: {
          where: {
            sequence: 1,  // 여기도 sequence=1로 명확하게
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
      skip,
      take
    });

    const validPosts = posts.filter(post => post.videos.length > 0);
    return Response.json(validPosts);

  } catch (error) {
    console.error('Failed to fetch recommended posts:', error);
    return new Response('Failed to fetch posts', { status: 500 });
  }
}