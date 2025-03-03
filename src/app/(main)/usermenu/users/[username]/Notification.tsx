import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@prisma/client";
import { Heart, MessageCircle, User2, Star, Gem } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface NotificationProps {
  notification: NotificationData;
}

export default function Notification({ notification }: NotificationProps) {
  const notificationTypeMap: Record<
    NotificationType,
    { 
      getMessage: (notification: NotificationData) => string;
      icon: JSX.Element;
      href: string;
    }
  > = {
    FOLLOW: {
      getMessage: (n) => `${n.issuer.displayName} followed you`,
      icon: <User2 className="size-4 text-primary" />,
      href: `/users/${notification.issuer.username}`,
    },
    COMMENT: {
      getMessage: (n) => {
        // const amount = n.metadata?.amount;
        const reason = n.metadata?.reason;
        return reason ? `${reason}` : '';
      },
      // icon: <MessageCircle className="size-4 fill-primary text-primary" />,
      icon: <Image src="/MS Logo emblem.svg" alt="MEGASHORTS logo emblem" width={20} height={20} />,
      href: `/usermenu/users/${notification.issuer.username}`,
    },
    LIKE: {
      getMessage: (n) => `님이 컨텐츠를 좋아합니다!`,
      icon: <Heart className="size-4 fill-red-500 text-red-500" />,
      href: `/posts/${notification.postId}`,
    },
    POST: {
      getMessage: (n) => `${n.issuer.displayName} created a new post`,
      icon: <MessageCircle className="size-4 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    COIN: {
      getMessage: (n) => {
        const amount = n.metadata?.amount;
        const reason = n.metadata?.reason;
        return amount ? `${reason}(으)로 ${amount}코인이 지급!` : '코인이 지급!';
      },
      icon: <Gem className="size-4 fill-emerald-300" />,
      href: `/usermenu/users/${notification.issuer.username}`,
    },
    POINT: {
      getMessage: (n) => {
        const amount = n.metadata?.amount;
        const reason = n.metadata?.reason;
        return amount ? `${reason}으로 ${amount}포인트가 적립되었습니다` : '포인트가 적립되었습니다';
      },
      icon: <Star className="size-4 fill-yellow-500 text-yellow-500" />,
      href: `/usermenu/users/${notification.issuer.username}`,
    },
    BOOKMARK: {
      getMessage: (n) => `님이 컨텐츠를 북마크했습니다!`,
      icon: <Heart className="size-4 fill-red-500 text-red-500" />,
      href: `/posts/${notification.postId}`,
    }
  };

  const { getMessage, icon, href } = notificationTypeMap[notification.type];
  const message = getMessage(notification);

  return (
    <Link href={href} className="block">
      <article
        className={cn(
          "flex gap-3 rounded-2xl bg-card p-3 shadow-sm transition-colors hover:bg-card/40",
          !notification.read && "bg-primary/10",
        )}
      >
        <div className="my-1">{icon}</div>
        <div className="space-y-3">
          {/* <UserAvatar avatarUrl={notification.issuer.avatarUrl} size={36} /> */}
          <div>
            <span className="font-bold">{notification.issuer.displayName}</span>{" "}
            <span className="font-sm text-muted-foreground">{message}</span>
          </div>
          {notification.post && (
            <div className="line-clamp-3 whitespace-pre-line">
              {notification.post.title}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

// import UserAvatar from "@/components/UserAvatar";
// import { NotificationData } from "@/lib/types";
// import { cn } from "@/lib/utils";
// import { NotificationType } from "@prisma/client";
// import { Heart, MessageCircle, User2, Coins, Star, Bookmark } from "lucide-react";
// import Link from "next/link";

// interface NotificationProps {
//   notification: NotificationData;
// }

// export default function Notification({ notification }: NotificationProps) {
//   const notificationTypeMap: Record<
//     NotificationType,
//     { message: string; icon: JSX.Element; href: string }
//   > = {
//     FOLLOW: {
//       message: `${notification.issuer.displayName} followed you`,
//       icon: <User2 className="size-4 text-primary" />,
//       href: `/users/${notification.issuer.username}`,
//     },
//     COMMENT: {
//       message: `${notification.issuer.displayName} commented on your post`,
//       icon: <MessageCircle className="size-4 fill-primary text-primary" />,
//       href: `/posts/${notification.postId}`,
//     },
//     LIKE: {
//       message: `${notification.issuer.displayName} liked your post`,
//       icon: <Heart className="size-4 fill-red-500 text-red-500" />,
//       href: `/posts/${notification.postId}`,
//     },
//     POST: {
//       message: `${notification.issuer.displayName} created a new post`,
//       icon: <MessageCircle className="size-4 fill-primary text-primary" />,
//       href: `/posts/${notification.postId}`,
//     },
//     COIN: {
//       message: "코인이 지급되었습니다",
//       icon: <Coins className="size-4 fill-yellow-500 text-yellow-500" />,
//       href: "/usermenu/payments",
//     },
//     POINT: {
//       message: "포인트가 적립되었습니다",
//       icon: <Star className="size-4 fill-yellow-500 text-yellow-500" />,
//       href: "/usermenu/points",
//     },
//     BOOKMARK: {
//       message: "북마크한 게시물이 업데이트되었습니다",
//       icon: <Bookmark className="size-4 fill-blue-500 text-blue-500" />,
//       href: `/posts/${notification.postId}`,
//     },
//   };

//   const { message, icon, href } = notificationTypeMap[notification.type];

//   return (
//     <Link href={href} className="block">
//       <article
//         className={cn(
//           "flex gap-3 rounded-2xl bg-card p-5 shadow-sm transition-colors hover:bg-card/40",
//           !notification.read && "bg-primary/10",
//         )}
//       >
//         <div className="my-1">{icon}</div>
//         <div className="space-y-3">
//           <UserAvatar avatarUrl={notification.issuer.avatarUrl} size={36} />
//           <div>
//             <span className="font-bold">{notification.issuer.displayName}</span>{" "}
//             <span>{message}</span>
//           </div>
//           {notification.post && (
//             <div className="line-clamp-3 whitespace-pre-line text-muted-foreground">
//               {notification.post.content}
//             </div>
//           )}
//         </div>
//       </article>
//     </Link>
//   );
// }