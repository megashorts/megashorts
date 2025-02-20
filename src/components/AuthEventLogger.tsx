
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { logActivity } from '@/lib/activity-logger/client';
import type { CustomActivityLog } from '@/lib/activity-logger/types';

export default function AuthEventLogger() {
  const searchParams = useSearchParams();
  const event = searchParams.get('event');
  const error = searchParams.get('error');
  const username = searchParams.get('username');

  useEffect(() => {
    if (!event) return;

    // 이벤트에서 액션 추출 (login/signup)
    const action = event.includes('login') ? 'LOGIN' : 'SIGNUP';

    const log: Partial<CustomActivityLog> = {
      type: 'auth',
      event,
      username: username || undefined,
      details: {
        action,
        ...(error && { error })
      }
    };

    logActivity(log);
  }, [event, error, username]);

  return null;  // 이 컴포넌트는 UI를 렌더링하지 않음
}
