'use client';

import { Flag } from "lucide-react";
import { useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";
import { InquiryType } from "@prisma/client";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

interface ReportDialogProps {
  type: InquiryType;
  postId?: string;
  postTitle?: string | null;   
  title: string;  // 문의 유형 제목
}

export default function ReportDialog({ type, postId, postTitle, title: typeTitle }: ReportDialogProps) {
  const router = useRouter();
  const { user } = useSession();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");  // 사용자 입력 제목
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();

  const handleOpen = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const response = await kyInstance.get('/api/user/email').json<{ email: string }>();
      setUserEmail(response.email);
      dialogRef.current?.showModal();
    } catch (error) {
      console.error('Failed to fetch user email:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) {
      toast({
        variant: "default",
        description: "제목과 내용을 입력해주세요.",
        duration: 1500,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await kyInstance.post('/api/admin/inquiry', {
        json: {
          type,
          title,  // 사용자가 입력한 제목
          content,
          ...(postId && { postId }),
          userEmail,
        },
      });

      toast({
        variant: "default",
        description: "접수되었습니다.",
        duration: 1500,
      });
      setContent("");
      setTitle("");
      dialogRef.current?.close();
    } catch (error) {
      toast({
        variant: "destructive",
        description: "접수중 오류가 발생하였습니다.",
        duration: 1500,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="text-left md:text-right">
        <button
          onClick={handleOpen}
          className="inline-flex items-center justify-center gap-2 py-3 text-xs md:text-sm rounded-md hover:text-red-500 bg-slate-950 w-[100px]"
        >
          <Flag className="w-4 h-4" />
          {typeTitle}
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="p-4 rounded-lg shadow-lg border backdrop:bg-black/50 dark:bg-black"
        onClose={() => {
          setContent("");
          setTitle("");
        }}
      >
        <form onSubmit={handleSubmit} className="w-[320px] md:w-[400px]">
          <h2 className="text-lg font-semibold mb-4 ml-2 mt-3">{typeTitle}</h2>

          <div className="w-[315px] md:w-[395px] mx-auto border-t border-gray-300 dark:border-gray-600 my-4"></div>

          <div className="space-y-5 text-sm">
            <div className="text-muted-foreground ml-2">{user?.displayName}</div>
            <div className="text-muted-foreground ml-2">{userEmail}</div>
    
            {postTitle && <div className="ml-2">{postTitle}</div>}

            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="내용을 입력하세요"
                className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-4 py-2 text-sm text-black rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 bg-white"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-white rounded-md disabled:opacity-50 hover:text-black mb-4"
            >
              {isSubmitting ? "제출 중..." : "제출하기"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}