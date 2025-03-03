'use client'

import Navbar from '../(main)/Navbar';
import { useEffect, useState } from 'react';
import SessionProvider from '@/components/SessionProvider';
import { Session, User } from 'lucia';
import MenuBar from './MenuBar';
import Footer from '@/components/footer';
import { MainPopupModal } from '@/components/MainPopupModal';
import { useQuery } from '@tanstack/react-query';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // React Query를 사용하여 세션 데이터 가져오기 (최적화 설정 추가)
  const { data: sessionData = { user: null, session: null } } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/session');
      return res.json();
    },
    // 불필요한 API 호출 방지 설정
    refetchOnMount: false,      // 컴포넌트 마운트 시 자동 갱신 비활성화
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 갱신 비활성화
    refetchOnReconnect: false,   // 네트워크 재연결 시 자동 갱신 비활성화
    staleTime: Infinity,         // 데이터가 절대 오래된 것으로 간주되지 않도록 설정
  });

  // 모바일에서 불필요한 포커스 방지
  useEffect(() => {
    // input, textarea, [contenteditable="true"] 제외한 모든 요소에 적용
    const preventFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName !== 'INPUT' && 
        target.tagName !== 'TEXTAREA' && 
        target.getAttribute('contenteditable') !== 'true' &&
        !target.closest('[role="searchbox"]') && // 검색 관련 요소 제외
        !target.closest('.video-container')  // 비디오 컨테이너 제외
      ) {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };
  
    // capture만 사용
    document.addEventListener('touchstart', preventFocus, { 
      capture: true
    });
    
    return () => {
      document.removeEventListener('touchstart', preventFocus, { 
        capture: true
      });
    };
  }, []);

  // useEffect(() => {
  //   fetch('/api/auth/session')
  //     .then(res => res.json())
  //     .then(data => setSessionData(data));
  // }, []);

  return (
    <SessionProvider value={sessionData}>
      <div className="relative">
        <Navbar />
        <div className="absolute inset-0 pt-[45px] md:pt-[64px]">
          <main className="w-full max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="flex min-h-screen flex-col">
              <div className="mx-auto flex w-full max-w-7xl grow gap-1 sm:pt-2 md:gap-2">
                <MenuBar className="relative h-fit flex-none space-y-1 rounded-2xl bg-card px-2 py-3 shadow-sm lg:px-3 xl:w-56" />
                {children}
              </div>
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}

// import { validateRequest } from '@/lib/auth';
// import Navbar from "./Navbar";
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/app-sidebar";
// import SessionProvider from '@/components/SessionProvider';

// export default async function Layout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const session = await validateRequest();

//   return (
//     <>
//       <SessionProvider value={session}>
//         <div className="relative">
//           {/* <SidebarProvider defaultOpen={false}> */}
//             <Navbar />
//             {/* <AppSidebar /> */}
//             <div className="absolute inset-0 pt-[64px]">
//               <main className="w-full max-w-7xl mx-auto sm:px-6 lg:px-8">
//                 {children}
//               </main>
//             </div>
//           {/* </SidebarProvider> */}
//         </div>
//       </SessionProvider>
//     </>
//   );
// }
