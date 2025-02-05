import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Metadata, ResolvingMetadata } from "next";
import { CategoryType, Post, Prisma } from "@prisma/client";
import { ArrowLeft, ArrowRight, List } from "lucide-react";
import NoticeSidebar from "@/components/NoticeSidebar";
import { getThumbnailUrl } from "@/lib/constants";

type Props = {
    params: {
      postId: string;
    };
  };
  
  // 메타데이터 생성
  export async function generateMetadata(
    { params }: Props
  ): Promise<Metadata> {
    const resolvedParams = await Promise.resolve(params);
    const post = await prisma.post.findUnique({
      where: { id: resolvedParams.postId },
      select: { 
        title: true, 
        content: true,
        thumbnailId: true 
      },
    });
  
    if (!post) return { title: 'MS블로그' };
  
    return {
      title: post.title || 'MS블로그',
      description: post.content || '',
      openGraph: {
        title: post.title || 'MS블로그',
        description: post.content || '',
        images: post.thumbnailId ? [getThumbnailUrl(post.thumbnailId)] : [],
      },
    };
  }
  
  export async function generateStaticParams() {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        categories: {
          has: CategoryType.MSPOST
        }
      },
      select: { id: true },
    });
  
    return posts.map((post) => ({
      postId: post.id,
    }));
  }
  
  export default async function BlogPostPage({ params }: Props) {
    const resolvedParams = await Promise.resolve(params);
    
    // 현재 포스트 데이터 조회
    const post = await prisma.post.findUnique({
      where: { id: resolvedParams.postId },
      include: {
        user: {
          select: {
            displayName: true
          }
        }
      }
    });
  
    if (!post) {
      notFound();
    }
  
    // 이전/다음 포스트 조회
    const [prevPost, nextPost] = await Promise.all([
      prisma.post.findFirst({
        where: {
          status: 'PUBLISHED',
          categories: {
            has: CategoryType.MSPOST
          },
          createdAt: {
            lt: post.createdAt
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true
        }
      }),
      prisma.post.findFirst({
        where: {
          status: 'PUBLISHED',
          categories: {
            has: CategoryType.MSPOST
          },
          createdAt: {
            gt: post.createdAt
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          id: true
        }
      })
    ]);

  return (
    <main className="flex w-full min-w-0">  

        <div className="w-full mb-16">
          {/* 상단 이미지 섹션 */}
          <div className="relative h-[70px] sm:h-[150px] md:h-[100px] mx-4 ">
            <Image
              src="/msBack_layV2.webp"
              alt="Blog page header girl image"
              fill
              priority
              className="object-cover rounded-sm"
              sizes="(max-width: 640px) 90vw, (max-width: 768px) 100vw, 90vw"
            />
            <div className="absolute inset-0 bg-black/50 flex items-end justify-start pl-4 pb-2 sm:pl-8 sm:pb-5">
              <h1 className="text-base md:text-2xl lg:text-2xl font-bold text-white">
                MS 블로그
              </h1>
            </div>
          </div>

          {/* 콘텐츠 섹션 */}
          <div className="w-full max-w-4xl mx-auto px-4 py-2">
            {/* 상단 네비게이션 */}
            <div className="flex justify-between items-center mb-2">
              <Link 
                // href="/notice" 
                href="/notice" 
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <List className="w-6 h-6" />
              </Link>
              
              <div className="flex gap-4">
                {nextPost && (
                  <Link 
                    href={`/blog/${nextPost.id}`}
                    className="p-2 hover:bg-accent rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </Link>
                )}
                {prevPost && (
                  <Link 
                    href={`/blog/${prevPost.id}`}
                    className="p-2 hover:bg-accent rounded-full transition-colors"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </Link>
                )}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-full border-t border-red-500/50 mb-4" />

            {/* 포스트 제목 */}
            <h1 className="text-xl font-bold mb-2">
              {post.title}
            </h1>

            {/* 작성 정보 */}
            <div className="flex justify-start sm:justify-end items-center gap-2 sm:gap-3 text-xs text-muted-foreground mb-4">
              <span>{format(post.createdAt, 'yyyy.MM.dd')}</span>
              <span>{post.user.displayName}</span>
            </div>

            {/* 썸네일 이미지 */}
            {post.thumbnailId && (
              <div className="relative w-full aspect-[3/2] mb-4">
                <Image
                  src={getThumbnailUrl(post.thumbnailId, 'public')}
                  alt={`타이틀 ${post.title || ''} - ${post.categories || ''} 컨텐츠의 대표 이미지`}
                  className="object-cover rounded-lg"
                  priority
                  width={1200}         // 2배 증가
                  height={900}         // 2배 증가
                  quality={100}         // 최적의 품질
                  sizes="(max-width: 640px) 100vw, 
                        (max-width: 1024px) 100vw, 
                        1200px"       // 반응형 크기
                  loading="eager"      // 즉시 로딩
                />
              </div>
            )}

            {/* 포스트 내용 */}
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap font-sans text-base text-white">{post.content}</p>
            </div>
          </div>

        </div>

      <NoticeSidebar />
    </main>
  );
}
