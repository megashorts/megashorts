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
  
  const isAdmin = user?.userRole && user.userRole >= USER_ROLE.OPERATION1;

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
              <p className="pl-1 hidden md:block">Team Master</p>
            </TabsTrigger>
          )}
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-5 h-5 md:w-6 md:h-6" />
            <p className="pl-1 hidden md:block">Settings</p>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-5 h-5 md:w-6 md:h-6" />
            <p className="pl-1 hidden md:block">Lookup</p>
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
