// src/components/AuthMenuItems.tsx
'use client'

import { 
  BarChart3,
  FolderOpen,
  Network,
  NotebookPen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";
import { useTranslations } from 'next-intl';
import { isAgencyRole, isCreatorRole } from "@/lib/user-roles";
import { USER_ROLE } from "@/lib/constants";

export default function AuthMenuItems() {
  const { user } = useSession();
  const tNav = useTranslations('Nav');

  if (!user) return null;

  return (
    <>
      <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">{tNav('sectionCreator')}</div>
      <Button
        key="content-new"
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/usermenu/postnew">
          <NotebookPen />
          <span className="hidden lg:inline">{tNav('contentRegister')}</span>
        </Link>
      </Button>

      <Button
        key="content-manage"
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/usermenu/yourposts">
          <FolderOpen />
          <span className="hidden lg:inline">{tNav('contentManage')}</span>
        </Link>
      </Button>

      {isCreatorRole(user.userRole) && (
        <Button
          key="creator-earnings"
          variant="ghost"
          className="flex items-center justify-start gap-3"
          asChild
        >
          <Link href="/usermenu/earnings">
            <BarChart3 />
            <span className="hidden lg:inline">{tNav('earnings')}</span>
          </Link>
        </Button>
      )}

      {isAgencyRole(user.userRole) && (
        <Button
          key="agency-earnings"
          variant="ghost"
          className="flex items-center justify-start gap-3"
          asChild
        >
          <Link href="/usermenu/agency-earnings">
            <BarChart3 />
            <span className="hidden lg:inline">{tNav('agencyEarnings')}</span>
          </Link>
        </Button>
      )}

      {user.userRole >= USER_ROLE.TEAM_MASTER && (
        <Button
          key="agency-manage"
          variant="ghost"
          className="flex items-center justify-start gap-3"
          asChild
        >
          <Link href="/admin/agency">
            <Network />
            <span className="hidden lg:inline">{tNav('agencyManage')}</span>
          </Link>
        </Button>
      )}
    </>
  );
}
