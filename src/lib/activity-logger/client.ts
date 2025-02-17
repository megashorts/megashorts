import type { ActivityLog } from './types';
import { locationManager } from './location-manager';
import { CONFIG, STORAGE_KEYS } from './constants';

// 배치 전송 타이머
let batchTimer: NodeJS.Timeout | null = null;

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
async function sendPendingLogs() {
  try {
    const pendingLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_LOGS) || '[]');
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
      throw new Error('Failed to send logs');
    }

    // 전송 성공하면 로그 삭제
    localStorage.setItem(STORAGE_KEYS.PENDING_LOGS, '[]');
    localStorage.setItem(STORAGE_KEYS.LAST_SENT, new Date().toISOString());

  } catch (error) {
    console.error('Failed to send pending logs:', error);
  }
}

// 배치 전송 시작
function startBatchTimer() {
  if (batchTimer) return;
  
  batchTimer = setInterval(async () => {
    await sendPendingLogs();
  }, CONFIG.BATCH_INTERVAL);
}

export async function logActivity(log: Partial<ActivityLog>) {
  try {
    const locationInfo = await locationManager.getInfo();

    const fullLog: ActivityLog = {
      timestamp: log.timestamp || new Date().toISOString(),
      type: log.type || 'system',
      method: log.method || '-',
      path: log.path || '',
      status: log.status || 200,
      
      // 위치 정보
      ip: locationInfo.ip,
      country: locationInfo.country,
      city: locationInfo.city,
      device: locationInfo.device,
      
      // 요청/응답 데이터
      request: log.request,
      response: log.response,
      
      // 선택적 필드
      userId: log.userId,
      username: log.username,
      event: log.event
    };

    // 로그 데이터 확인
    console.log('로그 데이터:', {
      ip: fullLog.ip,
      country: fullLog.country,
      city: fullLog.city,
      device: fullLog.device
    });

    // localStorage에 로그 저장
    try {
      const pendingLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_LOGS) || '[]');
      pendingLogs.push(fullLog);

      // 크기 체크 (500KB)
      const logsSize = new Blob([JSON.stringify(pendingLogs)]).size;
      if (logsSize > CONFIG.MAX_BATCH_SIZE) {
        await sendPendingLogs();  // 즉시 전송
      } else {
        localStorage.setItem(STORAGE_KEYS.PENDING_LOGS, JSON.stringify(pendingLogs));
        startBatchTimer();  // 5분 타이머 시작
      }
    } catch (error) {
      console.error('Failed to save log:', error);
    }

  } catch (error) {
    console.error('Failed to create log:', error);
  }
}
