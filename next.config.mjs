import {withSentryConfig} from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit, { runtimeCaching as defaultRuntimeCaching } from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin();
const uploadSentrySourceMaps = process.env.SENTRY_UPLOAD_SOURCE_MAPS === "true";
const enablePwaInDev = process.env.NEXT_PUBLIC_PWA_DEV === "true";
const pwaRuntimeCaching = [
  {
    urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/_next/static/chunks/"),
    handler: "NetworkOnly",
    method: "GET",
    options: {
      cacheName: "next-static-chunks-network-only",
    },
  },
  {
    urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/_vercel/"),
    handler: "NetworkOnly",
    method: "GET",
    options: {
      cacheName: "vercel-internal",
    },
  },
  {
    urlPattern: ({ url }) => (
      (url.hostname.endsWith(".cloudflarestream.com") || url.hostname === "videodelivery.net") &&
      url.pathname.includes("/thumbnails/")
    ),
    handler: "StaleWhileRevalidate",
    method: "GET",
    options: {
      cacheName: "cloudflare-stream-thumbnails",
      expiration: {
        maxEntries: 80,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ url }) => (
      (url.hostname.endsWith(".cloudflarestream.com") || url.hostname === "videodelivery.net") &&
      url.pathname.endsWith(".m3u8")
    ),
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "cloudflare-stream-manifests",
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 40,
        maxAgeSeconds: 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ url }) => (
      (url.hostname.endsWith(".cloudflarestream.com") || url.hostname === "videodelivery.net") &&
      /\.(?:m4s|ts|mp4|webm|vtt|webvtt)$/i.test(url.pathname)
    ),
    handler: "CacheFirst",
    method: "GET",
    options: {
      cacheName: "cloudflare-stream-media",
      expiration: {
        maxEntries: 120,
        maxAgeSeconds: 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
      rangeRequests: true,
    },
  },
  ...defaultRuntimeCaching,
];
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development" && !enablePwaInDev,
  cacheOnFrontEndNav: true,
  reloadOnOnline: false,
  fallbacks: {
    document: "/ko/~offline",
  },
  workboxOptions: {
    runtimeCaching: pwaRuntimeCaching,
    cleanupOutdatedCaches: true,
    exclude: [
      /\/?_next\/static\/chunks\/.*\.js$/,
      /static\/chunks\/.*\.js$/,
      /_buildManifest\.js$/,
      /_ssgManifest\.js$/,
      /build-manifest\.json$/,
      /app-build-manifest\.json$/,
      /react-loadable-manifest\.json$/,
      /middleware-manifest\.json$/,
    ],
    skipWaiting: true,
    clientsClaim: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  serverExternalPackages: ["@node-rs/argon2"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        pathname: "/**",
      }
    ],
    dangerouslyAllowSVG: true,
  },
  rewrites: () => {
    return [
      {
        source: "/hashtag/:tag",
        destination: "/search?q=%23:tag",
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      // 프로덕션 빌드에서 개발용 래퍼 제외
      config.module.rules.push({
        test: /logging-wrapper\.dev\.ts$/,
        loader: 'ignore-loader',
      });
    }
    return config;
  },
  env: {
    // 서비스 로그 설정
    SERVICE_LOG: process.env.SYSTEM_SERVICELOGENABLED || 'true',
    
    // 코인 관련 설정
    COIN_PAY: process.env.SYSTEM_VIEWCOINAMOUNT || '2',
    EVENT_COIN1: process.env.SYSTEM_EVENTCOIN1AMOUNT || '10',
    EVENT_COIN2: process.env.SYSTEM_EVENTCOIN2AMOUNT || '20',
    
    // 기타 시스템 설정
    MIN_WITHDRAW: process.env.SYSTEM_MINWITHDRAWPOINT || '100000',
    REFERRAL_COIN: process.env.SYSTEM_REFERRALCOINAMOUNT || '2',
  },
};

const appConfig = withPWA(withNextIntl(nextConfig));

export default uploadSentrySourceMaps ? withSentryConfig(
  appConfig,
  {
    org: "megasshorts",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    reactComponentAnnotation: {
      enabled: true,
    },
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }
) : appConfig;
