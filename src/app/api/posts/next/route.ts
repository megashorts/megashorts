// 추천비디오용

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const afterId = searchParams.get('after');

  if (!afterId) {
    return NextResponse.json({ error: 'Missing afterId parameter' }, { status: 400 });
  }

  // 현재 포스트 이후의 포스트들을 가져옴
  const nextPosts = await prisma.post.findMany({
    where: {
      id: {
        gt: afterId
      },
      videos: {
        some: {
          sequence: 1
        }
      }
    },
    select: {
      id: true,
      title: true,
      videos: {
        where: {
          sequence: 1
        },
        select: {
          id: true,
          url: true,
          sequence: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 3  // 다음 3개 포스트
  });

  // 다음 포스트가 없으면 처음부터 다시 시작
  if (nextPosts.length === 0) {
    const firstPosts = await prisma.post.findMany({
      where: {
        videos: {
          some: {
            sequence: 1
          }
        }
      },
      select: {
        id: true,
        title: true,
        videos: {
          where: {
            sequence: 1
          },
          select: {
            id: true,
            url: true,
            sequence: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3  // 처음 3개 포스트
    });

    return NextResponse.json(firstPosts);
  }

  return NextResponse.json(nextPosts);
}