import { PostEditor } from "@/components/posts/editor/PostEditor";
import NoticeSidebar from "@/components/NoticeSidebar";

export default function Home() {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">컨텐츠 등록</h1>
        </div>
        <PostEditor />
      </div>
      <NoticeSidebar />
    </main>
  );
}
