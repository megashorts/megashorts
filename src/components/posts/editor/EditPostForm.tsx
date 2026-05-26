import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePost } from "@/hooks/usePosts";
import { PostEditor } from "./PostEditor";
import { PostData } from "@/lib/types";
import { useTranslations } from "next-intl";

export default function EditPostForm() {
  const params = useParams();
  const router = useRouter();
  const tEditor = useTranslations('PostEditor');
  const tCommon = useTranslations('Common');
  const { data: post, isLoading, error } = usePost(params.postId as string);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {tCommon('error')}: {error.message}
      </div>
    );
  }

  // post 데이터를 PostData 타입으로 타입 단언
  const editorInitialData = post as unknown as PostData;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{tEditor('editPost')}</h1>
      <PostEditor initialData={editorInitialData} />
    </div>
  );
}
