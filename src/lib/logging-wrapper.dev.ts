// instance log file for DEV

'use client';

import { EXCLUDED_ROUTES } from './activity-logger/constants';

// 개발 환경에서만 API 요청을 콘솔에 출력
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalFetch = window.fetch;
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    let url: URL;
    try {
      if (input instanceof Request) {
        url = new URL(input.url);
      }
      else if (input instanceof URL) {
        url = input;
      }
      else {
        url = new URL(input.toString(), window.location.origin);
      }

      // 로깅 제외 경로 체크
      if (EXCLUDED_ROUTES.some(route => url.pathname.startsWith(route))) {
        return originalFetch(input, init);
      }

      // API 요청만 콘솔에 출력
      if (url.pathname.startsWith('/api')) {
        const method = init?.method || 'GET';
        // 요청 데이터 준비
        let requestData;
        if (init?.body) {
          try {
            requestData = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
          } catch (error) {
            requestData = init.body;
          }
        }

        const response = await originalFetch(input, init);
        const clonedResponse = response.clone();
        
        try {
          const text = await clonedResponse.text();
          const result = text ? JSON.parse(text) : null;
          
          // 응답 데이터 로깅
          console.log(`${method} ${url.pathname}`);
          const data = result?.data || result;
          if (typeof data === 'object' && data !== null) {
            Object.entries(data).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                console.log(`${key}:`);
                Object.entries(value).forEach(([k, v]) => {
                  console.log(`  ${k}: ${JSON.stringify(v)}`);
                });
              } else {
                console.log(`${key}: ${JSON.stringify(value)}`);
              }
            });
          } else {
            console.log(data);
          }
          
          // 요청 데이터가 있는 경우 별도 로그로 출력
          if (requestData) {
            console.log(`API:`, requestData);
          }
        } catch (error) {
          console.log(`APILog: Parse Error (${method} ${url.pathname}, Status: ${response.status})`);
        }

        return response;
      }

      return originalFetch(input, init);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`APILog: Fetch Error (${errorMessage})`);
      return originalFetch(input, init);
    }
  };
}
