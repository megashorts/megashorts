"use client";

import { Button } from "@/components/ui/button";
import { Bookmark, Home, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  view: "desktop" | "mobile";
}

export default function NavLinks({ view }: NavLinksProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  if (view === "desktop") {
    return (
      <>
        <Button
          variant="ghost"
          className={`flex items-center gap-3 hover:bg-transparent group relative ${
            isActive("/") ? "text-primary" : ""
          }`}
          title="Home"
          asChild
        >
          <Link href="/" className="relative">
            <span className={`${isActive("/") ? "text-primary" : "group-hover:text-primary"}`}>홈</span>
            <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          className={`flex items-center gap-3 hover:bg-transparent group relative ${
            isActive("/foryou") ? "text-primary" : ""
          }`}
          title="For you"
          asChild
        >
          <Link href="/recommended-videos" className="relative">
            <span className={`${isActive("/foryou") ? "text-primary" : "group-hover:text-primary"}`}>포유</span>
            {/* <span className={`${isActive("/") ? "text-primary" : "group-hover:text-primary"}`}>포유</span> */}
            <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          className={`flex items-center gap-3 hover:bg-transparent group relative ${
            isActive("usermenu/bookmarks") ? "text-primary" : ""
          }`}
          title="Bookmarks"
          asChild
        >
          <Link href="/usermenu/bookmarks" className="relative">
            <span className={`${isActive("/bookmarks") ? "text-primary" : "group-hover:text-primary"}`}>나의 리스트</span>
            <span className="absolute left-0 bottom-[0px] w-full h-1 bg-primary scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
          </Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        className={`flex flex-col items-center hover:bg-transparent ${
          isActive("/") ? "text-primary" : "hover:text-primary"
        }`}
        title="Home"
        asChild
      >
        <Link href="/">
          <Home className="size-8" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={`flex flex-col items-center hover:bg-transparent ${
          isActive("/foryou") ? "text-primary" : "hover:text-primary"
        }`}
        title="For you"
        asChild
      >
        <Link href="/videos">
          <Compass className="size-8" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={`flex flex-col items-center hover:bg-transparent ${
          isActive("usermenu/bookmarks") ? "text-primary" : "hover:text-primary"
        }`}
        title="/Bookmarks"
        asChild
      >
        <Link href="/usermenu/bookmarks">
          <Bookmark className="size-8" />
        </Link>
      </Button>
    </>
  );
}
