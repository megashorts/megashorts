import { PostEditor } from "@/components/posts/editor/PostEditor";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function PostNewPage() {
  const { user } = await validateRequest();
  const tEditor = await getTranslations('PostEditor');

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">{tEditor('newPost')}</h1>
      <PostEditor />
    </div>
  );
}
