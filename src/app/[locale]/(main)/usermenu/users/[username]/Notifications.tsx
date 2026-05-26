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
import { useTranslations } from "next-intl";

export default function Notifications() {
  const tNotification = useTranslations('Notification');
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
        {tNotification('noNotifications')}
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive mt-8">
        {tNotification('loadFailed')}
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
          <span>{isDeleteAllPending ? tNotification('deleting') : tNotification('deleteAll')}</span>
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
