import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";
import Bookmarks from "./Bookmarks";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import WatchingContent from "./WatchingContent";

export const metadata: Metadata = {
  title: "Bookmarks",
};

export default async function Page() {

  const { user } = await validateRequest();
  
  // 모바일 체크
  const userAgent = (await headers()).get('user-agent') || '';
  const isMobile = userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i);

  // 로그인하지 않은 경우
  if (!user) {
    // 모바일에서는 로그인 페이지로 리디렉션
    if (isMobile) {
      redirect('/login');
    }
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">나의 컨텐츠</h1>
        </div>
        <Tabs defaultValue="published">
          <TabsList>
            <TabsTrigger value="published">북마크 컨텐츠</TabsTrigger>
            <TabsTrigger value="draft">시청중인 컨텐츠</TabsTrigger>
          </TabsList>
          <TabsContent value="published">
            <Bookmarks />
          </TabsContent>
          <TabsContent value="draft">
            <WatchingContent />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
