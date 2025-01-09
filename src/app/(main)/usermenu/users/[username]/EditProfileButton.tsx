"use client";

import { Button } from "@/components/ui/button";
import { UserData } from "@/lib/types";
import { useState } from "react";
import { Settings } from "lucide-react"; // lucide-react에서 톱니바퀴 아이콘 가져오기
import EditProfileDialog from "./EditProfileDialog";

interface EditProfileButtonProps {
  user: UserData;
}

export default function EditProfileButton({ user }: EditProfileButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        <Settings className="w-5 h-5" /> {/* 아이콘 렌더링 */}
      </Button>
      <EditProfileDialog
        user={user}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}



// "use client";

// import { Button } from "@/components/ui/button";
// import { UserData } from "@/lib/types";
// import { useState } from "react";
// import EditProfileDialog from "./EditProfileDialog";

// interface EditProfileButtonProps {
//   user: UserData;
// }

// export default function EditProfileButton({ user }: EditProfileButtonProps) {
//   const [showDialog, setShowDialog] = useState(false);

//   return (
//     <>
//       <Button variant="outline" onClick={() => setShowDialog(true)}>
//         관리하기
//       </Button>
//       <EditProfileDialog
//         user={user}
//         open={showDialog}
//         onOpenChange={setShowDialog}
//       />
//     </>
//   );
// }
