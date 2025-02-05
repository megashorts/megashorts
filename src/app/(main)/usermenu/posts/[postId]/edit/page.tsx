import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from "next/navigation";
import { PostEditor } from '@/components/posts/editor/PostEditor';
import { getPostDataInclude } from '@/lib/types';
import { Suspense } from 'react';
import NoticeSidebar from '@/components/NoticeSidebar';
import { USER_ROLE } from '@/lib/constants';

interface PageProps {
  params: { postId: string };
}

export default async function EditPostPage({ params }: PageProps) {
  const { user } = await validateRequest();
  if (!user) {
    redirect("/login");
  }

  // params를 await로 감싸서 사용
  const { postId } = await Promise.resolve(params);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: getPostDataInclude(user.id)
  });

  // if (!post || post.user.id !== user.id) {
  //   notFound();
  // }

  // 자신의 포스트이거나 운영팀 이상의 권한을 가진 경우에만 수정 가능
  if (!post || (post.user.id !== user.id && user.userRole < USER_ROLE.OPERATION3)) {
    notFound();
  }

  // 데이터 구조 확인을 위한 콘솔 로그
  console.log('Post data:', {
    id: post.id,
    videos: post.videos.map(v => ({
      id: v.id,
      filename: v.filename,
      subtitle: v.subtitle
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