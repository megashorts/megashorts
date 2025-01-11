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
  title: "MS",
  description: "Short form contents",
  icons: {
    icon: '/favicon.ico',
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover"
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
