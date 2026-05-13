import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: "이용약관",
};

// 빌드 시점에 한 번만 실행
const content = fs.readFileSync(
  path.join(process.cwd(), 'public/locales/ko/policy.md'),
  'utf-8'
);

export default function PolicyPage() {  // params 제거
  return (
    <div className="w-full mb-16">
      {/* 상단 이미지 섹션 */}
      <div className="relative h-[100px] sm:h-[300px] md:h-[200px] mx-4 ">
        <Image
          src="/msBack_meetingV2.webp"
          alt="Policy Header"
          fill
          priority
          className="object-cover rounded-sm"
          sizes="(max-width: 640px) 90vw, (max-width: 768px) 100vw, 90vw"
        />
        <div className="absolute inset-0 bg-black/50 flex items-end justify-start pl-8 pb-5">
          <h1 className="text-2xl md:text-3xl lg:text-3xl font-bold text-white">
            이용약관
          </h1>
        </div>
        <div className="absolute top-5 right-5">
          <Image
            src="/MS Logo emblem.svg"
            alt="MEGASHORTS emblem"
            width={70}
            height={70} 
            className="rounded-full w-[30px] md:w-[45px] lg:w-[70px] shadow-lg"
            style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)" }}
          />
        </div>
      </div>

      {/* 콘텐츠 섹션 */}
      <div className="container mx-auto px-4 py-2 sm:py-3 max-w-4xl">
        <ReactMarkdown 
          className="prose prose-sm sm:prose lg:prose-lg max-w-none"
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-2xl font-bold mb-8 text-white" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-xl font-semibold mt-6 mb-4 text-white" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="my-2 text-slate-500 leading-relaxed text-sm" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-5 my-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-5 my-4" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="my-2 text-slate-500 text-sm" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600" {...props} />
            ),
            code: ({ node, ...props }) => (
              <code className="bg-slate-200 text-slate-700 px-2 py-1 rounded" {...props} />
            ),
            a: ({ node, ...props }) => (
              <a className="text-blue-500 hover:underline" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// import React from 'react';
// import Image from 'next/image';
// import ReactMarkdown from 'react-markdown';
// import fs from 'fs';
// import path from 'path';

// // 페이지 props 타입 정의
// interface PageProps {
//   params: { locale?: string };
//   searchParams: { [key: string]: string | string[] | undefined };
// }

// // 마크다운 파일 읽기 함수
// async function getPolicyContent(locale: string = 'ko') {
//   try {
//     const filePath = path.join(process.cwd(), `public/locales/${locale}/policy.md`);
//     const content = await fs.promises.readFile(filePath, 'utf-8');
//     return content;
//   } catch (error) {
//     // 에러 시 한국어 파일로 폴백
//     try {
//       const fallbackPath = path.join(process.cwd(), 'public/locales/ko/policy.md');
//       return await fs.promises.readFile(fallbackPath, 'utf-8');
//     } catch {
//       return '# 이용약관\n\n약관 내용을 불러올 수 없습니다.';
//     }
//   }
// }

// // 메인 컴포넌트
// export default async function PolicyPage({ params }: PageProps) {
//   console.log(`[Server] Rendering policy page:`, new Date().toISOString());

//   const locale = params.locale || 'ko';
//   const content = await getPolicyContent(locale);

//   return (
//     <div className="w-full mb-16">
//       {/* 상단 이미지 섹션 */}
//       <div className="relative h-[100px] sm:h-[300px] md:h-[200px] mx-4 ">
//         <Image
//           src="/msBack_meetingV2.webp"
//           alt="Policy Header"
//           fill
//           priority
//           className="object-cover rounded-sm"
//           sizes="(max-width: 640px) 90vw, (max-width: 768px) 100vw, 90vw"
//         />
//         <div className="absolute inset-0 bg-black/50 flex items-end justify-start pl-8 pb-5">
//           <h1 className="text-2xl md:text-3xl lg:text-3xl font-bold text-white">
//             이용약관
//           </h1>
//         </div>
//         <div className="absolute top-5 right-5">
//           <Image
//             src="/MS Logo emblem.svg"
//             alt="MEGASHORTS emblem"
//             width={70} // 상단 이미지의 약 15% 크기
//             height={70} 
//             className="rounded-full 
//             w-[30px] md:w-[45px] lg:w-[70px]
//             shadow-lg"
//             style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)" }}
//           />
//         </div>
//       </div>

//       {/* 콘텐츠 섹션 */}
//       <div className="container mx-auto px-4 py-2 sm:py-3 max-w-4xl">
//         <ReactMarkdown 
//           className="prose prose-sm sm:prose lg:prose-lg max-w-none"

//           components={{
//             h1: ({ node, ...props }) => (
//               <h1 className="text-2xl font-bold mb-8 text-white" {...props} />
//             ),
//             h2: ({ node, ...props }) => (
//               <h2 className="text-xl font-semibold mt-6 mb-4 text-white" {...props} />
//             ),
//             p: ({ node, ...props }) => (
//               <p className="my-2 text-slate-500 leading-relaxed text-sm" {...props} />
//             ),
//             ul: ({ node, ...props }) => (
//               <ul className="list-disc pl-5 my-4" {...props} />
//             ),
//             ol: ({ node, ...props }) => (
//               <ol className="list-decimal pl-5 my-4" {...props} />
//             ),
//             li: ({ node, ...props }) => (
//               <li className="my-2 text-slate-500 text-sm" {...props} />
//             ),
//             blockquote: ({ node, ...props }) => (
//               <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600" {...props} />
//             ),
//             code: ({ node, ...props }) => (
//               <code className="bg-slate-200 text-slate-700 px-2 py-1 rounded" {...props} />
//             ),
//             // img: ({ node, ...props }) => (
//             //   <img className="rounded-md shadow-md" alt="Markdown Image" {...props} />
//             // ),
//             a: ({ node, ...props }) => (
//               <a className="text-blue-500 hover:underline" {...props} />
//             ),
//           }}

//         >
//           {content}
//         </ReactMarkdown>
//       </div>
//     </div>
//   );
// }

// // 정적 페이지 파라미터 생성
// export async function generateStaticParams() {
//   return [{ locale: 'ko' }];  // 기본적으로 한국어만 지원
// }
