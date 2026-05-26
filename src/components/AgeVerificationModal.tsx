// 글로벌 성인인증 모달 - Self-Declaration 방식
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/components/SessionProvider';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

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
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const tAge = useTranslations('AgeVerification');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, refreshSession } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!confirmed) {
      setErrorMessage(tAge('confirmRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/verify-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || tAge('verificationFailed'));
        return;
      }

      if (user?.id) {
        queryClient.setQueryData(['userAuth', user.id], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            adultauth: true,
          };
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['userAuth'] });
      refreshSession();

      toast({
        description: tAge('verificationComplete'),
        duration: 2000,
      });

      onVerified?.();
      onClose();
    } catch (error) {
      console.error('Age verification error:', error);
      setErrorMessage(tAge('networkError'));
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
          <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full sm:w-[min(100%,30rem)] max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                    <span className="text-lg">🔞</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">{tAge('title')}</h2>
                </div>
                <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              <p className="text-zinc-300 text-sm leading-relaxed mb-5">
                {tAge('description')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="flex items-start gap-3 p-4 bg-zinc-800/60 rounded-xl border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-red-500 bg-zinc-800 border-zinc-700 rounded cursor-pointer"
                  />
                  <span className="text-sm text-zinc-200 leading-relaxed">
                    {tAge('confirmAdult')}
                  </span>
                </label>

                <p className="text-xs text-zinc-500 leading-relaxed">
                  {tAge('minimalNotice')}
                </p>

                {errorMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-300 text-sm text-center bg-red-500/10 py-2 rounded-lg"
                  >
                    {errorMessage}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !confirmed}
                  className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  {isLoading ? tAge('verifying') : tAge('verify')}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
