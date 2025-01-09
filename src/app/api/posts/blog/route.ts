import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CategoryType } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      categories: {
        has: CategoryType.MSPOST
      }
    },
    include: {
      user: true
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const nextCursor = posts.length === 20 ? posts[posts.length - 1].id : null;

  return NextResponse.json({
    posts,
    nextCursor,
  });
}