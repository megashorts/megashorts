import {withSentryConfig} from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
    turbo: {
      enabled: true
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

export default withSentryConfig(nextConfig, {
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
});
