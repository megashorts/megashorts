"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Building, ChevronDown, ChevronRight, FolderOpen, LogOutIcon, Megaphone, Monitor, NotebookPen, PencilRuler, TvMinimalPlay, UserCircle, UserIcon, Users, WalletCards } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { logActivity } from "@/lib/activity-logger/client";
import { locationManager } from "@/lib/activity-logger/location-manager";

interface UserButtonProps {
  className?: string;
}

export default function UserButton({ className }: UserButtonProps) {
  const { user } = useSession();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false); // 서브메뉴 상태

  if (!user) {
    return (
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className={cn("flex-none hover:bg-transparent", className)}>
            <UserCircle className="size-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={20}
          align="end"
          className="z-50 w-56 lg:w-64 text-lg"
        >
          <Link href="/login">
            <DropdownMenuItem>
              <UserIcon className="mr-2 size-4" />
              로그인
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
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
        <button className={cn("flex-none hover:bg-transparent", className)}>
          <UserCircle className="size-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={20}
        align="end"
        className="z-50 w-64 lg:w-72 text-lg md:text-base"
      >
        <DropdownMenuLabel>반가워요! @{user?.username}님.</DropdownMenuLabel>

        <DropdownMenuSeparator className="h-[0.5px] bg-gray-600" />
        <div className="text-xs font-medium text-gray-600">사용자 정보</div>
        <Link href={`/usermenu/users/${user?.username}`}>
          <DropdownMenuItem>
            <UserIcon className="mr-2 size-4" />
            나의 정보
          </DropdownMenuItem>
        </Link>

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
        <div className="text-xs font-medium text-gray-600">컨텐츠 섹션</div>
        <Link href={`/usermenu/postnew`}>
          <DropdownMenuItem>
            <NotebookPen className="mr-2 size-4" />
            컨텐츠 등록
          </DropdownMenuItem>
        </Link>
        <Link href={`/usermenu/yourposts`}>
          <DropdownMenuItem>
            <FolderOpen className="mr-2 size-4" />
            나의 컨텐츠 관리
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />
        <div className="text-xs font-medium text-gray-600">분류별 바로보기</div>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSubmenuOpen(!isSubmenuOpen);
          }}
        >
          <TvMinimalPlay className="mr-2 w-4 h-4" />
          컨텐츠 카테고리
          {isSubmenuOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </DropdownMenuItem>
        <div
          className={`pl-6 mt-2 space-y-1 ${
            isSubmenuOpen ? "block" : "hidden"
          }`}
        >
          <Link href={`/categories/recent`}>
            <DropdownMenuItem>
              최신작
            </DropdownMenuItem>
          </Link>
          <Link href={`/categories/ROMANCE`}>
            <DropdownMenuItem>
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
          <Link href={`/categories/PERIODPLAY`}>
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
        <DropdownMenuSeparator className="h-[0.5px] bg-gray-600" />
        <DropdownMenuItem
          onClick={async () => {
            queryClient.clear();
            const { success, userInfo } = await logout();
            const locationInfo = await locationManager.getInfo();

            if (success) {
              // 성공 로그
              logActivity({
                timestamp: new Date().toISOString(),
                type: 'auth',
                method: 'LOGOUT',
                path: '',
                status: 200,
                ip: locationInfo.ip,
                country: locationInfo.country,
                city: locationInfo.city,
                device: locationInfo.device,
                request: {
                  body: { username: userInfo?.username }
                },
                response: {
                  status: 200,
                  data: { success: true }
                }
              });
              router.push('/login');
            } else {
              // 실패 로그
              logActivity({
                timestamp: new Date().toISOString(),
                type: 'auth',
                method: 'LOGOUT',
                path: '',
                status: 400,
                ip: locationInfo.ip,
                country: locationInfo.country,
                city: locationInfo.city,
                device: locationInfo.device,
                request: {
                  body: { username: userInfo?.username }
                },
                response: {
                  status: 400,
                  error: 'Session not found or invalid'
                }
              });
            }
          }}
        >
          <LogOutIcon className="mr-2 size-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
  );
}
