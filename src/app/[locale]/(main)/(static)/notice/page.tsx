import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { CategoryType } from "@prisma/client";
import BlogCard from "@/components/posts/BlogCard";
import NoticeSidebar from "@/components/NoticeSidebar";
import { Pin } from "lucide-react";

export const dynamic = 'force-static';
export const revalidate = false;
export const fetchCache = 'force-cache';

export default async function NoticePage() {
  const totalNoticeCount = await prisma.post.count({
    where: {
      status: "PUBLISHED",
      categories: {
        has: CategoryType.NOTIFICATION
      }
    }
  });

  // 공지사항 데이터 (3개만)
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
      { createdAt: "desc" }
    ],
    take: 3,
  });

  // 블로그 데이터
  const blogPosts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      categories: {
        has: CategoryType.MSPOST
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
    ],
    take: 20,
  });

  return (
    <main className="flex w-full min-w-0">  
      <div className="w-full min-w-0 space-y-4 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        {/* 공지사항 섹션 */}
        <div className="space-y-1">
          <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
            <h1 className="text-center text-lg sm:text-2xl font-bold">📢 메가쇼츠 소식</h1>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:pl-4 pt-4">
            <div className="relative flex justify-between items-center w-full">
              <h3 className="text-xl font-bold text-white relative w-fit">
                공지사항
                <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[110%] translate-y-0.6"></span>
              </h3>
              {/* <Link 
                href="/notice/list" 
                className="absolute bottom-0 right-0 text-xs hover:text-red-500 sm:pr-4"
              >
                목록보기
              </Link> */}
            </div>
          </div>


          {/* 데스크탑 테이블 */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="h-6">
                  <TableHead className="w-[120px]">게시일</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-[120px] text-end">작성자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {noticePosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>{format(post.createdAt, 'yyyy.MM.dd')}</TableCell>
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
                {totalNoticeCount > 3 && (
                  <TableRow>
                    <TableCell></TableCell>
                    {/* <TableCell className="flex justify-between items-center"> */}
                    <TableCell className="py-2 flex justify-between items-end">
                      <span className="text-muted-foreground">...</span>
                    </TableCell>
                    <TableCell className="text-end">
                      <Link href="/notice/list" className="text-xs hover:text-red-500 text-end">
                        전체 목록보기
                      </Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 모바일 테이블 */}
          <div className="md:hidden">
            {noticePosts.map((post) => (
              <div 
                key={post.id} 
                className="border-b py-2 flex justify-between items-end"
              >
                <Link 
                  href={`/notice/${post.id}`} 
                  className="block hover:underline"
                >
                  {post.title}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {post.featured && (
                    <Pin className="inline-block w-4 h-4 mr-1 text-red-500" />
                  )}
                  {format(post.createdAt, 'yyyy.MM.dd')}
                </div>
              </div>
            ))}
            {totalNoticeCount > 3 && (
              <div className="border-b py-2 flex justify-between items-end">
                <span className="text-muted-foreground">...</span>
                <Link 
                  href="/notice/list" 
                  className="text-xs hover:text-red-500"
                >
                  전체 목록보기
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:pl-4 pt-3">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-xl font-bold text-white relative w-fit">
              MS블로그
              <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[110%] translate-y-0.6"></span>
            </h3>
          </div>
        </div>
        {/* MS블로그 섹션 */}

        <div className="space-y-0">
          {blogPosts.map((post) => (
            <div key={post.id} className="relative">

              <BlogCard post={post} />

              {/* {post.featured && (
                <Pin className="absolute left-[1.0rem] top-4 w-4 h-4 text-red-500" />
              )} */}
            </div>
          ))}
        </div>

      </div>
      <NoticeSidebar />
    </main>
  );
}

// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { format } from "date-fns";
// import Link from "next/link";
// import prisma from "@/lib/prisma";
// import { CategoryType } from "@prisma/client";
// import BlogCard from "@/components/posts/BlogCard";
// import NoticeSidebar from "@/components/NoticeSidebar";

// export const dynamic = 'force-static';
// export const revalidate = false;
// export const fetchCache = 'force-cache';

// export default async function NoticePage() {
//   // 공지사항 데이터
//   const noticePosts = await prisma.post.findMany({
//     where: {
//       status: "PUBLISHED",
//       categories: {
//         has: CategoryType.NOTIFICATION
//       }
//     },
//     include: {
//       user: {
//         select: {
//           displayName: true
//         }
//       }
//     },
//     orderBy: { createdAt: "desc" },
//   });

//   // 블로그 데이터
//   const blogPosts = await prisma.post.findMany({
//     where: {
//       status: "PUBLISHED",
//       categories: {
//         has: CategoryType.MSPOST
//       }
//     },
//     include: {
//       user: true
//     },
//     orderBy: { createdAt: "desc" },
//     take: 20,
//   });

//   return (
//     // gap-5
//     <main className="flex w-full min-w-0">  
//       <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
//         <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
//           <h1 className="text-center text-lg sm:text-2xl font-bold">📢 메가쇼츠 소식</h1>
//         </div>
//         <div className="w-full space-y-4">
//           <Tabs defaultValue="notice" className="w-full">
//             <TabsList className="grid w-full grid-cols-2">
//               <TabsTrigger value="notice">안내</TabsTrigger>
//               <TabsTrigger value="blog">블로그</TabsTrigger>
//             </TabsList>

//             {/* 안내 탭 */}
//             <TabsContent value="notice">
//               {/* 데스크탑 테이블 */}
//               <div className="hidden md:block">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="h-6">
//                       <TableHead className="w-[120px]">게시일</TableHead>
//                       <TableHead>제목</TableHead>
//                       <TableHead className="w-[120px]">작성자</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {noticePosts.map((post) => (
//                       <TableRow key={post.id}>
//                         <TableCell>{format(post.createdAt, 'yyyy.MM.dd')}</TableCell>
//                         <TableCell>
//                           <Link href={`/notice/${post.id}`} className="hover:text-red-500">
//                             {post.title}
//                           </Link>
//                         </TableCell>
//                         <TableCell>{post.user.displayName}</TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>

//               {/* 모바일 테이블 */}
//               <div className="md:hidden">
//                 {noticePosts.map((post) => (
//                   <div key={post.id} className="border-b py-2">
//                     <Link href={`/notice/${post.id}`} className="block mt-2 hover:underline">
//                       {post.title}
//                     </Link>
//                     <div className="flex justify-between text-xs text-muted-foreground">
//                       <span>{format(post.createdAt, 'yyyy.MM.dd')}</span>
//                       <span>{post.user.displayName}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </TabsContent>

//             {/* 블로그 탭 */}
//             <TabsContent value="blog" className="space-y-0">
//               {blogPosts.map((post) => (
//                 <BlogCard key={post.id} post={post} />
//               ))}
//             </TabsContent>
//           </Tabs>
//         </div>
//       </div>
//       <NoticeSidebar />
//     </main>
//   );
// }