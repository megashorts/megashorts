'use client';

import { logActivity } from './activity-logger/client';
import { locationManager } from './activity-logger/location-manager';
import { EXCLUDED_ROUTES } from './activity-logger/constants';
import { LogType } from './activity-logger/types';

interface EventInfo {
  event: string;
  details: Record<string, any>;
}

// 이벤트 이름 추출
const getEventFromPath = (path: string, method: string): string => {
  const segments = path.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const secondLastSegment = segments[segments.length - 2];
  
  // 마지막 세그먼트가 동사나 액션인 경우
  if (['view', 'progress', 'like', 'bookmark', 'upload', 'delete', 'sync', 'verify'].includes(lastSegment)) {
    return lastSegment;
  }
  
  // ID가 포함된 경로의 경우 이전 세그먼트 사용
  if (lastSegment.includes('[') || lastSegment.match(/^[0-9a-f-]+$/)) {
    return secondLastSegment;
  }
  
  return method.toLowerCase();
};

// 타입 결정
const getLogType = (path: string): LogType => {
  if (path.includes('/auth')) return 'auth';
  if (path.includes('/video')) return 'video';
  if (path.includes('/post')) return 'post';
  if (path.includes('/payment')) return 'payment';
  return 'system';
};

// URL에서 ID 추출
const extractIdFromPath = (path: string): string | null => {
  const matches = path.match(/\/([0-9a-f-]+)(?:\/|$)/);
  return matches ? matches[1] : null;
};

// 타입별 세부 정보 추출
const getTypeSpecificDetails = (
  type: LogType, 
  requestData: any, 
  responseData: any, 
  path: string
) => {
  const commonDetails = {
    success: responseData?.success ?? requestData?.success ?? true,
    error: responseData?.error ?? requestData?.error
  };

  const pathId = extractIdFromPath(path);

  switch(type) {
    case 'auth':
      return {
        ...commonDetails,
        provider: requestData?.provider || responseData?.provider,
        email: responseData?.email,
        verified: responseData?.verified
      };
      
    case 'video':
      if (path.includes('/view')) {
        return {
          ...commonDetails,
          videoId: requestData?.videoId || responseData?.videoId || pathId,
          startTime: requestData?.startTime,
          watchId: responseData?.watchId
        };
      }
      if (path.includes('/progress')) {
        return {
          ...commonDetails,
          videoId: requestData?.videoId || responseData?.videoId || pathId,
          progress: requestData?.progress,
          currentTime: requestData?.currentTime,
          watchId: requestData?.watchId
        };
      }
      if (path.includes('/upload')) {
        return {
          ...commonDetails,
          postId: requestData?.postId || responseData?.postId,
          videoId: responseData?.videoId,
          duration: responseData?.duration,
          size: responseData?.size
        };
      }
      return {
        ...commonDetails,
        videoId: requestData?.videoId || responseData?.videoId || pathId,
        operation: path.split('/').pop()
      };
      
    case 'post':
      if (path.includes('/like') || path.includes('/bookmark')) {
        return {
          ...commonDetails,
          postId: pathId,
          action: path.split('/').pop(),
          count: responseData?.count
        };
      }
      return {
        ...commonDetails,
        postId: requestData?.postId || responseData?.postId || responseData?.id || pathId,
        category: requestData?.category || responseData?.category,
        title: responseData?.title,
        status: responseData?.status
      };
      
    case 'payment':
      if (path.includes('/subscription')) {
        return {
          ...commonDetails,
          orderId: responseData?.orderId,
          planId: responseData?.planId,
          period: responseData?.period,
          amount: responseData?.amount,
          status: responseData?.status
        };
      }
      if (path.includes('/coinpay')) {
        return {
          ...commonDetails,
          amount: requestData?.amount,  // 소진한 코인
          targetId: requestData?.targetId,  // 구매한 컨텐츠 ID
          remainingCoins: responseData?.remainingCoins
        };
      }
      return {
        ...commonDetails,
        orderId: responseData?.orderId,
        amount: responseData?.amount,
        coins: responseData?.coins,
        productType: responseData?.productType,
        status: responseData?.status
      };
      
    default:
      return {
        ...commonDetails,
        id: pathId,
        operation: path.split('/').pop()
      };
  }
};

// null이나 undefined 값을 제거하는 유틸리티 함수
const removeEmptyValues = (obj: Record<string, any>): Record<string, any> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null)
  );
};

if (typeof window !== 'undefined') {
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

      if (EXCLUDED_ROUTES.some(route => url.pathname.startsWith(route))) {
        return originalFetch(input, init);
      }

      if (url.pathname.startsWith('/api')) {
        const response = await originalFetch(input, init);
        const result = await response.clone().json();
        const locationInfo = await locationManager.getInfo();
        
        const method = init?.method || 'GET';
        const type = getLogType(url.pathname);
        const event = getEventFromPath(url.pathname, method);
        const requestData = init?.body ? JSON.parse(init.body as string) : {};
        const details = removeEmptyValues(getTypeSpecificDetails(
          type, 
          requestData, 
          result, 
          url.pathname
        ));

        await logActivity({
          timestamp: new Date().toISOString(),
          type,
          method,
          path: url.pathname,
          status: response.status,
          event: `${type}_${event}`,
          details,
          ...locationInfo,
          request: { 
            path: url.pathname,
            query: Object.fromEntries(url.searchParams),
            body: init?.body
          },
          response: { 
            status: response.status,
            data: result
          }
        });

        return response;
      }
    } catch (error) {
      console.error('로깅 에러:', error);
    }

    return originalFetch(input, init);
  };
}
