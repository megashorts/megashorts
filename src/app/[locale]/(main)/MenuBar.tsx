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
          { href: "/categories/PERIODPLAY", label: "시대극" },
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
