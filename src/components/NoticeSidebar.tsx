import Image from "next/image";
import Link from "next/link";

// <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}> => sidebar loading indicator
export default function NoticeSidebar() {
  return (
    <div className="relative hidden h-fit w-60 flex-none space-y-5 md:block lg:w-60 ml-2">
              <div className="relative w-full aspect-[2/3]">
                <Link 
                    href={`/subscription`}
                    // className="p-2 hover:bg-accent rounded-full transition-colors"
                  >
                  <Image
                    // src={post.thumbnailUrl || '/post-placeholder.jpg'}
                    // alt={post.title || '포스트 썸네일'}
                    src='/MG_AdImageOri2.webp'
                    alt="ad thumnail"
                    fill
                    className="object-cover rounded-lg"
                    priority
                  />
                </Link>

              </div>
    </div>
  );
}
