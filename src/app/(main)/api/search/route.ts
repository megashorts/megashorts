
import prisma from '@/lib/prisma';
import { getPostDataInclude, PostsPage } from '@/lib/types';
import { NextRequest } from 'next/server';



export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let q = searchParams.get("q") || "";
    const cursor = searchParams.get("cursor") || undefined;
    const pageSize = 20;  // Categories와 동일하게 20개로 설정

    // URL 디코딩
    try {
      q = decodeURIComponent(q);
    } catch (e) {
      console.error('Decoding error:', e);
    }

    // 검색어 처리 개선
    const searchTerms = q.split(/\s+/).filter(Boolean);
    const searchQuery = searchTerms.join(' | '); // OR 검색
    const containsQuery = q.replace(/\s+/g, ''); // 공백 제거 버전

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          // 제목 검색 (search 연산자)
          {
            title: {
              search: searchQuery,
            },
          },
          // 제목 검색 (공백 무시 contains)
          {
            title: {
              contains: containsQuery,
              mode: 'insensitive'
            },
          },
          // 내용 검색
          {
            content: {
              search: searchQuery,
            },
          },
          // 작성자 이름 검색
          {
            user: {
              displayName: {
                search: searchQuery,
              },
            },
          },
          // 작성자 아이디 검색
          {
            user: {
              username: {
                search: searchQuery,
              },
            },
          },
        ],
        status: 'PUBLISHED',
      },
      include: getPostDataInclude(''),
      orderBy: [
        // 검색 관련도순으로 정렬 후 최신순
        {
          _relevance: {
            fields: ['title', 'content'],
            search: searchQuery,
            sort: 'desc',
          },
        },
        {
          createdAt: 'desc',
        },
      ],
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// import { validateRequest } from '@/auth';
// import prisma from "@/lib/prisma";
// import { getPostDataInclude, PostsPage } from "@/lib/types";
// import { NextRequest } from "next/server";

// export async function GET(req: NextRequest) {
//   try {
//     const q = req.nextUrl.searchParams.get("q") || "";
//     const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

//     const searchQuery = q.split(" ").join(" & ");

//     const pageSize = 10;

//     const { user } = await validateRequest();

//     if (!user) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const posts = await prisma.post.findMany({
//       where: {
//         OR: [
//           {
//             content: {
//               search: searchQuery,
//             },
//           },
//           {
//             user: {
//               displayName: {
//                 search: searchQuery,
//               },
//             },
//           },
//           {
//             user: {
//               username: {
//                 search: searchQuery,
//               },
//             },
//           },
//         ],
//       },
//       include: getPostDataInclude(user.id),
//       orderBy: { createdAt: "desc" },
//       take: pageSize + 1,
//       cursor: cursor ? { id: cursor } : undefined,
//     });

//     const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

//     const data: PostsPage = {
//       posts: posts.slice(0, pageSize),
//       nextCursor,
//     };

//     return Response.json(data);
//   } catch (error) {
//     console.error(error);
//     return Response.json({ error: "Internal server error" }, { status: 500 });
//   }
// }
