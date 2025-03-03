// src/app/(main)/admin/agency/components/AgencyTabs.tsx

"use client";

import { lazy, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, Search, Users } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { USER_ROLE } from "@/lib/constants";

// LoadingSpinner 컴포넌트 추가
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

// lazy 로딩 적용
const Agencysettings = lazy(() => import("./Agencysettings"));
const Agencysearch = lazy(() => import("./Agencysearch"));
const TeamMasterSettings = lazy(() => import("./TeamMasterSettings"));

export default function AgencyTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "settings";
  const { user } = useSession();
  
  // 관리자 권한 확인 (OPERATION3 이상)
  const isAdmin = user?.userRole && user.userRole >= USER_ROLE.OPERATION3;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {isAdmin && (
            <TabsTrigger value="teammaster" className="flex items-center gap-2">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
              <p className="pl-1 hidden md:block">팀마스터</p>
            </TabsTrigger>
          )}
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-5 h-5 md:w-6 md:h-6" />
            <p className="pl-1 hidden md:block">설정</p>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-5 h-5 md:w-6 md:h-6" />
            <p className="pl-1 hidden md:block">조회</p>
          </TabsTrigger>
        </TabsList>
        
        {isAdmin && (
          <TabsContent value="teammaster" className="mt-2">
            {currentTab === "teammaster" && (
              <Suspense fallback={<LoadingSpinner />}>
                <TeamMasterSettings />
              </Suspense>
            )}
          </TabsContent>
        )}
        
        <TabsContent value="settings" className="mt-2">
          {currentTab === "settings" && (
            <Suspense fallback={<LoadingSpinner />}>
              <Agencysettings />
            </Suspense>
          )}
        </TabsContent>
        
        <TabsContent value="search" className="mt-2">
          {currentTab === "search" && (
            <Suspense fallback={<LoadingSpinner />}>
              <Agencysearch />
            </Suspense>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// "use client";

// import { lazy, Suspense, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Separator } from "@/components/ui/separator";
// import { FileClock, Headset, SquareStack } from "lucide-react";
// import { useSession } from "@/components/SessionProvider";
// import LoadingSpinner from "../../service/components/LoadingSpinner";

// const Agencysettings = lazy(() => import("./Agencysettings"));
// const Agencysearch = lazy(() => import("./Agencysearch"));

// export default function ServiceTabs() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const currentTab = searchParams.get("tab") || "notice";
//   const { user } = useSession();
//   const displayName = user?.displayName;

//   const handleTabChange = (value: string) => {
//     const params = new URLSearchParams(searchParams);
//     params.set("tab", value);
//     router.push(`?${params.toString()}`, { scroll: false });
//   };

//   return (
//     <div>
//       <Tabs value={currentTab} onValueChange={handleTabChange}>
//         <TabsList>
//           <TabsTrigger value="agencySearch" className="flex items-center gap-2">
//             <SquareStack className="w-5 h-5 md:w-6 md:h-6" />
//             <p className="pl-1 hidden md:block">Main modal</p>
//           </TabsTrigger>
//           <TabsTrigger value="agencySettings" className="flex items-center gap-2">
//             <Headset className="w-5 h-5 md:w-6 md:h-6" />
//             <p className="pl-1 hidden md:block">inquiry</p>
//           </TabsTrigger>
//         </TabsList>
//         <TabsContent value="agencySearch" className="space-y-4">
//           {currentTab === "agencySearch" && (
//             <Suspense fallback={<LoadingSpinner />}>
//               <Agencysearch />
//             </Suspense>
//           )}
//         </TabsContent>
//         <TabsContent value="agencySettings" className="space-y-4">
//           {currentTab === "agencySettings" && (
//             <Suspense fallback={<LoadingSpinner />}>
//               <Agencysettings />
//             </Suspense>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }
