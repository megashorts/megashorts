"use client";

import { 
  Boxes,
  Building, 
  Megaphone, 
  WalletCards 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import UserWelcome from "@/components/UserWelcome";
import AuthMenuItems from "@/components/AuthMenuItems";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const pathname = usePathname();
  
  // 특정 경로에서는 메뉴바를 숨김
  if (pathname === "/" || pathname.startsWith("/posts") || pathname.startsWith("/video")) {
    return null;
  }

  return (
    <div className={`hidden md:flex flex-col ${className}`}>
      <UserWelcome />

      <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">메가쇼츠 안내</div>
      
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/subscription">
          <WalletCards />
          <span className="hidden lg:inline">구독/코인</span>
        </Link>
      </Button>

      {/* <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/notifications">
          <Megaphone />
          <span className="hidden lg:inline">공지사항</span>
        </Link>
      </Button> */}

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/notice">
          <Megaphone />
          <span className="hidden lg:inline">안내 & 블로그</span>
        </Link>
      </Button>

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/company/introduce">
          <Building />
          <span className="hidden lg:inline">MS소개</span>
        </Link>
      </Button>

      <AuthMenuItems />

      <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">분류별 바로보기</div>
      <div className="flex items-center justify-start gap-3 text-sm ml-4 py-2">
        <Boxes className="justify-start hidden lg:inline"/>
        <span className="hidden lg:inline">카테고리</span>
      </div>
      <div className="justify-start gap-3 hidden lg:inline">
        {[
          { href: "/categories/recent", label: "최신작" },
          { href: "/categories/ROMANCE", label: "로맨스" },
          { href: "/categories/ACTION", label: "액션" },
          { href: "/categories/THRILLER", label: "스릴러" },
          { href: "/categories/DRAMA", label: "드라마" },
          { href: "/categories/PERIOD", label: "시대극" },
          { href: "/categories/FANTASY", label: "판타지" },
          { href: "/categories/HIGHTEEN", label: "하이틴" },
          { href: "/categories/ADULT", label: "성인" }
        ].map((category) => (
          <Button
            key={category.href}
            variant="ghost"
            className="flex items-center justify-start gap-3 h-11 text-sm"
            asChild
          >
            <Link href={category.href}>
              <span>🔻 {category.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

// import { 
//   Boxes,
//   Building, 
//   FolderOpen, 
//   Home,
//   Megaphone, 
//   NotebookPen, 
//   PencilRuler, 
//   SeparatorVertical, 
//   TvMinimalPlay, 
//   UserIcon, 
//   Users, 
//   WalletCards 
// } from "lucide-react";
// import Link from "next/link";
// import NotificationsButton from "./NotificationsButton";
// import { validateRequest } from "@/lib/auth";
// import prisma from "@/lib/prisma";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { USER_ROLES } from "@/lib/roleType";

// interface MenuBarProps {
//   className?: string;
// }

// export default async function MenuBar({ className }: MenuBarProps) {
//   const { user } = await validateRequest();

//   const unreadNotificationsCount = user
//     ? await prisma.notification.count({
//         where: {
//           recipientId: user.id,
//           read: false,
//         },
//       })
//     : 0;

//   return (
//     <div className={`hidden md:flex flex-col ${className}`}>
//           <div className="relative items-center justify-start gap-5 hidden lg:inline space-y-3 mt-5 hidden lg:inline">
//             <div className="text-start ml-5 pb-3">
//               <span className="hidden lg:inline">반가워요!</span>
//               <br />
//               {user && (
//               <span className="hidden lg:inline">@{user.username}님.</span>
//               )}
//             </div>
//             <hr className="mx-auto border-t border-gray-600 pb-4 ml-4 mr-4 " />
//           </div>    

//       {/* 알림 버튼 - 기존 기능 유지 */}
//       {user && (
//         <>
//           <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">사용자 정보</div>
//           <Button
//             variant="ghost"
//             className="flex items-center justify-start gap-3"
//             asChild
//           >
//             <Link href={`/usermenu/users/${user.username}`}>
//               <Users />
//               <span className="hidden lg:inline">나의 정보</span>
//             </Link>
//           </Button>
//           </>
//       )}

//           <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">메가쇼츠 안내</div>
//           {/* 구독 및 코인 */}
//           <Button
//             variant="ghost"
//             className="flex items-center justify-start gap-3"
//             asChild
//           >
//             <Link href="/subscription">
//               <WalletCards />
//               <span className="hidden lg:inline">구독/코인</span>
//             </Link>
//           </Button>

//           {/* 공지사항 */}
//           <Button
//             variant="ghost"
//             className="flex items-center justify-start gap-3"
//             asChild
//           >
//             <Link href="/notifications">
//               <Megaphone />
//               <span className="hidden lg:inline">공지사항</span>
//             </Link>
//           </Button>

//           <NotificationsButton
//             initialState={{ unreadCount: unreadNotificationsCount }}
//           />

//           {/* MS소개 */}
//           <Button
//             variant="ghost"
//             className="flex items-center justify-start gap-3"
//             asChild
//           >
//             <Link href="/usermenu/company">
//               <Building />
//               <span className="hidden lg:inline">MS소개</span>
//             </Link>
//           </Button>

//       {user && (
//         <>
//           <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">크리에이터</div>
//           {/* 컨텐츠 등록 */}
//           <Button
//             variant="ghost"
//             className="flex items-center justify-start gap-3"
//             asChild
//           >
//             <Link href="/usermenu/postnew">
//               <NotebookPen />
//               <span className="hidden lg:inline">컨텐츠 등록</span>
//             </Link>
//           </Button>

//           {/* 컨텐츠 관리 */}
//           <Button
//             variant="ghost"
//             className="flex items-center justify-start gap-3"
//             asChild
//           >
//             <Link href="/usermenu/yourposts">
//               <FolderOpen />
//               <span className="hidden lg:inline">컨텐츠 관리</span>
//             </Link>
//           </Button>

//       {/* 운영자 메뉴 */}
//       <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">운영자 메뉴</div>
//       {/* {userRole?.userRole >= USER_ROLES.CREATOR && (
//         <> */}
//           <Button
//             variant="ghost"
//             className="flex items-center justify-start gap-3"
//             asChild
//           >
//             <Link href="/usermenu/subscription">
//               <PencilRuler />
//               <span className="hidden lg:inline">운영관리</span>
//             </Link>
//           </Button>
//           <Button
//             variant="ghost"
//             className="flex items-center justify-start gap-3"
//             asChild
//           >
//             <Link href="/usermenu/subscription">
//               <Users />
//               <span className="hidden lg:inline">사용자관리</span>
//             </Link>
//           </Button>
//         </>
//       )}
      
//       {/* 카테고리 섹션 */}
//       {/* <hr className="mx-auto border-t border-gray-600 pb-5 ml-4 mr-4 space-y-3" /> */}
//       <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">분류별 바로보기</div>
//       <div className="flex items-center justify-start gap-3 text-sm ml-4 py-2">
//         <Boxes className="justify-start hidden lg:inline"/>
//         <span className="hidden lg:inline">카테고리</span>
//       </div>
//       <div className="justify-start gap-3 hidden lg:inline">
//           {[
//             { href: "/categories/recent", label: "최신작" },
//             { href: "/categories/ROMANCE", label: "로맨스" },
//             { href: "/categories/ACTION", label: "액션" },
//             { href: "/categories/THRILLER", label: "스릴러" },
//             { href: "/categories/DRAMA", label: "드라마" },
//             { href: "/categories/PERIOD", label: "시대극" },
//             { href: "/categories/FANTASY", label: "판타지" },
//             { href: "/categories/HIGHTEEN", label: "하이틴" },
//             { href: "/categories/ADULT", label: "성인" }
//           ].map((category) => (
//             <Button
//               key={category.href}
//               variant="ghost"
//               className="flex items-center justify-start gap-3 h-11 text-sm"
//               asChild
//             >
//               <Link href={category.href}>
//                 <span>🔻 {category.label}</span>
//               </Link>
//             </Button>
//           ))}
//       </div>
//     </div>
//   );
// }
