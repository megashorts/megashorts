"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Building, ChevronDown, ChevronRight, FolderOpen, LogOutIcon, Megaphone, Monitor, Network, NotebookPen, PencilRuler, TvMinimalPlay, UserCircle, UserIcon, Users, WalletCards } from "lucide-react";
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
import { USER_ROLE } from "@/lib/constants";

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
          
        {user?.userRole && user.userRole >= USER_ROLE.CREATOR_Lv1 && (
          <>
            <Link href={`/usermenu/earnings`}>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 size-4" />
                수익관리
              </DropdownMenuItem>
            </Link>
            <Link href={`/usermenu/agency-earnings`}>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 size-4" />
                영업수익 관리
              </DropdownMenuItem>
            </Link>
          </>
        )}

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

        { user?.userRole && user.userRole >= USER_ROLE.OPERATION1 && (
          <>
            <DropdownMenuSeparator />
            <div className="text-xs font-medium text-gray-600">관리자 섹션</div>
            <Link href={`/admin/service`}>
              <DropdownMenuItem>
                <NotebookPen className="mr-2 size-4" />
                서비스관리
              </DropdownMenuItem>
            </Link>
            <Link href={`/admin/system`}>
              <DropdownMenuItem>
                <NotebookPen className="mr-2 size-4" />
                운영시스템
              </DropdownMenuItem>
            </Link>
            <Link href={`/admin/agency`}>
              <DropdownMenuItem>
                <Network className="mr-2 size-4" />
                영업시스템
              </DropdownMenuItem>
            </Link>
          </>
        )}

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
            queryClient.clear(); // React Query 캐시를 초기화합니다
            const { success, userInfo } = await logout();
            const locationInfo = await locationManager.getInfo();

            if (success) {
              // 성공 로그
              logActivity({
                type: 'auth',
                event: 'logout_success',
                username: userInfo?.username,
                details: {
                  action: 'logout',
                  result: 'success'
                }
              });
              router.push('/login');
            } else {
              // 실패 로그
              logActivity({
                type: 'auth',
                event: 'logout_failure',
                username: userInfo?.username,
                details: {
                  action: 'logout',
                  result: 'failure',
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
