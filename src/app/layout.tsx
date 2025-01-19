import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";
import "./globals.css";
import ReactQueryProvider from "./ReactQueryProvider";
import { OrientationModal } from "@/components/OrientationModal";

const BMDOHYEON = localFont({
  src: [
    { path: "./fonts/BMDOHYEON.woff2", weight: "normal" },
    { path: "./fonts/BMDOHYEON.woff", weight: "normal" },
  ],
  variable: "--font-BMDOHYEON",
});

export const metadata: Metadata = {
  title: "메가쇼츠 MEGASHORTS",
  description: "글로벌 No.1 숏폼컨텐츠 오픈형 플랫폼",
  openGraph: {
    type: "website",
    locale: "ko_KR", // 언어 설정
    url: "https://megashorts.vercel.app/", // 웹사이트 URL
    title: "메가쇼츠 MEGASHORTS",
    description: "글로벌 No.1 숏폼컨텐츠 오픈형 플랫폼",
    siteName: "MEGASHORTS", // 사이트 이름
    images: [
      {
        url: "/MS_OCimage.webp", // OG 이미지 URL
        width: 1200, // 이미지 너비
        height: 630, // 이미지 높이
        alt: "MEGASHORTS 로고", // 대체 텍스트
      },
    ],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${BMDOHYEON.variable}`}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <OrientationModal />
          </ThemeProvider>
        </ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
