import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-screen w-screen flex-col bg-black md:items-center md:justify-center md:bg-transparent">
      {/* 배경 이미지 */}
      <div 
        className="absolute inset-0 -z-1
          bg-[url('/MS_BackImage1_1.webp')] 
          bg-no-repeat
          bg-[length:180%_auto]
          bg-[position:60%_6%]
          sm:bg-[length:120%_auto]
          sm:bg-[position:center_20%]
          md:bg-[length:90%_auto]
          md:bg-[position:center_15%]
          lg:bg-[length:75%_auto]
          transition-all duration-300 ease-in-out"
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* 메인 컨텐츠 */}
      <div className="relative flex min-h-screen w-full items-center justify-center">
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

        {/* 자식 컴포넌트 */}
        <div 
          className="flex flex-col items-center justify-center rounded bg-black/60 py-4 sm:py-3 px-4
          w-80 sm:w-96 md:w-[20rem] 
          h-[46vh] sm:h-[65vh] md:h-[41vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
