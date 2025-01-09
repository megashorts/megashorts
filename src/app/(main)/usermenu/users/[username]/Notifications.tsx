"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { NotificationsPage } from "@/lib/types";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect } from "react";
import Notification from "./Notification";

export default function Notifications() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/notifications",
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<NotificationsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const queryClient = useQueryClient();

  const { mutate: markAsRead } = useMutation({
    mutationFn: () => 
      kyInstance
        .patch("/api/notifications/mark-as-read", {
          timeout: 10000,  // 10초 타임아웃
          retry: 0  // 재시도 비활성화
        })
        .json(),
    onSuccess: () => {
      queryClient.setQueryData(["unread-notification-count"], {
        unreadCount: 0,
      });
    },
    onError(error: Error) {
      // 타임아웃 에러 구분
      if (error.name === 'TimeoutError') {
        console.error("Request timed out while marking notifications as read");
      } else {
        console.error("Failed to mark notifications as read:", error);
      }
    },
  });

  useEffect(() => {
    if (status === 'success') {
      markAsRead();
    }
  }, [status, markAsRead]);

  const { mutate: deleteAllNotifications, isPending: isDeleteAllPending } = useMutation({
    mutationFn: () => 
      kyInstance
        .delete("/api/notifications", {
          timeout: 10000,  // 10초 타임아웃
          retry: 0  // 재시도 비활성화
        })
        .json(),
    onSuccess: () => {
      queryClient.setQueryData(["notifications"], {
        pages: [{
          notifications: [],
          nextCursor: null
        }],
        pageParams: [null]
      });
      queryClient.setQueryData(["unread-notification-count"], {
        unreadCount: 0,
      });
    },
    onError(error: Error) {
      console.error("Failed to delete all notifications:", error);
    },
  });

  const notifications = data?.pages.flatMap((page) => page.notifications) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !notifications.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground mt-8">
        새로운 알림이 없습니다.
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive mt-8">
        알림 불러오기에 실패하였습니다.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-end px-2">
        <button
          onClick={() => deleteAllNotifications()}
          disabled={isDeleteAllPending}
          className="flex items-center gap-1 px-3 py-1 text-sm text-muted-foreground hover:text-red-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleteAllPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span>{isDeleteAllPending ? '삭제 중...' : '전체 알림 삭제'}</span>
        </button>
      </div>
      <InfiniteScrollContainer
        className="space-y-2"
        onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
      >
        {notifications.map((notification) => (
          <Notification key={notification.id} notification={notification} />
        ))}
        {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
      </InfiniteScrollContainer>
    </div>
  );
}

// "use client";

// import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
// import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
// import kyInstance from "@/lib/ky";
// import { NotificationsPage } from "@/lib/types";
// import {
//   useInfiniteQuery,
//   useMutation,
//   useQueryClient,
// } from "@tanstack/react-query";
// import { Loader2, Trash2, CheckSquare, AlertCircle } from "lucide-react";
// import { useEffect } from "react";
// import Notification from "./Notification";


// export default function Notifications() {
//   const {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetching,
//     isFetchingNextPage,
//     status,
//   } = useInfiniteQuery({
//     queryKey: ["notifications"],
//     queryFn: ({ pageParam }) =>
//       kyInstance
//         .get(
//           "/api/notifications",
//           pageParam ? { searchParams: { cursor: pageParam } } : {},
//         )
//         .json<NotificationsPage>(),
//     initialPageParam: null as string | null,
//     getNextPageParam: (lastPage) => lastPage.nextCursor,
//   });

//   const queryClient = useQueryClient();

//   // 읽음 처리를 한 번만 실행하도록 수정
//   const { mutate: markAsRead } = useMutation({
//     mutationFn: () => kyInstance.patch("/api/notifications/mark-as-read"),
//     onSuccess: () => {
//       queryClient.setQueryData(["unread-notification-count"], {
//         unreadCount: 0,
//       });
//     },
//     onError(error) {
//       console.error("Failed to mark notifications as read", error);
//     },
//   });

//   // 컴포넌트 마운트 시 한 번만 실행되도록 수정
//   useEffect(() => {
//     let mounted = true;

//     if (mounted && status === 'success') {
//       markAsRead();
//     }

//     return () => {
//       mounted = false;
//     };
//   }, [status]); // status가 'success'일 때만 실행

//   // 전체 알림 삭제 mutation
//   const { mutate: deleteAllNotifications, isPending: isDeleteAllPending } = useMutation({
//     mutationFn: () => kyInstance.delete("/api/notifications"),
//     onSuccess: () => {
//       queryClient.setQueryData(["notifications"], {
//         pages: [{
//           notifications: [],
//           nextCursor: null
//         }],
//         pageParams: [null]
//       });
//       queryClient.setQueryData(["unread-notification-count"], {
//         unreadCount: 0,
//       });
//     },
//     onError(error) {
//       console.error("Failed to delete all notifications", error);
//     },
//   });

//   // 읽은 알림 삭제 mutation
//   // const { mutate: deleteReadNotifications, isPending: isDeleteReadPending } = useMutation({
//   //   mutationFn: () => kyInstance.delete("/api/notifications/read"),
//   //   onSuccess: () => {
//   //     queryClient.invalidateQueries({ queryKey: ["notifications"] });
//   //   },
//   //   onError(error) {
//   //     console.error("Failed to delete read notifications", error);
//   //   },
//   // });

//   useEffect(() => {
//     markAsRead();
//   }, [markAsRead]);

//   const notifications = data?.pages.flatMap((page) => page.notifications) || [];

//   if (status === "pending") {
//     return <PostsLoadingSkeleton />;
//   }

//   if (status === "success" && !notifications.length && !hasNextPage) {
//     return (
//       <p className="text-center text-muted-foreground mt-8">
//         {/* You don&apos;t have any notifications yet. */}
//         새로운 알림이 없습니다.
//       </p>
//     );
//   }

//   if (status === "error") {
//     return (
//       <p className="text-center text-destructive mt-8">
//         알림 불러오기에 실패하였습니다.
//       </p>
//     );
//   }

//   return (
//     <div className="space-y-1">
//       <div className="flex justify-end px-2">
//         {/* <button
//           onClick={() => {
//             if (window.confirm('읽은 알림을 모두 삭제하시겠습니까?')) {
//               deleteReadNotifications();
//             }
//           }}
//           disabled={isDeleteReadPending}
//           className="flex items-center gap-1 px-3 py-1 text-sm text-muted-foreground hover:text-red-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isDeleteReadPending ? (
//             <Loader2 className="w-4 h-4 animate-spin" />
//           ) : (
//             <>
//               <CheckSquare className="w-4 h-4" />
//             </>
//           )}
//           <span>{isDeleteReadPending ? '삭제 중...' : '읽은 알림 삭제'}</span>
//         </button> */}
//         {/* <button
//           onClick={() => {
//             if (window.confirm('모든 알림을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
//               deleteAllNotifications();
//             }
//           }}
//           disabled={isDeleteAllPending}
//           className="flex items-center gap-1 px-3 py-1 text-sm text-muted-foreground hover:text-red-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isDeleteAllPending ? (
//             <Loader2 className="w-4 h-4 animate-spin" />
//           ) : (
//             <Trash2 className="w-4 h-4" />
//           )}
//           <span>{isDeleteAllPending ? '삭제 중...' : '전체 알림 삭제'}</span>
//         </button> */}
//         <button
//           onClick={() => {
//               deleteAllNotifications();
//           }}
//           disabled={isDeleteAllPending}
//           className="flex items-center gap-1 px-3 py-1 text-sm text-muted-foreground hover:text-red-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isDeleteAllPending ? (
//             <Loader2 className="w-4 h-4 animate-spin" />
//           ) : (
//             <Trash2 className="w-4 h-4" />
//           )}
//           <span>{isDeleteAllPending ? '삭제 중...' : '전체 알림 삭제'}</span>
//         </button>
//       </div>
//       <InfiniteScrollContainer
//       className="space-y-2"
//       onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
//     >
//       {notifications.map((notification) => (
//         <Notification key={notification.id} notification={notification} />
//       ))}
//       {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
//     </InfiniteScrollContainer>
//     </div>
//   );
// }
