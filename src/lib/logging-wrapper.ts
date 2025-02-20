'use client';

// 개발 환경에서만 로깅 래퍼 import
if (process.env.NODE_ENV === 'development') {
  require('./logging-wrapper.dev');
}
