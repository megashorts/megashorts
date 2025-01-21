
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import VideoSection from "@/components/videos/VideoSection";
import PostMoreButton from "@/components/posts/PostMoreButton";
import { getCategoryName } from "@/lib/constants";
import LanguageFlag from "@/components/LanguageFlag";
import PublicActions from "@/components/posts/PublicActions";
import UserActions from "@/components/posts/UserActions";
import { Metadata, ResolvingMetadata } from 'next';
import { getUserDataSelect } from "@/lib/types";
import ReportDialog from "@/components/posts/ReportDialog";
import { InquiryType } from "@prisma/client";
import { Language } from "@prisma/client";

type PageParams = {
  postId: string;
};

type PageSearchParams = {
  [key: string]: string | string[] | undefined;
};
type Props = {
  params: PageParams;
  searchParams: PageSearchParams;
};

// 정적 페이지 생성 설정
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await prisma.post.findUnique({
    where: { id: resolvedParams.postId },
    select: { 
      title: true, 
      content: true,
      thumbnailUrl: true,
      user: {
        select: {
          displayName: true
        }
      }
    },
  });

  const title = post?.title || '게시물';
  const description = post?.content?.slice(0, 200) || '';  // 설명 길이 제한
  const image = post?.thumbnailUrl || '/post-placeholder.jpg';

  // 플랫폼별 site name
  const siteNames = {
    default: 'MEGASHORTS',
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: siteNames.default,
      locale: 'ko_KR',
      type: 'article',
      images: [
        {
          url: image,
          // 세로형 썸네일 그대로 사용
          // 각 플랫폼이 자체적으로 이미지를 크롭하거나 조정할 것임
          alt: title,
        },
      ],
    },
    // 트위터 카드 설정 유지
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      site: '@msmaking',  // 트위터 계정이 있다면 추가
    },
    // 플랫폼별 추가 메타 태그
    other: {
      // 카카오톡
      // 'og:site_name': siteNames.kakao,
      // 'og:locale': 'ko_KR',
      // 페이스북
      // 'fb:app_id': process.env.FACEBOOK_APP_ID,  // 페이스북 앱 ID가 있다면
      // 기타 메신저들은 기본 og 태그 사용
    },
  };
}

// export const dynamic = 'error';
// export const dynamicParams = true;

// 포스트 작업 시에만 재생성되도록 설정
export const revalidate = false;

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    select: { id: true },
    where: {
      status: 'PUBLISHED'
    }
  });

  return posts.map((post) => ({
    postId: post.id,
  }));
}

export default async function PostPage({ params }: Props) {
  const resolvedParams = await params;
  console.log(`[Server] Rendering post page: ${resolvedParams.postId}`, new Date().toISOString());
  
  // const currentUser = user ? await prisma.user.findUnique({
  //   where: { id: user.id },
  //   select: { userRole: true }
  // }) : null;

  const postData = await prisma.post.findUnique({
    where: { id: resolvedParams.postId },
    include: {
      user: {
        select: getUserDataSelect(""),
      },
      likes: {
        select: {
          userId: true
        }
      },
      bookmarks: {
        select: {
          userId: true
        }
      },
      videos: {
        include: {
          views: true,
        },
        orderBy: {
          sequence: 'asc'
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      }
    }, 
  });

  if (!postData) {
    notFound();
  }

  const post = postData;

  // const hasEditPermission = Boolean(
  //   currentUser && (
  //     post.userId === user?.id || 
  //     isAdmin(currentUser.userRole)
  //   )
  // );

  return (
    <div className="w-full grow gap-2 pt-1 sm:pt-5">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-0">  {/* 네비바와 동일한 여백 */}
        <div className="w-[100%] mx-auto border-t border-red-700/70 mt-2 mb-4"></div>
        {/* 데스크탑 레이아웃 */}
        <div className="hidden md:block">
          {/* 썸네일과 정보 영역 */}
          <div className="flex gap-6 scale-70 origin-top">  {/* 기존 크기의 70% */}
            {/* 썸네일 */}
            <div className="w-[30%]">
              <div className="relative w-full aspect-[2/3]">
                <Image
                  src={post.thumbnailUrl || '/post-placeholder.jpg'}
                  alt={post.title || '포스트 썸네일'}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 30vw, 30vw"  // 컨테이너가 30%
                  className="object-cover rounded-lg"
                  priority
                />
              </div>
            </div>

            {/* 정보 영역 */}
            <div className="flex-1 p-4 rounded-lg flex flex-col">
              {/* 타이틀과 컨텐츠를 정보영역 상단에 */}
              <h1 className="text-2xl font-bold mb-2 flex items-end">{post.title}              
                {post.titleOriginal && post.titleOriginal !== post.title && (
                <span className="block text-base text-muted-foreground text-end ml-2 self-end">( {post.titleOriginal} )</span>
                )}
              </h1>
              <p className="text-gray-300 text-base font-sans text-muted-foreground whitespace-pre-wrap mb-4">{post.content}</p>

              {/* 구분선 */}
              <div className="w-[100%] mx-auto border-t border-white/15 mt-1 mb-6"></div>

              {/* 액션 버튼 영역 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <PublicActions post={post} />
                  {/* {user && (
                    <>
                      <UserActions post={post} userId={user.id} />
                    </>
                  )} */}
                  <UserActions post={post} />
                </div>
                {/* {user && hasEditPermission && (
                  <div>
                    <PostMoreButton post={post} />
                  </div>
                )} */}
                <PostMoreButton post={post} />
              </div>
              {/* 정보 내용 */}
              <div className="space-y-3 text-sm text-white/90 flex-grow">
                {/* 원작 타이틀 */}
                {/* {post.titleOriginal && post.titleOriginal !== post.title && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">원작 타이틀 </span>
                    <span>{post.titleOriginal}</span>
                  </div>
                )} */}  

                <div>
                  <p className="text-white/70">
                    No.{post.postNum} - @{post.user.displayName}
                  </p>
                </div>

                {/* 영상 언어 */}
                {post.videos?.[0] && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">영상 언어 </span>
                    <LanguageFlag language={post.postLanguage} />
                  </div>
                )}

                {/* 자막 지원 */}
                {post.videos?.[0]?.subtitle?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">자막 지원 </span>
                    <div className="flex gap-1">
                      {post.videos[0].subtitle.map((lang: Language) => (
                        <LanguageFlag key={lang} language={lang} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 연령 제한 */}
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-14 h-9 rounded-md border border-white font-bold text-sm text-white ${
                      post.ageLimit === 18 ? "bg-red-700" : "bg-blue-700"
                    }`}>
                    {post.ageLimit === 0 ? "전체" : `${post.ageLimit} +`}
                  </div>
                  <span className="text-sm text-gray-300">
                    {/* {post.videos?.length || 0}개의 동영상 */}
                    {post.videos?.length || 0}개의 동영상
                  </span>
                </div>

                {/* 카테고리 */}
                <div className="flex flex-wrap gap-2">
                  {post.categories?.map((category) => (
                    <span
                      key={category}
                      className="flex items-center py-2 text-muted-foreground text-sm"
                    >
                      #{getCategoryName(category)}
                    </span>
                  ))}
                </div>
              </div>

              <ReportDialog 
                type={InquiryType.REPORT}
                postId={post.id}
                postTitle={post.title || undefined}  // null을 undefined로 변환
                title="신고하기"
              />
              
            </div>
          </div>
        </div>

        {/* 모바일 레이아웃 */}
        <div className="md:hidden">
            {/* 타이틀과 컨텐츠를 최상단에 */}
            <div className="mb-4">
              {/* <h1 className="text-2xl font-bold mb-2">{post.title}</h1> */}
              <h1 className="text-2xl font-bold mb-2 flex items-end">{post.title}              
                {post.titleOriginal && post.titleOriginal !== post.title && (
                <span className="block text-base text-muted-foreground text-end ml-2 self-end">( {post.titleOriginal} )</span>
                )}
              </h1>
            </div>

            {/* 액션 버튼 영역 */}
            <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <PublicActions post={post} />
                  <UserActions post={post} />
            </div>
            <PostMoreButton post={post} />
          </div>
          
          <div className="w-[95%] mx-auto border-t border-white/15 mt-1 mb-6"></div>

          {/* 썸네일과 정보 영역 */}
          <div className="flex gap-1">
            {/* 썸네일 50% */}
            <div className="w-1/2">
              <div className="relative aspect-[2/3]">
                <Image
                  src={post.thumbnailUrl || '/post-placeholder.jpg'}
                  alt={post.title || '포스트 썸네일'}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 30vw"  // 모바일에서 50%
                  className="object-cover rounded-lg"
                  priority
                />
              </div>
            </div>

            {/* 정보 영역 50% */}
            <div className="w-1/2 pl-4 pr-4 rounded-lg flex flex-col">
              <div className="space-y-2 text-sm text-white/90 flex-grow">

                <div className="flex items-center gap-2">
                  <span className="text-white/70">
                    @{post.user.displayName}
                  </span>
                </div>

                {/* 원작 타이틀 */}
                {/* {post.titleOriginal && post.titleOriginal !== post.title && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">원작</span>
                    <span>{post.titleOriginal}</span>
                  </div>
                )} */}

                {/* 영상 언어 */}
                {post.videos?.[0] && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">언어 </span>
                    <LanguageFlag language={post.postLanguage} />
                  </div>
                )}

                {/* 자막 지원 */}
                {post.videos?.[0]?.subtitle?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">자막 </span>
                    <div className="flex gap-1">
                      {post.videos[0].subtitle.map((lang: Language) => (
                        <LanguageFlag key={lang} language={lang} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 연령 제한 */}
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-12 h-7 rounded-sm border border-white font-bold text-sm text-white ${
                      post.ageLimit === 18 ? "bg-red-700" : "bg-blue-700"
                    }`}>
                    {post.ageLimit === 0 ? "전체" : `${post.ageLimit} +`}
                  </div>
                  <span className="text-xs text-gray-300">
                    {post.videos?.length || 0}개의 동영상
                  </span>
                </div>

                {/* 카테고리 */}
                <div className="flex flex-wrap gap-2">
                  {post.categories?.map((category) => (
                    <span
                      key={category}
                      className="flex items-center py-2 rounded-sm text-muted-foreground text-xs"
                    >
                      #{getCategoryName(category)}
                    </span>
                  ))}
                </div>
              </div>

              {/* 신고하기 버튼 */}
              {/* <div className="mt-4">
                <ReportButton />
              </div> */}

              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm">
                  No.{post.postNum} 
                </span>
                <ReportDialog 
                  type={InquiryType.REPORT}
                  postId={post.id}
                  postTitle={post.title || undefined}  // null을 undefined로 변환
                  title="신고하기"
                />
              </div>

            </div>
          </div>
          <p className="text-gray-300 text-mase font-sans text-muted-foreground whitespace-pre-wrap mt-4 mb-4">{post.content}</p>
        </div>

        

        {/* 비디오 섹션 */}
        {post.videos.length > 0 && (
          <div className="mt-4">
            <VideoSection 
              videos={post.videos}
              postId={post.id}  // postId 전달
            />
          </div>
        )}
      </div>
    </div>
  );
}