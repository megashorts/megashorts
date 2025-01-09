'use client'

import Navbar from '../(main)/Navbar';
import { useEffect, useState } from 'react';
import SessionProvider from '@/components/SessionProvider';
import { Session, User } from 'lucia';
import MenuBar from './MenuBar';
import Footer from '@/components/footer';
import { MainPopupModal } from '@/components/MainPopupModal';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionData, setSessionData] = useState<{
    user: User | null;
    session: Session | null;
  }>({
    user: null,
    session: null
  });

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSessionData(data));
  }, []);

  return (
    <SessionProvider value={sessionData}>
      <div className="relative">
        <Navbar />
        <div className="absolute inset-0 pt-[64px]">
          <main className="w-full max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="flex min-h-screen flex-col">
            <MainPopupModal />
              <div className="mx-auto flex w-full max-w-7xl grow gap-1 pt-1 sm:pt-3 md:gap-2">
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
