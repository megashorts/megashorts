'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PWAInstallPrompt() {
  const t = useTranslations('PWA');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-24px)] max-w-[440px] -translate-x-1/2 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 shadow-2xl sm:p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Download size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{t('installTitle')}</p>
              <p className="break-keep text-xs leading-snug text-zinc-400">{t('installDescription')}</p>
            </div>
          </div>
          
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handleInstall}
              className="min-w-[56px] whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              {t('installButton')}
            </button>
            <button
              onClick={handleDismiss}
              aria-label={t('later')}
              className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
