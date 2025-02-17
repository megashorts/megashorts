import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const status = req.nextUrl.searchParams.get("status") || "PUBLISHED";  // status 파라미터 추가
    const isMobile = req.nextUrl.searchParams.get("isMobile") === "true";

    // 화면 크기에 따른 페이지 크기 설정
    const pageSize = isMobile ? 12 : 20;  // 모바일: 12개, 데스크톱: 20개

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: {
        userId: user.id,  // 자신의 포스트만 조회
        status: status as "PUBLISHED" | "DRAFT",  // status로 필터링
      },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    if (!posts || posts.length === 0) {
      return Response.json({ posts: [], nextCursor: null }, { status: 200 });
    }
    
    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// import { validateRequest } from '@/lib/auth';
// import prisma from "@/lib/prisma";
// import { getPostDataInclude, PostsPage } from "@/lib/types";
// import { NextRequest } from "next/server";

// export async function GET(req: NextRequest) {
//   try {
//     const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

//     const pageSize = 10;

//     const { user } = await validateRequest();

//     if (!user) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const posts = await prisma.post.findMany({
//       include: getPostDataInclude(user.id),
//       orderBy: { createdAt: "desc" },
//       take: pageSize + 1,
//       cursor: cursor ? { id: cursor } : undefined,
//     });

//     // 데이터가 존재하는지 확인
//     if (!posts || posts.length === 0) {
//       return Response.json({ posts: [], nextCursor: null }, { status: 200 });
//     }
    
//     const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

//     const data: PostsPage = {
//       posts: posts.slice(0, pageSize),
//       nextCursor,
//     };

//     return Response.json(data);
//   } catch (error) {
//     console.error("Error fetching posts:", error);
//     return Response.json({ error: "Internal server error" }, { status: 500 });
//   }
// }
