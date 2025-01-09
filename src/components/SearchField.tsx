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
import { useState, useRef } from "react";

export default function SearchField() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false); // 검색 박스 열림 상태
  const searchRef = useRef<HTMLDivElement>(null); // 검색 박스 참조

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.q as HTMLInputElement).value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // 검색 박스가 클릭된 상태가 아닐 때 닫기
    if (searchRef.current && !searchRef.current.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} method="GET" action="/search">
      <div 
        ref={searchRef}
        className="relative min-w-[40px]" 
        onBlur={handleBlur}
      >
        {!isOpen ? (
          <div className="flex items-center justify-center w-10 h-10">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="p-2.5 rounded-md transition-colors hover:bg-transparent hover:text-primary "
            >
              <SearchIcon className="size-6 text-muted-foreground hover:bg-transparent hover:text-primary" />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <Input
              name="q"
              placeholder="Search"
              className="w-[200px] pe-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <SearchIcon className="size-5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </form>
  );
}


