import { Toaster } from "@/components/ui/toaster";
// import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";
// import { extractRouterConfig } from "uploadthing/server";
// import { fileRouter } from "./api/uploadthing/core";
import "./globals.css";
import ReactQueryProvider from "./ReactQueryProvider";

const BMDOHYEON = localFont({
  src: [
    { path: "./fonts/BMDOHYEON.woff2", weight: "normal" },
    { path: "./fonts/BMDOHYEON.woff", weight: "normal" },
  ],
  variable: "--font-BMDOHYEON",
});

// const NanumGothic = localFont({
//   src: [
//     { path: "./fonts/NanumGothic.woff2", weight: "normal" },
//     { path: "./fonts/NanumGothic.woff", weight: "normal" },
//   ],
//   variable: "--font-NanumGothic",
// });

// const NanumGothicBold = localFont({
//   src: [
//     { path: "./fonts/NanumGothicBold.woff2", weight: "normal" },
//     { path: "./fonts/NanumGothicBold.woff", weight: "normal" },
//   ],
//   variable: "--font-NanumGothicBold",
// });

export const metadata: Metadata = {
  title: "MS",
  description: "Short form contents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${BMDOHYEON.variable} ${BMDOHYEON.variable}`}>
        {/* <NextSSRPlugin routerConfig={extractRouterConfig(fileRouter)} /> */}
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            // defaultTheme="light"
            defaultTheme="dark"  // 여기서 기본 테마를 다크로 설정
            enableSystem={false} // 시스템 테마 적용을 막음
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
