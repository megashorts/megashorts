import { NextRequest } from "next/server";
import { CategoryType, PostStatus } from "@prisma/client";  // PostStatus 추가
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const category = req.nextUrl.searchParams.get("category");
    const isMobile = req.nextUrl.searchParams.get("isMobile") === "true";
    
    const pageSize = isMobile ? 12 : 20;

    // PostStatus enum 사용
    const where = {
      status: PostStatus.PUBLISHED,
      ...(category ? {
        categories: {
          has: category.toUpperCase() as CategoryType
        }
      } : {})
    };

    const posts = await prisma.post.findMany({
      where,
      include: getPostDataInclude(""),
      orderBy: { 
        createdAt: "desc"
      },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    if (!posts || posts.length === 0) {
      return Response.json({
        posts: [],
        nextCursor: null
      } satisfies PostsPage, { status: 200 });
    }
    
    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const response: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// import { NextRequest } from "next/server";
// import { CategoryType } from "@prisma/client";
// import prisma from "@/lib/prisma";
// import { getPostDataInclude, PostsPage } from "@/lib/types";

// export async function GET(req: NextRequest) {
//   try {
//     const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
//     console.log('[API] Received request for cursor:', cursor);
//     const category = req.nextUrl.searchParams.get("category");
//     const isMobile = req.nextUrl.searchParams.get("isMobile") === "true";
    
//     const pageSize = isMobile ? 12 : 20;

//     if (!category) {
//       return Response.json({ error: "Category is required" }, { status: 400 });
//     }

//     const categoryEnum = category.toUpperCase() as CategoryType;  // 대문자로 변환하고 CategoryType으로 캐스팅

//     const posts = await prisma.post.findMany({
//       where: {
//         categories: {
//           has: categoryEnum  // CategoryType enum 사용
//         },
//         status: "PUBLISHED",
//       },
//       include: getPostDataInclude(""),
//       orderBy: { 
//         createdAt: "desc"
//       },
//       take: pageSize + 1,
//       cursor: cursor ? { id: cursor } : undefined,
//     });

//     if (!posts || posts.length === 0) {
//       return Response.json({
//         posts: [],
//         nextCursor: null
//       } satisfies PostsPage, { status: 200 });
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