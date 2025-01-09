import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@prisma/client";
import { Bookmark, Coins, Heart, MessageCircle, User2 } from "lucide-react";
import Link from "next/link";

interface NotificationProps {
  notification: NotificationData;
}

export default function Notification({ notification }: NotificationProps) {
  const notificationTypeMap: Record<
    NotificationType,
    { message: (notification: NotificationData) => string; icon: JSX.Element; href: string }
  > = {
    FOLLOW: {
      message: (n) => `${n.issuer.displayName}님이 팔로우하셨습니다`,
      icon: <User2 className="size-7 text-primary" />,
      href: `/users/${notification.issuer.username}`,
    },
    COMMENT: {
      message: (n) => `${n.issuer.displayName}님이 ${n.metadata?.reason || '댓글을 남기셨습니다'}`,
      icon: <MessageCircle className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    LIKE: {
      message: (n) => `${n.issuer.displayName}님이 게시물을 좋아합니다`,
      icon: <Heart className="size-7 fill-red-500 text-red-500" />,
      href: `/posts/${notification.postId}`,
    },
    POST: {
      message: (n) => `${n.issuer.displayName}님이 새 게시물을 작성했습니다`,
      icon: <MessageCircle className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    COIN: {
      message: (n) => `${n.metadata?.amount || 0} 코인을 받았습니다`,
      icon: <MessageCircle className="size-7 fill-primary text-primary" />,
      href: `/usermenu/coins`,
    },
    POINT: {
      message: (n) => `${n.metadata?.amount || 0} 포인트를 받았습니다`,
      icon: <MessageCircle className="size-7 fill-primary text-primary" />,
      href: `/usermenu/points`,
    },
    BOOKMARK: {
      message: (n) => `${n.issuer.displayName}님이 게시물을 북마크했습니다`,
      icon: <MessageCircle className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    }
  };

  const { message, icon, href } = notificationTypeMap[notification.type];

  return (
    <Link href={href} className="block">
      <article
        className={cn(
          "flex gap-3 rounded-2xl bg-card p-5 shadow-sm transition-colors hover:bg-card/70",
          !notification.read && "bg-primary/10",
        )}
      >
        <div className="my-1">{icon}</div>
        <div className="space-y-3">
          <div>
            <span>{message(notification)}</span>
          </div>
          {notification.post && (
            <div className="line-clamp-3 whitespace-pre-line text-muted-foreground">
              {notification.post.content}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}