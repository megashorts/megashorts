
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import YourPosts from "./Yourposts";

export default function Home() {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">나의 컨텐츠</h1>
        </div>
        <Tabs defaultValue="published">
          <TabsList>
            <TabsTrigger value="published">게시된 컨텐츠</TabsTrigger>
            <TabsTrigger value="draft">임시저장 컨텐츠</TabsTrigger>
          </TabsList>
          <TabsContent value="published">
            <YourPosts status="PUBLISHED" />
          </TabsContent>
          <TabsContent value="draft">
            <YourPosts status="DRAFT" />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
