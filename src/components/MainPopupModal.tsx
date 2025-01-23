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
      <div className="relative w-[70%] md:w-[45%] lg:w-[30%] md:max-w-[450px] bg-red-500 rounded-lg">
        <div className="relative">
          <Link href="/notice/f9c6e2ee-dd89-4387-9c5b-4dcf99537d1b" onClick={handleClose}>
            {/* 이미지 컨테이너에 명확한 크기 지정 */}
            <div className="relative w-full aspect-[2/3]">  {/* 가로:세로 비율 2:3 유지 */}
              <div className="relative w-full h-full">      {/* fill을 위한 relative 컨테이너 */}
                <Image
                  src="/MS Poster5.webp"
                  alt="Main Popup"
                  fill                                      
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 70vw, (max-width: 1200px) 30vw, 450px"  
                  priority
                />
              </div>
            </div>
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
              className="text-base text-muted-foreground translate-y-0.5 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              오늘은 그만보기
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}