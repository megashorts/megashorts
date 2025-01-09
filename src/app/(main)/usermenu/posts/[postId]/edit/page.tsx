import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from "next/navigation";
import { PostEditor } from '@/components/posts/editor/PostEditor';
import { getPostDataInclude } from '@/lib/types';  // getPostDataSelect → getPostDataInclude
import { Suspense } from 'react';
import NoticeSidebar from '@/components/NoticeSidebar';

interface PageProps {
  params: { postId: string };
}

export default async function EditPostPage({ params }: PageProps) {
  const { user } = await validateRequest();
  if (!user) {
    redirect("/login");
  }

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    include: getPostDataInclude(user.id)
  });

  if (!post || post.user.id !== user.id) {
    notFound();
  }

  // 데이터 구조 확인을 위한 콘솔 로그
  console.log('Post data:', {
    id: post.id,
    videos: post.videos.map(v => ({
      id: v.id,
      filename: v.filename,
      subtitle: v.subtitle  // 자막 데이터 확인
    }))
  });

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="container py-6">
          <h1 className="text-2xl font-bold mb-6">포스트 수정</h1>
          <PostEditor initialData={post} />
        </div>
      </div>
      <NoticeSidebar />
    </div>
  );
}