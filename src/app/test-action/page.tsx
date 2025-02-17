'use client';

import { testServerAction } from './actions';
import { logActivity } from '@/lib/activity-logger/client';

export default function TestActionPage() {
  const handleTest = async () => {
    const result = await testServerAction();
    console.log('Test result:', result);
    
    // server action에서 반환된 로그 데이터가 있으면 저장
    if (result.success && result.logData) {
      logActivity(result.logData);
    }
    
    // localStorage에서 로그 확인
    const logs = localStorage.getItem('activity_logger_pending_logs');
    console.log('Stored logs:', logs ? JSON.parse(logs) : 'No logs');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Server Action 로그 테스트</h1>
      <button
        onClick={handleTest}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        테스트 실행
      </button>
    </div>
  );
}
