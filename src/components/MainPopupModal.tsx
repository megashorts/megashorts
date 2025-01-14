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

  const handleCheckboxArea = (e: React.MouseEvent) => {
    e.stopPropagation(); // 체크박스 영역 클릭 시 모달 닫힘 방지
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={handleClose} >
      <div className="relative w-[75%] md:w-[35%] md:max-w-[450px] bg-red-500 rounded-lg">
        <div className="relative">
          <Link href="/notice/f9c6e2ee-dd89-4387-9c5b-4dcf99537d1b" onClick={handleClose} >
            <Image
              src="/MG_AdImageOri.webp"
              alt="Main Popup"
              width={2000}
              height={1500}
              priority
              className="w-full h-auto rounded-lg cursor-pointer shadow-md shadow-slate-500"
            />
          </Link>
          
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          
          <div 
            className="absolute bottom-3 left-3 flex items-center gap-2 text-white"
            onClick={handleCheckboxArea}  // 체크박스 영역 클릭 시 모달 닫힘 방지
          >
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
              className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              오늘은 그만보기
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}