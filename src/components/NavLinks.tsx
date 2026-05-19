"use client";

import { Button } from "@/components/ui/button";
import { Bookmark, Home, Compass, Clapperboard } from "lucide-react";
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
import { useTranslations } from 'next-intl';

export default function NavLinks() {
  const pathname = usePathname();
  const { user } = useSession();
  const isActive = (path: string) => pathname === path;
  const tNav = useTranslations('Nav');
  const tCommon = useTranslations('Common');
  const tCat = useTranslations('Category');

  // 북마크 버튼 부분
  const BookmarkButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

    // 로그인 상태: 기존 링크 버튼
    if (user) {
      return (
        <Button
          variant="ghost"
          className={`flex items-center md:gap-2 hover:bg-transparent group relative ${
            isActive("usermenu/bookmarks") ? "text-primary" : ""
          }`}
          title="Bookmarks"
          asChild
        >
          <Link href="/usermenu/bookmarks" className="relative">
            <Bookmark className="size-6" />
            <span className={`${isActive("/bookmarks") ? "text-primary" : "group-hover:text-primary"} hidden md:block`}>{tNav('myList')}</span>
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
            setIsSubmenuOpen(false);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center md:gap-2 hover:bg-transparent group relative"
              title="Bookmarks"
            >
              <Clapperboard className="size-6" />
              <span className="group-hover:text-primary hidden md:block">{tNav('megashorts')}</span>
              <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            sideOffset={20}
            align="start"
            className="z-50 w-64 lg:w-72 text-lg md:text-base "
          >
            <DropdownMenuLabel>{tCommon('welcome')}</DropdownMenuLabel>
    
            <DropdownMenuSeparator className="h-[0.5px] bg-gray-600" />
    
            <DropdownMenuSeparator />
            <div className="text-xs font-medium text-gray-600">{tNav('sectionGuide')}</div>
            <Link href={`/subscription`}>
              <DropdownMenuItem>
                <WalletCards className="mr-2 size-4" />
                {tNav('subscriptionCoin')}
              </DropdownMenuItem>
            </Link>
            <Link href={`/notice`}>
              <DropdownMenuItem>
                <Megaphone className="mr-2 size-4" />
                {tNav('noticeBlog')}
              </DropdownMenuItem>
            </Link>
            <Link href={`/company/introduce`}>
              <DropdownMenuItem>
                <Building className="mr-2 size-4" />
                {tNav('companyInquiry')}
              </DropdownMenuItem>
            </Link>
    
            <DropdownMenuSeparator />
            <div className="text-xs font-medium text-gray-600">{tNav('sectionCategory')}</div>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSubmenuOpen(!isSubmenuOpen);
              }}
            >
              <TvMinimalPlay className="mr-2 w-4 h-4" />
              {tNav('contentCategory')}
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
              }`}
            >
              {[
                { href: '/categories/recent', key: 'recent' },
                { href: '/categories/ROMANCE', key: 'ROMANCE' },
                { href: '/categories/ACTION', key: 'ACTION' },
                { href: '/categories/THRILLER', key: 'THRILLER' },
                { href: '/categories/DRAMA', key: 'DRAMA' },
                { href: '/categories/PERIODPLAY', key: 'PERIODPLAY' },
                { href: '/categories/FANTASY', key: 'FANTASY' },
                { href: '/categories/HIGHTEEN', key: 'HIGHTEEN' },
                { href: '/categories/ADULT', key: 'ADULT' },
              ].map((cat) => (
                <Link key={cat.href} href={cat.href}>
                  <DropdownMenuItem>{tCat(cat.key)}</DropdownMenuItem>
                </Link>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };

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
              <Home className="size-6 hidden md:block" />
              <span className={`${isActive("/") ? "text-primary" : "group-hover:text-primary"} hidden md:block`}>{tNav('home')}</span>
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
              <Compass className="size-6" />
              <span className={`${isActive("/recommended-videos") ? "text-primary" : "group-hover:text-primary"} hidden md:block`}>{tNav('recommend')}</span>
              <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100 hidden md:block" />
            </Link>
          </Button>
          <BookmarkButton />
        </div>
      </>
    );
}
