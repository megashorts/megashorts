import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { CategoryType } from "@prisma/client";
import BlogCard from "@/components/posts/BlogCard";
import NoticeSidebar from "@/components/NoticeSidebar";
import Image from "next/image";
import { Pin } from "lucide-react";


export const dynamic = 'force-static';
export const revalidate = false;
export const fetchCache = 'force-cache';

export default async function NoticeListPage() {
  // 공지사항 데이터
  const noticePosts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      categories: {
        has: CategoryType.NOTIFICATION
      }
    },
    include: {
      user: {
        select: {
          displayName: true
        }
      }
    },
    orderBy: [
      { featured: 'desc' },  // featured가 true인 항목이 먼저 오도록
      { createdAt: "desc" },
    ]
  });

  return (
    // gap-5
    <main className="flex w-full min-w-0">  
        <div className="w-full mb-16">
          {/* 상단 이미지 섹션 */}
          <div className="relative h-[70px] sm:h-[150px] md:h-[100px] mx-4 ">
            <Image
              src="/msBack_bootsV2.webp"
              alt="Notice list page header man image"
              fill
              priority
              className="object-cover rounded-sm"
              sizes="(max-width: 640px) 90vw, (max-width: 768px) 100vw, 90vw"
            />
            <div className="absolute inset-0 bg-black/50 flex items-end justify-start pl-4 pb-2 sm:pl-8 sm:pb-5">
              <h1 className="text-base md:text-2xl lg:text-2xl font-bold text-white">
                메가쇼츠 소식
              </h1>
            </div>
          </div>

          {/* 콘텐츠 섹션 */}
          <div className="w-full max-w-4xl mx-auto px-4 py-2">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="h-6">
                  <TableHead className="w-[120px]">게시일</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-[120px]">작성자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {noticePosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="text-muted-foreground text-xs">{format(post.createdAt, 'yyyy.MM.dd')}</TableCell>
                    <TableCell>
                      <Link href={`/notice/${post.id}`} className="hover:text-red-500">
                        {post.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground text-xs">
                      {post.featured && (
                        <Pin className="inline-block w-4 h-4 mr-1 text-red-500" />
                      )}
                      {post.user.displayName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 모바일 테이블 */}
          <div className="md:hidden">
            {noticePosts.map((post) => (
              <div key={post.id} className="border-b py-2">
                <Link href={`/notice/${post.id}`} className="block mt-2 hover:underline">
                  {post.title}
                </Link>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {format(post.createdAt, 'yyyy.MM.dd')}
                  </span>

                  <span>
                    {post.featured && (
                      <Pin className="inline-block w-4 h-4 mr-1 text-red-500" />
                    )}
                    {post.user.displayName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <NoticeSidebar />
    </main>
  );
}