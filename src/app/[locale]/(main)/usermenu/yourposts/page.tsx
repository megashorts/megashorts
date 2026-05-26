
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import YourPosts from "./Yourposts";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const tUserMenu = await getTranslations('UserMenu');

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-xl bg-card p-2 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-base sm:text-xl font-bold">{tUserMenu('myContent')}</h1>
        </div>
        <Tabs defaultValue="published">
          <TabsList>
            <TabsTrigger value="published">{tUserMenu('publishedContent')}</TabsTrigger>
            <TabsTrigger value="draft">{tUserMenu('draftContent')}</TabsTrigger>
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
