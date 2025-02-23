import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { CategoryType } from "@prisma/client";

const postSelect = {
  id: true,
  postNum: true,
  title: true,
  categories: true,
  featured: true,
  priority: true,
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const term = searchParams.get('term');
    const ids = searchParams.get('ids')?.split(',');

    // ID로 검색
    if (ids?.length) {
      const posts = await prisma.post.findMany({
        where: {
          id: { in: ids },
          status: 'PUBLISHED',
          NOT: {
            categories: {
              hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
            }
          }
        },
        select: postSelect,
        orderBy: [
          { featured: 'desc' },
          { priority: 'desc' },
          { publishedAt: 'desc' }
        ]
      });
      return Response.json(posts);
    }

    // 검색어로 검색
    if (term) {
      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { postNum: parseInt(term) || undefined },
            { title: { contains: term } }
          ],
          status: 'PUBLISHED',
          NOT: {
            categories: {
              hasSome: [CategoryType.MSPOST, CategoryType.NOTIFICATION]
            }
          }
        },
        select: postSelect,
        orderBy: [
          { featured: 'desc' },
          { priority: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: 20
      });
      return Response.json(posts);
    }

    return Response.json([]);
  } catch (error) {
    console.error('Failed to search posts:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
