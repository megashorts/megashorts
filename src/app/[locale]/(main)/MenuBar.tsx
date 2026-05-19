"use client";

import { 
  Boxes,
  Building, 
  Megaphone, 
  WalletCards 
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import UserWelcome from "@/components/UserWelcome";
import AuthMenuItems from "@/components/AuthMenuItems";
import { useTranslations } from 'next-intl';

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const pathname = usePathname();
  const tNav = useTranslations('Nav');
  const tCat = useTranslations('Category');
  
  // 특정 경로에서는 메뉴바를 숨김
  if (pathname === "/" || pathname.startsWith("/posts") || pathname.startsWith("/video")) {
    return null;
  }

  return (
    <div className={`hidden md:flex flex-col ${className}`}>
      <UserWelcome />

      <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">{tNav('sectionGuide')}</div>
      
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/subscription">
          <WalletCards />
          <span className="hidden lg:inline">{tNav('subscriptionCoin')}</span>
        </Link>
      </Button>

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/notice">
          <Megaphone />
          <span className="hidden lg:inline">{tNav('noticeBlog')}</span>
        </Link>
      </Button>

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/company/introduce">
          <Building />
          <span className="hidden lg:inline">{tNav('companyIntro')}</span>
        </Link>
      </Button>

      <AuthMenuItems />

      <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">{tNav('sectionCategory')}</div>
      <div className="flex items-center justify-start gap-3 text-sm ml-4 py-2">
        <Boxes className="justify-start hidden lg:inline"/>
        <span className="hidden lg:inline">{tNav('contentCategory')}</span>
      </div>
      <div className="justify-start gap-3 hidden lg:inline">
        {[
          { href: "/categories/recent", labelKey: "recent" },
          { href: "/categories/ROMANCE", labelKey: "ROMANCE" },
          { href: "/categories/ACTION", labelKey: "ACTION" },
          { href: "/categories/THRILLER", labelKey: "THRILLER" },
          { href: "/categories/DRAMA", labelKey: "DRAMA" },
          { href: "/categories/PERIODPLAY", labelKey: "PERIODPLAY" },
          { href: "/categories/FANTASY", labelKey: "FANTASY" },
          { href: "/categories/HIGHTEEN", labelKey: "HIGHTEEN" },
          { href: "/categories/ADULT", labelKey: "ADULT" }
        ].map((category) => (
          <Button
            key={category.href}
            variant="ghost"
            className="flex items-center justify-start gap-3 h-11 text-sm"
            asChild
          >
            <Link href={category.href}>
              <span>🔻 {tCat(category.labelKey)}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
