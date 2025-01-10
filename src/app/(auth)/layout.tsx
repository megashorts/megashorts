import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthTitle } from "@/components/auth/AuthTitle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] w-screen flex-col bg-black md:items-center md:justify-center md:bg-transparent">
      {/* 배경 이미지 */}
      <div 
        className="absolute inset-0 -z-1
          bg-[url('/MS_BackImage1_1.webp')] 
          bg-no-repeat
          bg-[length:130%_auto]
          bg-[position:70%_15%]
          sm:bg-[length:80%_auto]
          sm:bg-[position:center_20%]
          md:bg-[length:40%_auto]
          md:bg-[position:center_15%]
          lg:bg-[length:50%_auto]
          transition-all duration-300 ease-in-out"
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* 메인 컨텐츠 */}
      <div className="relative flex min-h-[100dvh] w-full items-center justify-center">
        {/* 좌측 로고 */}
        <Link href="/" className="absolute left-4 top-4 object-contain md:left-10 md:top-6">
          <Image 
            src="/MSWebLogoSVG.svg" 
            alt="MEGASHORTS logo" 
            width={192} 
            height={48} 
            className="ml-1 mt-1"
          />
        </Link>

        {/* 컨텐츠 박스 */}
        <div 
          className="flex flex-col w-[78%] sm:w-[80%] md:w-[25rem] rounded border-white bg-black/60"
        >
          {/* 타이틀과 구분선 */}
          <AuthTitle />
          
          {/* 자식 컴포넌트를 위한 컨테이너 */}
          <div className="flex-1 px-4 py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
