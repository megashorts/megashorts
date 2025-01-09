"use client";

import { Session, User } from "lucia";
import React, { createContext, useContext, useEffect } from "react";
import { videoDB } from '@/lib/indexedDB';

interface SessionContext {
  user: User | null;
  session: Session | null;
}

const SessionContext = createContext<SessionContext | null>(null);

export default function SessionProvider({
  children,
  value,
}: React.PropsWithChildren<{ value: SessionContext }>) {
  // 세션 상태가 변경될 때마다 동기화 처리
  useEffect(() => {
    if (value.user) {
      // 로그인 상태일 때 서버와 동기화
      fetch('/api/videos/sync')
        .then(res => res.json())
        .then(data => {
          if (data.watchedVideos && data.lastViews) {
            videoDB.syncWithServer({
              watchedVideos: data.watchedVideos,
              lastViews: data.lastViews
            }).catch(console.error);
          }
        })
        .catch(console.error);
    } else {
      // 로그아웃 상태일 때 IndexedDB 초기화
      videoDB.clearAll().catch(console.error);
    }
  }, [value.user?.id]); // user.id가 변경될 때만 실행

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
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
// import React, { createContext, useContext } from "react";

// interface SessionContext {
//   user: User | null;
//   session: Session | null;
// }

// const SessionContext = createContext<SessionContext | null>(null);

// export default function SessionProvider({
//   children,
//   value,
// }: React.PropsWithChildren<{ value: SessionContext }>) {
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
