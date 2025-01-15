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
            sequence: 1,
            isPremium: false,
          }
        }
      },
      select: {
        id: true,
        title: true,
        videos: {
          where: {
            sequence: 1,
            isPremium: false,
          },
          select: {
            id: true,
            url: true,
            sequence: true,
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { postNum: 'asc' },
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