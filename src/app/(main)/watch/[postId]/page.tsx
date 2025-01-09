import { notFound } from "next/navigation";
import WatchPageClient from "./WatchPageClient";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export default async function WatchPage({ 
  params,
  searchParams 
}: { 
  params: { postId: string };
  searchParams: { sequence?: string };
}) {
  const [authResult, resolvedParams, resolvedSearchParams] = await Promise.all([
    validateRequest(),
    Promise.resolve(params),
    Promise.resolve(searchParams)
  ]);

  // WatchPageClient가 전체 User 타입을 기대하므로 모든 필드를 가져옴
  const user = authResult.user ? await prisma.user.findUnique({
    where: { id: authResult.user.id }
  }) : null;

  const postId = resolvedParams.postId;
  const currentSequence = Number(resolvedSearchParams.sequence) || 1;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {  // select 대신 include 사용
      videos: {
        orderBy: {
          sequence: 'asc'
        }
      },
      likes: {
        where: user ? { userId: user.id } : undefined,
      },
      bookmarks: {
        where: user ? { userId: user.id } : undefined,
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });

  if (!post || post.videos.length === 0) {
    notFound();
  }

  // 현재 비디오 인덱스 찾기
  const currentIndex = post.videos.findIndex(v => v.sequence === currentSequence);
  const validIndex = currentIndex === -1 ? 0 : currentIndex;

  // 이전/다음 비디오 확인
  const hasNextVideo = validIndex < post.videos.length - 1;
  const hasPrevVideo = validIndex > 0;

  return (
    <WatchPageClient
      video={post.videos[validIndex]}
      post={post}  // 전체 post 객체 전달
      user={user}  // validateRequest에서 반환된 user 그대로 전달
      postId={post.id}
      postTitle={post.title || ''}
      postContent={post.content || ''}
      isBookmarked={post.bookmarks.length > 0}
      isLiked={post.likes.length > 0}
      likeCount={post._count.likes}
      showControls={!!user}
      hasNextVideo={hasNextVideo}
      hasPrevVideo={hasPrevVideo}
      nextVideoId={hasNextVideo ? post.videos[validIndex + 1].id : undefined}
      prevVideoId={hasPrevVideo ? post.videos[validIndex - 1].id : undefined}
      totalVideos={post.videos.length}
    />
  );
}

// import { notFound } from "next/navigation";
// import WatchPageClient from "./WatchPageClient";
// import { validateRequest } from "@/auth";
// import prisma from "@/lib/prisma";

// // force-static은 제거 (동적 데이터 필요)
// // export const dynamic = 'force-dynamic';
// export const revalidate = 0;

// interface PageProps {
//   params: { postId: string };
//   searchParams: { sequence?: string };
// }

// export default async function WatchPage({ params, searchParams }: PageProps) {
//   const { user } = await validateRequest();
//   const [resolvedParams, resolvedSearchParams] = await Promise.all([
//     Promise.resolve(params),
//     Promise.resolve(searchParams)
//   ]);

//   const postId = resolvedParams.postId;
//   const currentSequence = Number(resolvedSearchParams.sequence) || 1;

//   const post = await prisma.post.findUnique({
//     where: { id: postId },
//     select: {
//       id: true,
//       title: true,     // title 추가
//       content: true,   // content 추가
//       videos: {
//         orderBy: {
//           sequence: 'asc'
//         }
//       },
//       likes: {
//         where: user ? { userId: user.id } : undefined,
//       },
//       bookmarks: {
//         where: user ? { userId: user.id } : undefined,
//       },
//       _count: {
//         select: {
//           likes: true,
//         },
//       },
//     },
//   });

//   if (!post || post.videos.length === 0) {
//     notFound();
//   }

//   // 현재 비디오 인덱스 찾기
//   const currentIndex = post.videos.findIndex(v => v.sequence === currentSequence);
//   const validIndex = currentIndex === -1 ? 0 : currentIndex;

//   // 이전/다음 비디오 확인
//   const hasNextVideo = validIndex < post.videos.length - 1;
//   const hasPrevVideo = validIndex > 0;

//   return (
//     <WatchPageClient
//       video={post.videos[validIndex]}
//       postId={post.id}
//       postTitle={post.title || ''}    // title 전달
//       postContent={post.content || ''} // content 전달
//       isBookmarked={post.bookmarks.length > 0}
//       isLiked={post.likes.length > 0}
//       likeCount={post._count.likes}
//       showControls={!!user}
//       hasNextVideo={hasNextVideo}
//       hasPrevVideo={hasPrevVideo}
//       nextVideoId={hasNextVideo ? post.videos[validIndex + 1].id : undefined}
//       prevVideoId={hasPrevVideo ? post.videos[validIndex - 1].id : undefined}
//     />
//   );
// }