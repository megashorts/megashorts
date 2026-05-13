// 글로벌 성인인증 모달 - Self-Declaration 방식
// 생년월일 입력 + "만 18세 이상 확인" 동의 체크

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/components/SessionProvider';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

export default function AgeVerificationModal({
  isOpen,
  onClose,
  onVerified,
}: AgeVerificationModalProps) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, refreshSession } = useSession();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setErrorMessage('');

    // 입력 검증
    if (!year || !month || !day) {
      setErrorMessage('Please enter your date of birth');
      return;
    }

    if (!confirmed) {
      setErrorMessage('Please confirm that you are 18 years or older');
      return;
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    // 기본 유효성 검사
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
      setErrorMessage('Please enter a valid year');
      return;
    }
    if (monthNum < 1 || monthNum > 12) {
      setErrorMessage('Please enter a valid month (1-12)');
      return;
    }
    if (dayNum < 1 || dayNum > 31) {
      setErrorMessage('Please enter a valid day (1-31)');
      return;
    }

    const birthDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/verify-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate, confirmed: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isMinor) {
          setErrorMessage('You must be 18 years or older to access this content');
        } else {
          setErrorMessage(data.error || 'Verification failed');
        }
        return;
      }

      // 캐시 무효화 → 즉시 반영
      await queryClient.invalidateQueries({ queryKey: ['userAuth'] });
      refreshSession();

      toast({
        description: 'Age verification completed successfully',
        duration: 2000,
      });

      onVerified?.();
      onClose();
    } catch (error) {
      console.error('Age verification error:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90vw] max-w-[380px] rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <span className="text-2xl">🔞</span>
          </div>
          <h2 className="text-lg font-bold text-white">Age Verification</h2>
          <p className="mt-1 text-sm text-zinc-400">
            This content is restricted to adults only.
            <br />
            Please verify your age to continue.
          </p>
        </div>

        {/* 생년월일 입력 */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Date of Birth
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="YYYY"
              value={year}
              onChange={(e) => setYear(e.target.value.slice(0, 4))}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2.5 text-center text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              min="1900"
              max={new Date().getFullYear()}
            />
            <input
              type="number"
              placeholder="MM"
              value={month}
              onChange={(e) => setMonth(e.target.value.slice(0, 2))}
              className="w-20 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2.5 text-center text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              min="1"
              max="12"
            />
            <input
              type="number"
              placeholder="DD"
              value={day}
              onChange={(e) => setDay(e.target.value.slice(0, 2))}
              className="w-20 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2.5 text-center text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              min="1"
              max="31"
            />
          </div>
        </div>

        {/* 동의 체크박스 */}
        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-zinc-800/50 p-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-600 accent-red-500"
          />
          <span className="text-xs leading-relaxed text-zinc-300">
            I confirm that I am <strong className="text-white">18 years of age or older</strong> and
            I agree to view age-restricted content. I understand that providing false information may
            result in account restrictions.
          </span>
        </label>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-white/10 text-zinc-400 hover:bg-zinc-800"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 text-white hover:bg-red-700"
            onClick={handleSubmit}
            disabled={isLoading || !confirmed}
          >
            {isLoading ? 'Verifying...' : 'Verify Age'}
          </Button>
        </div>

        {/* 안내 텍스트 */}
        <p className="mt-4 text-center text-[10px] text-zinc-500">
          By proceeding, you agree to our Terms of Service regarding age-restricted content.
        </p>
      </div>
    </div>
  );
}
