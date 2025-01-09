"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollContainerProps extends React.PropsWithChildren {
  onBottomReached: () => void;
  className?: string;
}

export default function InfiniteScrollContainer({
  children,
  onBottomReached,
  className,
}: InfiniteScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current) return;

      const container = containerRef.current;
      if (!container) return;

      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const scrollTop = Math.max(
        document.documentElement.scrollTop,
        document.body.scrollTop
      );
      const clientHeight = document.documentElement.clientHeight;

      // 스크롤이 하단에서 500px 이내일 때 로드
      if (scrollHeight - scrollTop - clientHeight < 600) {
        loadingRef.current = true;
        onBottomReached();
        
        // 1초 후에 다시 로드 가능하도록 설정
        setTimeout(() => {
          loadingRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onBottomReached]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// import { useInView } from "react-intersection-observer";

// interface InfiniteScrollContainerProps extends React.PropsWithChildren {
//   onBottomReached: () => void;
//   className?: string;
// }

// export default function InfiniteScrollContainer({
//   children,
//   onBottomReached,
//   className,
// }: InfiniteScrollContainerProps) {
//   const { ref } = useInView({
//     rootMargin: "200px",
//     onChange(inView) {
//       if (inView) {
//         onBottomReached();
//       }
//     },
//   });

//   return (
//     <div className={className}>
//       {children}
//       {/* <div ref={ref} /> */}
//       <div ref={ref} className="h-1" />
//     </div>
//   );
// }
