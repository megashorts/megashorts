'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { isStandalonePWA } from '@/lib/pwa-client';

const PROMPT_LAST_SHOWN_KEY = 'ms_pwa_install_prompt_last_shown_at';
const PROMPT_HIDDEN_UNTIL_KEY = 'ms_pwa_install_prompt_hidden_until';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ACCEPT_HIDE_MS = 30 * ONE_DAY_MS;

export function PWAInstallPrompt() {
  const t = useTranslations('PWA');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();

      if (isStandalonePWA()) return;

      const now = Date.now();
      const hiddenUntil = Number(localStorage.getItem(PROMPT_HIDDEN_UNTIL_KEY) || 0);
      if (hiddenUntil > now) return;

      const lastShownAt = Number(localStorage.getItem(PROMPT_LAST_SHOWN_KEY) || 0);
      if (now - lastShownAt < ONE_DAY_MS) return;

      localStorage.setItem(PROMPT_LAST_SHOWN_KEY, String(now));
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
    setShowPrompt(false);

    if (outcome === 'accepted') {
      localStorage.setItem(PROMPT_HIDDEN_UNTIL_KEY, String(Date.now() + ACCEPT_HIDE_MS));
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_HIDDEN_UNTIL_KEY, String(Date.now() + ONE_DAY_MS));
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
