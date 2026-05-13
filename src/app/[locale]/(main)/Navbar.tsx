"use client";

import SearchField from "@/components/SearchField";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogIn, UserIcon } from "lucide-react";
import NavLinks from "@/components/NavLinks";
import { UserTrigger } from "@/components/CustomUserTrigger";
import UserButton from "@/components/UserButton";
import { useSession } from "@/components/SessionProvider";
import { useUnreadCount } from "@/hooks/queries/useNotifications";

interface NavBarProps {
  className?: string;
  segment?: string;
}

export default function NavBar({ className }: NavBarProps) {
  const session = useSession()
  const { data: unreadData } = useUnreadCount();
  
  const unreadCount = unreadData?.unreadCount ?? 0;

  return (
    <header className={`absolute w-full z-50 bg-transparent ${className}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 lg:px-8 lg:py-6 py-1 md:py-3">
        {/* 데스크탑 로고 */}
        <Link href="/" className="hidden md:block">
          <div className="relative w-[192px] h-[24px]">
            <img 
              src="/MSWebLogoSVG.svg" 
              alt="MEGASHORTS logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </Link>

        {/* 모바일 로고 */}
        <Link href="/" className="md:hidden">
          <div className="relative w-[48px] h-[24px]">
            <img 
              src="/MS Logo emblem.svg"
              alt="MEGASHORTS emblem" 
              className="w-full h-full object-contain object-center"
            />
          </div>
        </Link>
        
        {/* 우측 메뉴 */}
        <div className="flex items-center gap-4 md:gap-3 ml-auto">
          {/* <div className="hidden lg:flex items-center gap-5"> */}
          <div className="flex items-center gap-1 md:gap-3">
            <NavLinks />
            {session?.user ? (
              <div className="relative pl-1 ">
                <UserButton 
                  className="transition-colors text-white flex items-center justify-center border-transparent hover:border-primary rounded-full border-2 focus:outline-none focus:ring-0 "
                />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full w-4 h-4"
                    aria-label={`${unreadCount} unread messages`}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
            ) : (
              <Link href="/login" className="relative md:gap-1 group flex items-center justify-center">
                <LogIn />
                <span className="rounded hidden md:block text-white text-sm transition-colors duration-200 ease-in-out p-1 group-hover:border-primary group-hover:text-primary">
                  로그인
                </span>
              </Link>
            )}

            
          </div>
          <SearchField />
          {/* 모바일 네비게이션 */}
          {/* <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card p-3 border-t flex justify-around w-full z-20">
            <NavLinks view="mobile" />
            {session?.user ? (
              <div className="flex items-center justify-center relative">
                <UserButton 
                  className="transition-colors hover:text-primary hover:border-primary rounded-full border-2 border-transparent focus:outline-none focus:ring-0"
                />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full w-4 h-4"
                    aria-label={`${unreadCount} unread messages`}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                className="flex flex-col items-center hover:bg-transparent hover:text-primary p-0"
                title="Login"
                asChild
              >
                <Link href="/login">
                  <UserIcon className="size-8" />
                </Link>
              </Button>
            )}
          </div> */}
        </div>
      </div>
    </header>
  );
}