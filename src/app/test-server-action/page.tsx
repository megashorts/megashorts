'use client';

import { testAction, testRedirectAction, testRedirectWithData } from './actions';
import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<string>('');

  const handleTest = async () => {
    try {
      const response = await testAction();
      setResult('Normal Action Result:\n' + JSON.stringify(response, null, 2));
      console.log('Server action response:', response);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Test failed:', error);
        setResult('Error: ' + error.message);
      }
    }
  };

  const handleRedirectTest = async () => {
    try {
      const response = await testRedirectAction();
      // 이 코드는 리다이렉트로 인해 실행되지 않아야 함
      setResult('Redirect Action Result:\n' + JSON.stringify(response, null, 2));
      console.log('This should not be logged:', response);
    } catch (error) {
      if (error instanceof Error) {
        // NEXT_REDIRECT 에러는 정상적인 리다이렉션
        if (!error.message.includes('NEXT_REDIRECT')) {
          console.error('Redirect test failed:', error);
          setResult('Error: ' + error.message);
        } else {
          setResult('Redirected successfully');
        }
      }
    }
  };

  const handleRedirectWithDataTest = async () => {
    try {
      const response = await testRedirectWithData();
      setResult('Redirect With Data Result:\n' + JSON.stringify(response, null, 2));
      console.log('Response (if not redirected):', response);
    } catch (error) {
      if (error instanceof Error) {
        // NEXT_REDIRECT 에러는 정상적인 리다이렉션
        if (!error.message.includes('NEXT_REDIRECT')) {
          console.error('Test failed:', error);
          setResult('Error: ' + error.message);
        } else {
          setResult('Redirected successfully');
        }
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Server Action 테스트</h1>
      <div className="space-y-4">
        <div>
          <button
            onClick={handleTest}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            일반 테스트
          </button>
        </div>
        <div>
          <button
            onClick={handleRedirectTest}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            리다이렉트 테스트
          </button>
        </div>
        <div>
          <button
            onClick={handleRedirectWithDataTest}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            리다이렉트 + 데이터 테스트
          </button>
        </div>
        <pre className="bg-black border p-4 rounded mt-4">
          {result || 'Click buttons to test'}
        </pre>
      </div>
    </div>
  );
}
