"use client";

import { Session, User } from "lucia";
import React, { createContext, useContext, useEffect, useRef } from "react";
import { videoDB } from "../lib/indexedDB";

interface SessionContext {
  user: User | null;
  session: Session | null;
}
lastViews: []
const SessionContext = createContext<SessionContext | null>(null);

export default function SessionProvider({
  children,
  value,
}: React.PropsWithChildren<{ value: SessionContext }>) {
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentUserId = value.user?.id;
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
              lastViews: []
            });
          }
        } catch (error) {
          console.error('Failed to sync watched videos:', error);
        }
      }
    };
  
    handleUserChange();
    prevUserIdRef.current = currentUserId;
  }, [value.user?.id]);

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
// import React, { createContext, useContext, useEffect, useRef } from "react";
// import { videoDB } from "../lib/indexedDB";

// interface SessionContext {
//   user: User | null;
//   session: Session | null;
// }

// const SessionContext = createContext<SessionContext | null>(null);

// export default function SessionProvider({
//   children,
//   value,
// }: React.PropsWithChildren<{ value: SessionContext }>) {
//   const prevUserIdRef = useRef<string | undefined>(undefined);

//   useEffect(() => {
//     const currentUserId = value.user?.id;
//     const prevUserId = prevUserIdRef.current;

//     // 이전 사용자가 있고, 새로운 사용자가 다른 경우에만 초기화
//     if (prevUserId !== undefined && currentUserId !== prevUserId && currentUserId) {
//       videoDB.clearForNewUser().catch(error => {
//         console.error('Failed to clear data for new user:', error);
//       });
//     }

//     // 현재 사용자 ID 저장
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
