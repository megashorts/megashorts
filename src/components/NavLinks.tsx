"use client";

import { Button } from "@/components/ui/button";
import { Bookmark, Home, Compass } from "lucide-react";
import { Building, ChevronDown, ChevronRight, FolderOpen, LogOutIcon, Megaphone, NotebookPen, TvMinimalPlay, UserCircle, UserIcon, Users, WalletCards } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "./SessionProvider";
import { useState } from "react";
import { cn } from "@/lib/utils";

// interface NavLinksProps {
//   view: "desktop" | "mobile";
// }

export default function NavLinks() {
  const pathname = usePathname();
  const { user } = useSession();
  const isActive = (path: string) => pathname === path;



  // 북마크 버튼 부분만 수정
  const BookmarkButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false); // 서브메뉴 상태

    // 로그인 상태: 기존 링크 버튼
    if (user) {
      return (
        <Button
          variant="ghost"
          className={`flex items-center md:gap-4 hover:bg-transparent group relative ${
            isActive("usermenu/bookmarks") ? "text-primary" : ""
          }`}
          title="Bookmarks"
          asChild
        >
          <Link href="/usermenu/bookmarks" className="relative">
            <Bookmark className="size-5" />
            <span className={`${isActive("/bookmarks") ? "text-primary" : "group-hover:text-primary"} hidden md:block`}>나의 리스트</span>
            <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100 hidden md:block" />
          </Link>
        </Button>
      );
    }

    // 비로그인 상태: 드롭다운 메뉴
    return (
      <>
        {/* 전체 화면 블러 오버레이 */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
        
        <DropdownMenu 
          onOpenChange={(isOpen) => {
            setIsOpen(isOpen);
            setIsSubmenuOpen(false); // 서브메뉴 상태 초기화
          }}
        >
        {/* <DropdownMenu onOpenChange={setIsOpen}> */}
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center md:gap-2 hover:bg-transparent group relative"
              title="Bookmarks"
            >
              <Bookmark className="size-5" />
              <span className="group-hover:text-primary hidden md:block">나의 리스트</span>
              <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            sideOffset={20}  // sideOffset={isMobile ? 4 : 16} and side={isMobile ? "top" : "bottom"}
            align="start"     // align={isMobile ? "start" : "end"}
            className="z-50 w-64 lg:w-72 text-lg md:text-base " // 모바일과 데스크탑의 너비 다르게 설정
          >
            <DropdownMenuLabel>반가워요!</DropdownMenuLabel>
    
            <DropdownMenuSeparator className="h-[0.5px] bg-gray-600" />
    
            <DropdownMenuSeparator />
            <div className="text-xs font-medium text-gray-600">메가쇼츠 안내</div>
            <Link href={`/subscription`}>
              <DropdownMenuItem>
                <WalletCards className="mr-2 size-4" />
                구독 및 코인
              </DropdownMenuItem>
            </Link>
            <Link href={`/notice`}>
              <DropdownMenuItem>
                <Megaphone className="mr-2 size-4" />
                안내 & 블로그
              </DropdownMenuItem>
            </Link>
            <Link href={`/company/introduce`}>
              <DropdownMenuItem>
                <Building className="mr-2 size-4" />
                MS소개 & 문의
              </DropdownMenuItem>
            </Link>
    
            <DropdownMenuSeparator />
            <div className="text-xs font-medium text-gray-600">분류별 바로보기</div>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault(); // 기본 동작 방지 (메뉴 닫히지 않게)
                e.stopPropagation(); // 이벤트 버블링 방지
                setIsSubmenuOpen(!isSubmenuOpen); // 서브메뉴 상태 토글
              }}
              // className="flex justify-between items-center"
            >
              <TvMinimalPlay className="mr-2 w-4 h-4" />
              컨텐츠 카테고리
              {isSubmenuOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </DropdownMenuItem>
            {/* 서브메뉴 */}
            <div
              className={`pl-6 mt-2 space-y-1 ${
                isSubmenuOpen ? "block" : "hidden"
              }`} // 상태에 따라 보이거나 숨김
            >
              <Link href={`/categories/recent`}>
                <DropdownMenuItem>
                  {/* <UserIcon className="mr-2 size-4" /> */}
                  최신작
                </DropdownMenuItem>
              </Link>
              <Link href={`/categories/ROMANCE`}>
                <DropdownMenuItem>
                  {/* <UserIcon className="mr-2 size-4" /> */}
                  로맨스
                </DropdownMenuItem>
              </Link>
              <Link href={`/categories/ACTION`}>
                <DropdownMenuItem>
                  액션
                </DropdownMenuItem>
              </Link>
              <Link href={`/categories/THRILLER`}>
                <DropdownMenuItem>
                  스릴러
                </DropdownMenuItem>
              </Link>
              <Link href={`/categories/DRAMA`}>
                <DropdownMenuItem>
                  드라마
                </DropdownMenuItem>
              </Link>
              <Link href={`/categories/PERIOD`}>
                <DropdownMenuItem>
                  시대극
                </DropdownMenuItem>
              </Link>
              <Link href={`/categories/FANTASY`}>
                <DropdownMenuItem>
                  판타지
                </DropdownMenuItem>
              </Link>
              <Link href={`/categories/HIGHTEEN`}>
                <DropdownMenuItem>
                  하이틴
                </DropdownMenuItem>
              </Link>
              <Link href={`/categories/ADULT`}>
                <DropdownMenuItem>
                  성인
                </DropdownMenuItem>
              </Link>                                               
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };

  // if (view === "desktop") {
    return (
      <>
        <div className="flex md:gap-4">
          <Button
            variant="ghost"
            className={`flex items-center md:gap-2 hover:bg-transparent group relative ${
              isActive("/") ? "text-primary" : ""
            }`}
            title="Home"
            asChild
          >
            <Link href="/" className="relative">
              <Home className="size-5 hidden md:block" />
              <span className={`${isActive("/") ? "text-primary" : "group-hover:text-primary"} hidden md:block`}>홈</span>
              <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100 hidden md:block" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className={`flex items-center md:gap-2 hover:bg-transparent group relative ${
              isActive("/recommended-videos") ? "text-primary" : ""
            }`}
            title="For you"
            asChild
          >
            <Link href="/recommended-videos" className="relative">
              <Compass className="size-5" />
              <span className={`${isActive("/foryou") ? "text-primary" : "group-hover:text-primary"} hidden md:block`}>포유</span>
              {/* <span className={`${isActive("/") ? "text-primary" : "group-hover:text-primary"}`}>포유</span> */}
              <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          </Button>
          {/* <Button
            variant="ghost"
            className={`flex items-center md:gap-4 hover:bg-transparent group relative ${
              isActive("usermenu/bookmarks") ? "text-primary" : ""
            }`}
            title="Bookmarks"
            asChild
          >
            <Link href="/usermenu/bookmarks" className="relative">
              <Bookmark className="size-5" />
              <span className={`${isActive("/bookmarks") ? "text-primary" : "group-hover:text-primary"} hidden md:block`}>나의 리스트</span>
              <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100 hidden md:block" />
            </Link>
          </Button> */}
          <BookmarkButton />
        </div>
      </>
    );
  // }

  // return (
  //   <>
  //     <Button
  //       variant="ghost"
  //       className={`flex flex-col items-center hover:bg-transparent ${
  //         isActive("/") ? "text-primary" : "hover:text-primary"
  //       }`}
  //       title="Home"
  //       asChild
  //     >
  //       <Link href="/">
  //         <Home className="size-8" />
  //       </Link>
  //     </Button>
  //     <Button
  //       variant="ghost"
  //       className={`flex flex-col items-center hover:bg-transparent ${
  //         isActive("/recommended-videos") ? "text-primary" : "hover:text-primary"
  //       }`}
  //       title="For you"
  //       asChild
  //     >
  //       <Link href="/recommended-videos">
  //         <Compass className="size-8" />
  //       </Link>
  //     </Button>
  //     <Button
  //       variant="ghost"
  //       className={`flex flex-col items-center hover:bg-transparent ${
  //         isActive("usermenu/bookmarks") ? "text-primary" : "hover:text-primary"
  //       }`}
  //       title="/Bookmarks"
  //       asChild
  //     >
  //       <Link href="/usermenu/bookmarks">
  //         <Bookmark className="size-8" />
  //       </Link>
  //     </Button>
  //   </>
  // );
}
