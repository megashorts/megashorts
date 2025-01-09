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
import { USER_ROLES } from "@/lib/roleType";
import { useSession } from "@/components/SessionProvider";

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
  const [userRole, setUserRole] = useState<number>(0);

  // https://lucide.dev/ 에서 아이콘 모양확인

  useEffect(() => {
    async function fetchUserRole() {
      if (user) {
        try {
          const response = await fetch("/api/users/role", {
            headers: {
              "x-user-id": user.id
            }
          });
          const data = await response.json();
          if (data.userRole) {
            setUserRole(data.userRole);
          }
        } catch (error) {
          console.error("Failed to fetch user role:", error);
        }
      }
    }
    fetchUserRole();
  }, [user]);

  if (!user) {
    router.push("/login");
    return null;
  }

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
        <button className={cn("flex-none hover:bg-transparent", className)}>
          {/* <UserAvatar avatarUrl={user.avatarUrl} size={30} /> */}
          <UserCircle className="size-7" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={20}  // sideOffset={isMobile ? 4 : 16} and side={isMobile ? "top" : "bottom"}
        align="end"     // align={isMobile ? "start" : "end"}
        className="z-50 w-56 lg:w-64" // 모바일과 데스크탑의 너비 다르게 설정
      >
        <DropdownMenuLabel>반가워요! @{user.username}님.</DropdownMenuLabel>

        <DropdownMenuSeparator className="h-[0.5px] bg-gray-600" />
        <div className="text-xs font-medium text-gray-600">사용자 정보</div>
        <Link href={`/usermenu/users/${user.username}`}>
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

        {/* {userRole >= USER_ROLES.CREATOR && (
        <>
        <DropdownMenuSeparator />
        <div className="text-xs font-medium text-gray-600">운영관리</div>
        <Link href={`/subscription`}>
          <DropdownMenuItem>
            <PencilRuler className="mr-2 size-4" />
            운영관리 설정
          </DropdownMenuItem>
        </Link>
        <Link href={`/subscription`}>
          <DropdownMenuItem>
            <Users className="mr-2 size-4" />
            사용자 조회관리
          </DropdownMenuItem>
        </Link>
        </>
        )} */}

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

        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Monitor className="mr-2 size-4" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 size-4" />
                System default
                {theme === "system" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 size-4" />
                Light
                {theme === "light" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 size-4" />
                Dark
                {theme === "dark" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub> */}
        <DropdownMenuSeparator className="h-[0.5px] bg-gray-600" />
        <DropdownMenuItem
          onClick={() => {
            queryClient.clear();
            logout();
          }}
        >
          <LogOutIcon className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
  );
}
