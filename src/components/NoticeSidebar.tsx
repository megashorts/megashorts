import Image from "next/image";
import Link from "next/link";

// <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}> => sidebar loading indicator
export default function NoticeSidebar() {
  return (
    <div className="relative hidden h-fit flex-none space-y-5 md:block lg:w-60 ml-2">
      <Link href={`/subscription`}>
        <div className="relative w-full h-[360px]">
          <div className="relative w-full h-full">  {/* Image를 감싸는 relative div 추가 */}
            <Image
              src='/MG_AdImageOri2.webp'
              alt="ad thumnail"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 30vw, 30vw"
              className="object-cover rounded-lg"
              priority
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
