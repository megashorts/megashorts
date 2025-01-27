// const { withSentryConfig } = require('@sentry/nextjs');

// const moduleExports = {
//   // Next.js 설정
// };

// const sentryWebpackPluginOptions = {
//   sourcemaps: {
//     deleteSourcemapsAfterUpload: true, // 소스 맵 자동 삭제
//   },
// };

// module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);


// // This file configures the initialization of Sentry on the server.
// // The config you add here will be used whenever the server handles a request.
// // https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://dcafbfe15988ae75af7c85d0410fdc07@o4508582810681345.ingest.us.sentry.io/4508582812712960",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
