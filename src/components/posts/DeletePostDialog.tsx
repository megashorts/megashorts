// import { PostData } from "@/lib/types";
// import LoadingButton from "../LoadingButton";
// import { Button } from "../ui/button";
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "../ui/dialog";
// import { useDeletePostMutation } from "./mutations";
// import { useEffect, useRef } from "react";

// interface DeletePostDialogProps {
//   post: PostData;
//   open: boolean;
//   onClose: () => void;
// }

// export default function DeletePostDialog({
//   post,
//   open,
//   onClose,
// }: DeletePostDialogProps) {
//   const mutation = useDeletePostMutation();

//   // mutation이 성공하면 Dialog를 닫고 Overlay 제거
//   useEffect(() => {
//     if (mutation.isSuccess) {
//       onClose();
//       // 약간의 지연 후 모든 Overlay 제거
//       setTimeout(() => {
//         const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
//         overlays.forEach(overlay => {
//           if (overlay instanceof HTMLElement) {
//             overlay.style.display = 'none';
//             overlay.remove();  // DOM에서 완전히 제거
//           }
//         });
//       }, 100);
//     }
//   }, [mutation.isSuccess, onClose]);

//   return (
//     <Dialog 
//       open={open} 
//       onOpenChange={(open) => {
//         if (!open && !mutation.isPending) {
//           onClose();
//         }
//       }}
//     >
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Delete post?</DialogTitle>
//           <DialogDescription>
//             Are you sure you want to delete this post? This action cannot be undone.
//           </DialogDescription>
//         </DialogHeader>
//         <DialogFooter>
//           <LoadingButton
//             variant="destructive"
//             onClick={() => mutation.mutate(post.id)}
//             loading={mutation.isPending}
//           >
//             Delete
//           </LoadingButton>
//           <Button
//             variant="outline"
//             onClick={onClose}
//             disabled={mutation.isPending}
//           >
//             Cancel
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }