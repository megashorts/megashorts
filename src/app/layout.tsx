import { Toaster } from "@/components/ui/toaster";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";
import "./globals.css";
import ReactQueryProvider from "./ReactQueryProvider";
import { OrientationModal } from "@/components/OrientationModal";

const BMDOHYEON = localFont({
  src: './fonts/BMDOHYEON.woff2',  // src/app/fonts 폴더 내의 폰트 파일
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: 'black',
  // 웹 앱 관련 설정을 viewport에 포함
  colorScheme: 'dark',
}

// width: 600, // 이미지 너비
// height: 630, // 이미지 높이

export const metadata: Metadata = {
  metadataBase: new URL('https://megashorts.com'),
  title: {
    default: "메가쇼츠 MEGASHORTS",
    template: "%s | 메가쇼츠"
  },
  description: "글로벌 No.1 숏폼컨텐츠 오픈형 플랫폼",
  keywords: ["메가쇼츠", "숏폼", "동영상", "크리에이터", "콘텐츠", "MEGASHORTS", "shortform"],
  applicationName: "MEGASHORTS",
  authors: [{ name: "APPLIED LABS" }],
  creator: "APPLIED LABS",
  publisher: "MEGASHORTS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: "google-site-verification-code", // Google Search Console 코드
    // naver: "naver-site-verification-code",   // 네이버 서치어드바이저 코드
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://megashorts.com",
    title: "메가쇼츠 MEGASHORTS",
    description: "글로벌 No.1 숏폼컨텐츠 오픈형 플랫폼",
    siteName: "MEGASHORTS",
    images: [{
      url: "/MS_OCimage.webp",
      width: 800,   
      height: 149,  
      alt: "MEGASHORTS 로고",
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "메가쇼츠 MEGASHORTS",
    description: "글로벌 No.1 숏폼컨텐츠 오픈형 플랫폼",
    images: ["/MS_OCimage.webp"],
  },
  alternates: {
    canonical: "https://megashorts.com",
  },
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <html lang="ko" suppressHydrationWarning>
      <body className={BMDOHYEON.className}>
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
