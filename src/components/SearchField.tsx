// "use client";

// import { SearchIcon } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { Input } from "./ui/input";

// export default function SearchField() {
//   const router = useRouter();

//   function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     const form = e.currentTarget;
//     const q = (form.q as HTMLInputElement).value.trim();
//     if (!q) return;
//     router.push(`/search?q=${encodeURIComponent(q)}`);
//   }

//   return (
//     <form onSubmit={handleSubmit} method="GET" action="/search">
//       <div className="relative">
//         <Input name="q" placeholder="Search" className="pe-10" />
//         <SearchIcon className="absolute right-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
//       </div>
//     </form>
//   );
// }

"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { useState } from "react";

export default function SearchField() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.q as HTMLInputElement).value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setIsOpen(false);  // 검색 후 필드 닫기
  }

  return (
    <form onSubmit={handleSubmit} method="GET" action="/search">
      <div className="relative flex items-center">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-md hover:text-primary"
          >
            <SearchIcon className="size-5" />
          </button>
        ) : (
          <div className="fixed left-0 right-0 top-0 p-4 bg-background md:relative md:p-0 md:bg-transparent">
            <Input
              name="q"
              placeholder="Search"
              className="w-full md:w-[180px]"
              autoFocus
              onBlur={() => setIsOpen(false)}
            />
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 -translate-x-3 text-muted-foreground" />
          </div>
        )}
      </div>
    </form>
  );
}

