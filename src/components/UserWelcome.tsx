'use client'

import { useSession } from "@/components/SessionProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useUnreadCount } from "@/hooks/queries/useNotifications";

export default function UserWelcome() {
  const { user } = useSession();
  const { data: unreadData } = useUnreadCount();

  const unreadCount = unreadData?.unreadCount ?? 0;

  if (!user) {
    return null;
  }
  
  return (
    <div className="relative items-center justify-start gap-3 hidden lg:inline mt-5">
      <div className="text-start ml-5 pb-6">
        <span className="hidden lg:inline">반가워요!</span>
        <br />
        {user && (
          <span className="hidden lg:inline">@{user.username}님.</span>
        )}
      </div>
      <hr className="mx-auto border-t border-gray-600 pb-4 ml-4 mr-4 pt-2" />
    
      {user && (
        <>
          <div key="welcome-user-info" className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">
            사용자 정보
          </div>
          <Button
            key="welcome-my-info"
            variant="ghost"
            className="flex items-center justify-start gap-3 relative"
            asChild
          >
            <Link href={`/usermenu/users/${user.username}`}>
              <div className="relative">
                <Users />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -left-1 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full w-4 h-4"
                    aria-label={`${unreadCount} unread messages`}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline">나의 정보</span>
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}

// 명시적으로 타입도 export
export type UserWelcomeProps = {};