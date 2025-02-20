import type { CustomActivityLog } from './types';
import { locationManager } from './location-manager';
import { CONFIG, STORAGE_KEYS, isUserLoggedIn } from './constants';

// 배치 전송 타이머
let batchTimer: NodeJS.Timeout | null = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

// 브라우저 종료 시 로그 전송
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', async () => {
    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }
    await sendPendingLogs();
  });
}

// 보류 중인 로그 전송
async function sendPendingLogs(retry: boolean = false) {
  try {
    const pendingLogsStr = localStorage.getItem(STORAGE_KEYS.PENDING_LOGS);
    if (!pendingLogsStr) return;

    const pendingLogs = JSON.parse(pendingLogsStr);
    if (pendingLogs.length === 0) return;

    // 워커로 전송
    if (!CONFIG.WORKER_URL) {
      console.warn('Worker URL이 설정되지 않았습니다.');
      return;
    }

    const response = await fetch(CONFIG.WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pendingLogs)
    });

    if (!response.ok) {
      throw new Error(`Failed to send logs: ${response.status}`);
    }

    // 전송 성공하면 로그 삭제
    localStorage.setItem(STORAGE_KEYS.PENDING_LOGS, '[]');
    localStorage.setItem(STORAGE_KEYS.LAST_SENT, new Date().toISOString());
    retryCount = 0; // 재시도 카운트 리셋

  } catch (error) {
    console.error('Failed to send pending logs:', error);
    
    // 재시도 로직
    if (retry && retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(() => {
        sendPendingLogs(true);
      }, RETRY_DELAY * retryCount);
    }
  }
}

// 배치 전송 시작
function startBatchTimer() {
  if (batchTimer) return;
  
  batchTimer = setInterval(async () => {
    await sendPendingLogs(true); // 재시도 활성화
  }, CONFIG.BATCH_INTERVAL);
}

// 로그 저장소 크기 확인
function getStorageSize(): number {
  const pendingLogsStr = localStorage.getItem(STORAGE_KEYS.PENDING_LOGS) || '[]';
  return new Blob([pendingLogsStr]).size;
}

export async function logActivity(log: Partial<CustomActivityLog>) {
  try {
    // 로그 활성화 여부 체크
    if (!CONFIG.SERVICE_LOG_ENABLED) {
      return;
    }

    // 로그인 상태 체크 (auth 타입 제외)
    if (log.type !== 'auth' && !isUserLoggedIn()) {
      return;
    }

    const locationInfo = await locationManager.getInfo();
    
    const fullLog: CustomActivityLog = {
      type: log.type || 'system',
      event: log.event || '',
      username: log.username,
      details: {
        action: log.details?.action,
        result: log.details?.result,
        userId: log.details?.userId,
        target: log.details?.target,
        error: log.details?.error,
        ...log.details
      },
      timestamp: log.timestamp || new Date().toISOString(),
      
      // 위치 정보
      ip: locationInfo.ip,
      country: locationInfo.country,
      city: locationInfo.city,
      device: locationInfo.device
    };

    try {
      // 현재 저장된 로그 가져오기
      const pendingLogsStr = localStorage.getItem(STORAGE_KEYS.PENDING_LOGS) || '[]';
      const pendingLogs = JSON.parse(pendingLogsStr);
      
      // 새 로그 추가
      pendingLogs.push(fullLog);

      // 크기 체크 (500KB)
      const newSize = new Blob([JSON.stringify(pendingLogs)]).size;
      if (newSize > CONFIG.MAX_BATCH_SIZE) {
        // 즉시 전송
        await sendPendingLogs(true);
        // 새 로그만 저장
        localStorage.setItem(STORAGE_KEYS.PENDING_LOGS, JSON.stringify([fullLog]));
      } else {
        // 전체 저장
        localStorage.setItem(STORAGE_KEYS.PENDING_LOGS, JSON.stringify(pendingLogs));
      }

      // 배치 타이머 시작
      startBatchTimer();

    } catch (error) {
      console.error('Failed to save log:', error);
      // 저장 실패 시 즉시 전송 시도
      await sendPendingLogs(true);
    }

  } catch (error) {
    console.error('Failed to create log:', error);
  }
}
