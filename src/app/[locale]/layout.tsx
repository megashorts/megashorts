import { Toaster } from "@/components/ui/toaster";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";
import "../globals.css";
import ReactQueryProvider from "../ReactQueryProvider";
import { OrientationModal } from "@/components/OrientationModal";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAEnhancer } from "@/components/PWAEnhancer";
import { Analytics } from '@vercel/analytics/next';
import '@/lib/logging-wrapper';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { locales as localeConfigs, defaultLocale } from '@/i18n/config';

const BMDOHYEON = localFont({
  src: '../fonts/BMDOHYEON.woff2',  // src/app/fonts 폴더 내의 폰트 파일
  display: 'swap',
  variable: '--font-BMDOHYEON',
});
const enableAnalytics = process.env.NODE_ENV === 'production' && process.env.VERCEL === '1';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://megashorts.com'),
  manifest: "/manifest.json",
  title: {
    default: "MEGASHORTS",
    template: "%s | 메가쇼츠"
  },
  description: "Global No.1 short-form platform",
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
    title: "MEGASHORTS",
    description: "Global No.1 short-form platform",
    siteName: "MEGASHORTS",
    images: [{
      url: "/megashortsSNS2.jpg",
      width: 800,
      height: 420,
      alt: "MEGASHORTS logo",
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "MEGASHORTS",
    description: "Global No.1 short-form platform",
    images: ["/megashortsSNS.jpg"],
  },
  alternates: {
    canonical: "https://megashorts.com",
  },
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png' },
    ],
    // apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const localeFontClass = locale === 'zh'
    ? 'font-locale-zh'
    : locale === 'en'
      ? 'font-locale-en'
      : 'font-locale-ko';

  // SEO: 기본 URL 및 hreflang alternate 링크 생성
  const baseUrl = 'https://megashorts.com';
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* SEO: hreflang alternate 링크 - Google이 각 언어 버전을 올바르게 인식 */}
        {localeConfigs.map((loc) => (
          <link
            key={loc.code}
            rel="alternate"
            hrefLang={loc.code}
            href={loc.code === defaultLocale ? baseUrl : `${baseUrl}/${loc.code}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={baseUrl} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="preconnect" href="https://customer-2cdfxbmja64x0pqo.cloudflarestream.com" />
        <link rel="preconnect" href="https://videodelivery.net" />
      </head>
      <body className={`${BMDOHYEON.variable} ${localeFontClass}`}>
        <NextIntlClientProvider messages={messages}>
          <ReactQueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange
            >
              {children}
              {enableAnalytics && <Analytics />}
              <PWAEnhancer />
              <OrientationModal />
              <PWAInstallPrompt />
            </ThemeProvider>
          </ReactQueryProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
