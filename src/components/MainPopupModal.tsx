"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function MainPopupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastClosed = localStorage.getItem('mainPopupLastClosed');
    
    if (lastClosed !== today) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (hideToday) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('mainPopupLastClosed', today);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-[75%] md:w-[35%] md:max-w-[450px] bg-red-500 rounded-lg">
        {/* 이미지 */}
        <div className="relative">
          <Link href="/notice/8412ab3b-38a0-4a8d-8dbe-ddb0966a6f92">
            <Image
              src="/MG_AdImageOri.webp"
              alt="Main Popup"
              width={2000}
              height={1500}
              priority
              className="w-full h-auto rounded-lg cursor-pointer shadow-md shadow-slate-500"
            />
          </Link>
          
          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          
          {/* 하단 체크박스 */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
            <Checkbox
              id="hideToday"
              checked={hideToday}
              onCheckedChange={(checked) => {
                setHideToday(checked as boolean);
              }}
              className="bg-white/10 backdrop-blur-sm border-white/50"
            />
            <label
              htmlFor="hideToday"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              오늘은 그만보기
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}