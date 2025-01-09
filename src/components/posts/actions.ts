"use server";

import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";

export async function deletePost(id: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) throw new Error("Post not found");
  if (post.userId !== user.id) throw new Error("Unauthorized");

  const deletedPost = await prisma.$transaction(async (tx) => {
    // 1. 포스트 삭제 (cascade로 비디오도 자동 삭제)
    const deleted = await tx.post.delete({
      where: { id },
      include: getPostDataInclude(user.id),
    });

    // 2. 사용자의 postCount 감소 (atomic 연산)
    await tx.user.update({
      where: { id: user.id },
      data: {
        postCount: {
          decrement: 1
        }
      }
    });

    return deleted;
  });

  return deletedPost;
}

// export async function deletePost(id: string) {
//   const { user } = await validateRequest();

//   if (!user) throw new Error("Unauthorized");

//   const post = await prisma.post.findUnique({
//     where: { id },
//   });

//   if (!post) throw new Error("Post not found");

//   if (post.userId !== user.id) throw new Error("Unauthorized");

//   const deletedPost = await prisma.post.delete({
//     where: { id },
//     include: getPostDataInclude(user.id),
//   });

//   return deletedPost;
// }
