"use client";

import { Session, User } from "lucia";
import React, { createContext, useContext, useRef } from "react";
import { videoDB } from "../lib/indexedDB";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface SessionContext {
  user: User | null;
  session: Session | null;
  refreshSession: () => void;
}

const SessionContext = createContext<SessionContext | null>(null);

export default function SessionProvider({
  children,
  value,
}: React.PropsWithChildren<{ value: { user: User | null; session: Session | null } }>) {
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const queryClient = useQueryClient();
  
  // React Query 사용하여 세션 데이터 관리
  const { data: sessionData, refetch } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/session');
      return res.json();
    },
    // 전달받은 초기 데이터 사용
    initialData: value,
    // 페이지 포커스 시 자동 갱신 비활성화
    refetchOnWindowFocus: false,
    // 마운트 시 자동 갱신 비활성화
    refetchOnMount: false,
  });

  // 세션 데이터가 변경될 때마다 실행
  React.useEffect(() => {
    const currentUserId = sessionData?.user?.id;
    const prevUserId = prevUserIdRef.current;
  
    const handleUserChange = async () => {
      if (currentUserId) {
        try {
          // 다른 사용자로 로그인한 경우에만 초기화
          if (prevUserId && currentUserId !== prevUserId) {
            await videoDB.clearForNewUser();
          }
  
          // 로그인할 때마다 항상 동기화 체크
          const res = await fetch('/api/videos/sync');
          const data = await res.json();
          
          if (data.watchedVideos) {
            await videoDB.syncWithServer({
              watchedVideos: data.watchedVideos,
              lastViews: data.lastViews
            });
          }
        } catch (error) {
          console.error('Failed to sync watched videos:', error);
        }
      }
    };
  
    handleUserChange();
    prevUserIdRef.current = currentUserId;
  }, [sessionData?.user?.id]);

  // 세션 갱신 함수
  const refreshSession = React.useCallback(() => {
    refetch();
  }, [refetch]);

  // 컨텍스트 값
  const contextValue = React.useMemo(() => ({
    user: sessionData?.user || null,
    session: sessionData?.session || null,
    refreshSession,
  }), [sessionData, refreshSession]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

// "use client";

// import { Session, User } from "lucia";
// import React, { createContext, useContext, useEffect, useRef } from "react";
// import { videoDB } from "../lib/indexedDB";

// interface SessionContext {
//   user: User | null;
//   session: Session | null;
// }
// lastViews: []
// const SessionContext = createContext<SessionContext | null>(null);

// export default function SessionProvider({
//   children,
//   value,
// }: React.PropsWithChildren<{ value: SessionContext }>) {
//   const prevUserIdRef = useRef<string | undefined>(undefined);

//   useEffect(() => {
//     const currentUserId = value.user?.id;
//     const prevUserId = prevUserIdRef.current;
  
//     const handleUserChange = async () => {
//       if (currentUserId) {
//         try {
//           // 다른 사용자로 로그인한 경우에만 초기화
//           if (prevUserId && currentUserId !== prevUserId) {
//             await videoDB.clearForNewUser();
//           }
  
//           // 로그인할 때마다 항상 동기화 체크
//           const res = await fetch('/api/videos/sync');
//           const data = await res.json();
          
//           if (data.watchedVideos) {
//             await videoDB.syncWithServer({
//               watchedVideos: data.watchedVideos,
//               lastViews: data.lastViews
//             });
//           }
//         } catch (error) {
//           console.error('Failed to sync watched videos:', error);
//         }
//       }
//     };
  
//     handleUserChange();
//     prevUserIdRef.current = currentUserId;
//   }, [value.user?.id]);

//   return (
//     <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
//   );
// }

// export function useSession() {
//   const context = useContext(SessionContext);
//   if (!context) {
//     throw new Error("useSession must be used within a SessionProvider");
//   }
//   return context;
// }

