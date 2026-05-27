"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/app/[locale]/(auth)/actions";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, BookOpenText, Building, ChevronDown, ChevronRight, FolderOpen, LogOutIcon, Megaphone, Monitor, Network, NotebookPen, PencilRuler, TvMinimalPlay, UserCircle, UserIcon, Users, WalletCards } from "lucide-react";
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
import { isAgencyRole, isCreatorRole } from "@/lib/user-roles";
import { useTranslations } from 'next-intl';

interface UserButtonProps {
  className?: string;
}

export default function UserButton({ className }: UserButtonProps) {
  const { user } = useSession();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const tCommon = useTranslations('Common');
  const tNav = useTranslations('Nav');
  const tCat = useTranslations('Category');

  if (!user) {
    return (
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className={cn("inline-flex h-6 w-6 items-center justify-center leading-none align-middle hover:bg-transparent", className)}>
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
              {tCommon('login')}
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
        <button className={cn("inline-flex h-6 w-6 items-center justify-center leading-none align-middle hover:bg-transparent", className)}>
          <UserCircle className="size-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={20}
        align="end"
        className="z-50 max-h-[min(720px,calc(100svh-7rem))] w-64 overflow-y-auto overscroll-contain pr-1 text-lg md:text-base lg:w-72"
      >
        <DropdownMenuLabel>{tCommon('welcomeUser', { username: user?.username })}</DropdownMenuLabel>

        <DropdownMenuSeparator className="h-[0.5px] bg-gray-600" />
        <div className="text-xs font-medium text-gray-600">{tNav('sectionUser')}</div>
        <Link href={`/usermenu/users/${user?.username}`}>
          <DropdownMenuItem>
            <UserIcon className="mr-2 size-4" />
            {tNav('myInfo')}
          </DropdownMenuItem>
        </Link>
          
        {isCreatorRole(user?.userRole) && (
            <Link href={`/usermenu/earnings`}>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 size-4" />
                {tNav('earnings')}
              </DropdownMenuItem>
            </Link>
        )}
        {isAgencyRole(user?.userRole) && (
            <Link href={`/usermenu/agency-earnings`}>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 size-4" />
                {tNav('agencyEarnings')}
              </DropdownMenuItem>
            </Link>
        )}

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
        <div className="text-xs font-medium text-gray-600">{tNav('sectionContent')}</div>
        <Link href={`/usermenu/postnew`}>
          <DropdownMenuItem>
            <NotebookPen className="mr-2 size-4" />
            {tNav('contentRegister')}
          </DropdownMenuItem>
        </Link>
        <Link href={`/usermenu/yourposts`}>
          <DropdownMenuItem>
            <FolderOpen className="mr-2 size-4" />
            {tNav('myContentManage')}
          </DropdownMenuItem>
        </Link>

        { user?.userRole && user.userRole >= USER_ROLE.TEAM_MASTER && (
          <>
            <DropdownMenuSeparator />
            <div className="text-xs font-medium text-gray-600">{tNav('sectionAdmin')}</div>
            {user.userRole >= USER_ROLE.OPERATION1 && (
              <>
                <Link href={`/admin/service`}>
                  <DropdownMenuItem>
                    <NotebookPen className="mr-2 size-4" />
                    {tNav('serviceManage')}
                  </DropdownMenuItem>
                </Link>
                <Link href={`/admin/system`}>
                  <DropdownMenuItem>
                    <NotebookPen className="mr-2 size-4" />
                    {tNav('systemManage')}
                  </DropdownMenuItem>
                </Link>
              </>
            )}
            <Link href={`/admin/agency`}>
              <DropdownMenuItem>
                <Network className="mr-2 size-4" />
                {tNav('agencyManage')}
              </DropdownMenuItem>
            </Link>
            {user.userRole >= USER_ROLE.MASTER_ADMIN && (
              <Link href={`/admin/guide`}>
                <DropdownMenuItem>
                  <BookOpenText className="mr-2 size-4" />
                  {tNav("adminGuide")}
                </DropdownMenuItem>
              </Link>
            )}
          </>
        )}

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
        <DropdownMenuSeparator className="h-[0.5px] bg-gray-600" />
        <DropdownMenuItem
          onClick={async () => {
            queryClient.clear();
            const { success, userInfo } = await logout();
            const locationInfo = await locationManager.getInfo();

            if (success) {
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
          {tCommon('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
  );
}
