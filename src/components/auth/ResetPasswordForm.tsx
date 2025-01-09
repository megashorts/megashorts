'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const response = await fetch(`/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setMessage('비밀번호가 성공적으로 재설정되었습니다. 잠시 후 로그인 페이지로 이동합니다.');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || '비밀번호 재설정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      setMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="mt-24 rounded bg-black/80 py-10 px-6 md:mt-0 md:max-w-sm md:px-14">
      <h1 className="text-center text-3xl font-bold">새 비밀번호 설정</h1>
      <div className="space-y-4 mt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="새 비밀번호"
            required
            className="w-full px-4 py-2 rounded-md bg-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호 확인"
            required
            className="w-full px-4 py-2 rounded-md bg-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/80"
          >
            비밀번호 재설정
          </button>
        </form>
        {message && (
          <div className="mt-4 text-center">
            <p className={message.includes('성공') ? 'text-green-500' : 'text-red-500'}>
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
