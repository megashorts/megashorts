'use client'

import { 
  FolderOpen,
  NotebookPen,
  PencilRuler,
  UserCog,
  Users
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";

export default function AuthMenuItems() {
  const { user } = useSession();

  if (!user) return null;

  return (
    <>
      <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">크리에이터</div>
      <Button
        key="content-new"
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/usermenu/postnew">
          <NotebookPen />
          <span className="hidden lg:inline">컨텐츠 등록</span>
        </Link>
      </Button>

      <Button
        key="content-manage"
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/usermenu/yourposts">
          <FolderOpen />
          <span className="hidden lg:inline">컨텐츠 관리</span>
        </Link>
      </Button>

      {/* <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">운영자 메뉴</div>
      <Button
        key="admin-manage"
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/usermenu/subscription">
          <PencilRuler />
          <span className="hidden lg:inline">운영관리</span>
        </Link>
      </Button>
      <Button
        key="user-manage"
        variant="ghost"
        className="flex items-center justify-start gap-3"
        asChild
      >
        <Link href="/usermenu/subscription">
          <UserCog />
          <span className="hidden lg:inline">사용자관리</span>
        </Link>
      </Button> */}
    </>
  );
}

// 'use client'

// import { 
//   FolderOpen,
//   NotebookPen,
//   PencilRuler,
//   UserCog,
//   Users
// } from "lucide-react";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { useSession } from "@/components/SessionProvider";

// export default function AuthMenuItems() {
//   const { user } = useSession();

//   if (!user) return null;

//   return (
//     <>
//       <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">크리에이터</div>
//       <Button
//         variant="ghost"
//         className="flex items-center justify-start gap-3"
//         asChild
//       >
//         <Link href="/usermenu/postnew">
//           <NotebookPen />
//           <span className="hidden lg:inline">컨텐츠 등록</span>
//         </Link>
//       </Button>

//       <Button
//         variant="ghost"
//         className="flex items-center justify-start gap-3"
//         asChild
//       >
//         <Link href="/usermenu/yourposts">
//           <FolderOpen />
//           <span className="hidden lg:inline">컨텐츠 관리</span>
//         </Link>
//       </Button>

//       <div className="text-xs font-medium text-gray-600 ml-4 hidden lg:inline pt-2">운영자 메뉴</div>
//       <Button
//         variant="ghost"
//         className="flex items-center justify-start gap-3"
//         asChild
//       >
//         <Link href="/usermenu/subscription">
//           <PencilRuler />
//           <span className="hidden lg:inline">운영관리</span>
//         </Link>
//       </Button>
//       <Button
//         variant="ghost"
//         className="flex items-center justify-start gap-3"
//         asChild
//       >
//         <Link href="/usermenu/subscription">
//           <UserCog />
//           <span className="hidden lg:inline">사용자관리</span>
//         </Link>
//       </Button>
//     </>
//   );
// }