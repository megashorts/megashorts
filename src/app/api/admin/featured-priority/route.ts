import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, featured, priority } = body;

    if (!id) {
      return Response.json({ error: "Post ID is required" }, { status: 400 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(typeof featured === 'boolean' && { featured }),
        ...(typeof priority === 'number' && { priority }),
      },
      select: {
        id: true,
        postNum: true,
        title: true,
        categories: true,
        featured: true,
        priority: true,
      }
    });

    return Response.json(post);
  } catch (error) {
    console.error('Failed to update post featured/priority:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
