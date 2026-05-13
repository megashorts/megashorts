'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  // t: translations can be added here, or hardcoded for now since it's global UI.
  // const t = useTranslations('Common');

  useEffect(() => {
    // 7일간 숨김 체크
    const hiddenUntil = localStorage.getItem('hideInstallPromptUntil');
    if (hiddenUntil && new Date().getTime() < parseInt(hiddenUntil, 10)) {
      return;
    }

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
    // 7일(밀리초) 뒤까지 다시 안 보임
    const hideUntil = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('hideInstallPromptUntil', hideUntil.toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl z-50 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
              <Download size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">앱으로 더 편하게 보기</p>
              <p className="text-xs text-zinc-400">빠른 로딩과 끊김없는 스와이프</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-lg"
            >
              설치
            </button>
            <button
              onClick={handleDismiss}
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
