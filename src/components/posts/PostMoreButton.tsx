'use client';

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";  // useState import 추가

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { PostData } from "@/lib/types";
import SimpleDeleteDialog from "./SimpleDeleteDialog";
import { useSession } from "../SessionProvider";
import { useRouter } from "next/navigation";

interface PostMoreButtonProps {
  post: PostData;
  className?: string;
}

export default function PostMoreButton({
  post,
  className,
}: PostMoreButtonProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useSession();
  const router = useRouter();
  
  // 권한이 없는 경우 버튼을 숨김
  if (!user || user.id !== post.user.id) {
    return null;
  }

  const handleEdit = () => {
    router.push(`/usermenu/posts/${post.id}/edit`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={className}>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleEdit}>
            <span className="flex items-center gap-3">
              <Pencil className="size-4" />
              포스트 수정
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
            <span className="flex items-center gap-3">
              <Trash2 className="size-4 text-destructive" />
              포스트 삭제
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SimpleDeleteDialog
        post={post}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
// 'use client';

// import { PostData } from "@/lib/types";
// import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
// import { useState } from "react";
// import { Button } from "../ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "../ui/dropdown-menu";
// import DeletePostDialog from "./DeletePostDialog";
// import { useRouter } from "next/navigation";

// interface PostMoreButtonProps {
//   post: PostData;
//   className?: string;
// }

// export default function PostMoreButton({
//   post,
//   className,
// }: PostMoreButtonProps) {
//   const router = useRouter();

//   const handleEdit = () => {
//     router.push(`/edit/${post.id}`);
//   };
  
//   const handleDelete = () => {
//     setShowDeleteDialog(true);
//   };
  
//   const handleDeleteComplete = () => {
//     setShowDeleteDialog(false);
//     router.refresh(); // 페이지 데이터 새로고침
//   };

//   return (
//     <>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button size="icon" variant="ghost" className={className}>
//             <MoreHorizontal className="size-5 text-muted-foreground" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent>
//         <DropdownMenuItem onClick={handleEdit}>  // 수정 버튼
//           <span className="flex items-center gap-3">
//             <Pencil className="size-4" />
//             포스트 수정
//           </span>
//         </DropdownMenuItem>
//         <DropdownMenuItem onClick={handleDelete}>  // 삭제 버튼
//           <span className="flex items-center gap-3">
//             <Trash2 className="size-4 text-destructive" />
//             포스트 삭제
//           </span>
//         </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//       <DeletePostDialog
//         post={post}
//         open={showDeleteDialog}
//         onClose={() => setShowDeleteDialog(false)}
//         onDelete={handleDeleteComplete}
//       />
//     </>
//   );
// }
