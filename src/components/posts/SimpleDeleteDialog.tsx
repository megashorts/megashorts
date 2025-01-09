'use client';

import { PostData } from "@/lib/types";
import LoadingButton from "../LoadingButton";
import { Button } from "../ui/button";
import { useDeletePostMutation } from "./mutations";

interface SimpleDeleteDialogProps {
  post: PostData;
  open: boolean;
  onClose: () => void;
}

export default function SimpleDeleteDialog({
  post,
  open,
  onClose,
}: SimpleDeleteDialogProps) {
  const mutation = useDeletePostMutation();

  if (!open) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-lg bg-black p-6 shadow-lg">
        {/* 헤더 */}
        <div className="space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Delete post?
          </h2>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
        </div>

        {/* 푸터 */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
          <LoadingButton
            variant="destructive"
            onClick={() => {
              mutation.mutate(post.id, {
                onSuccess: () => {
                  onClose();
                }
              });
            }}
            loading={mutation.isPending}
          >
            Delete
          </LoadingButton>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}