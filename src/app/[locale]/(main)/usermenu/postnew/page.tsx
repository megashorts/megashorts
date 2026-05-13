import { PostEditor } from "@/components/posts/editor/PostEditor";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";

export default async function PostNewPage() {
  const { user } = await validateRequest();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">새 포스트 작성</h1>
      <PostEditor />
    </div>
  );
}
