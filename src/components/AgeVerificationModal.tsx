// 글로벌 성인인증 모달 - Self-Declaration 방식
// 생년월일 입력 + "만 18세 이상 확인" 동의 체크

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/components/SessionProvider';
import { useToast } from '@/components/ui/use-toast';

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
  const [birthDate, setBirthDate] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, refreshSession } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!birthDate) {
      setErrorMessage('생년월일을 입력해주세요.');
      return;
    }
    if (!confirmed) {
      setErrorMessage('성인 콘텐츠 이용에 동의해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/verify-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate, confirmed: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isMinor) {
          setErrorMessage('만 18세 이상만 이용 가능한 콘텐츠입니다.');
        } else {
          setErrorMessage(data.error || '인증에 실패했습니다.');
        }
        return;
      }

      // 캐시 무효화 → 즉시 반영
      if (user?.id) {
        queryClient.setQueryData(['userAuth', user.id], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            adultauth: true
          };
        });
      }
      
      await queryClient.invalidateQueries({ queryKey: ['userAuth'] });
      refreshSession();

      toast({
        description: '연령 인증이 완료되었습니다.',
        duration: 2000,
      });

      onVerified?.();
      onClose();
    } catch (error) {
      console.error('Age verification error:', error);
      setErrorMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl z-[101] p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                  <span className="text-lg">🔞</span>
                </div>
                <h2 className="text-xl font-bold text-white">연령 인증</h2>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
                <X size={24} />
              </button>
            </div>

            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              선택하신 콘텐츠는 청소년 청취불가 또는 성인용 콘텐츠입니다.<br/>
              이용을 위해 연령 인증이 필요합니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  생년월일 입력
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>

              <label className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-red-500 bg-zinc-800 border-zinc-700 rounded cursor-pointer"
                />
                <span className="text-sm text-zinc-300 leading-relaxed">
                  본인은 만 18세 이상이며, 성인 콘텐츠 이용에 동의합니다. 입력한 정보가 허위일 경우 발생하는 모든 책임은 본인에게 있음을 확인합니다.
                </span>
              </label>

              {errorMessage && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg"
                >
                  {errorMessage}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading || !confirmed || !birthDate}
                className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
              >
                {isLoading ? '인증 진행 중...' : '인증 완료 및 계속하기'}
              </button>
            </form>
            
            <p className="mt-4 text-center text-[11px] text-zinc-500">
              인증을 완료하시면 관련 서비스 약관에 동의한 것으로 간주됩니다.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
