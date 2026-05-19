// src/components/AuthMenuItems.tsx
'use client'

import { 
  FolderOpen,
  NotebookPen,
  PencilRuler,
  UserCog,
  Users
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";
import { useTranslations } from 'next-intl';

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
    </>
  );
}