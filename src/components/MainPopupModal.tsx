'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { NoticeModal } from '@/app/(main)/admin/service/components/types';
import { getThumbnailUrl } from '@/lib/constants';

export function MainPopupModal() {
  const isMobile = useIsMobile();
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [modals, setModals] = useState<NoticeModal[]>([]);

  useEffect(() => {
    const checkHiddenModal = (modal: NoticeModal) => {
      const hiddenUntil = localStorage.getItem(`modal_hidden_${modal.id}`);
      if (!hiddenUntil) return false;
      const now = new Date().getTime();
      return now < parseInt(hiddenUntil);
    };

    fetch('/api/admin/notice-modals')
      .then(res => res.json())
      .then(fetchedModals => {
        const activeModals = fetchedModals
          .filter((m: NoticeModal) => m.isActive && !checkHiddenModal(m))
          .sort((a: NoticeModal, b: NoticeModal) => b.priority - a.priority);

        if (activeModals.length > 0) {
          setModals(activeModals);
        }
      })
      .catch(error => console.error('Failed to fetch modals:', error));
  }, []);

  const handleLinkClick = (url: string | null | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClose = (modalId: number) => {
    setModals(prev => prev.filter(m => m.id !== modalId));
  };

  const handleHideOption = (modalId: number, option: 'DAY' | 'NEVER') => {
    const now = new Date().getTime();
    const duration = option === 'DAY' ? 24 * 60 * 60 * 1000 : Number.MAX_SAFE_INTEGER;
    localStorage.setItem(`modal_hidden_${modalId}`, (now + duration).toString());
    handleClose(modalId);
  };

  if (!modals.length) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50" style={{ zIndex: 9999 }}>
      <div className="relative">
        {modals.map((modal, idx) => {
          let modalI18nData;
          try {
            modalI18nData = typeof modal.i18nData === 'string'
              ? JSON.parse(modal.i18nData).korean
              : modal.i18nData.korean;
            
            if (!modalI18nData?.imageId) return null;
          } catch (error) {
            console.error('Failed to parse modal i18n data:', error);
            return null;
          }
  
          return (
            <div 
              key={modal.id}
              className="bg-white shadow-xl absolute top-1/2 left-1/2 overflow-hidden rounded-lg"
              style={{ 
                width: isMobile ? '90vw' : '600px',
                transform: `translate(-50%, -50%) translate(${idx * 8}px, ${idx * 8}px)`,
                zIndex: modals.length - idx
              }}
            >
              <div
                className={`relative ${modal.linkUrl ? 'cursor-pointer' : ''}`}
                onClick={() => modal.linkUrl && handleLinkClick(modal.linkUrl)}
              >
                <img
                  src={getThumbnailUrl(modalI18nData.imageId, 'public')}
                  alt={modal.title}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    img.parentElement!.style.aspectRatio = aspectRatio.toString();
                    setLoadedImages(prev => ({ ...prev, [modal.id]: true }));
                  }}
                  style={{
                    display: loadedImages[modal.id] ? 'block' : 'none'
                  }}
                />
  
                {modalI18nData.buttonText && (
                  <div
                    className="absolute inset-x-0 flex justify-center"
                    style={{ bottom: '20%' }}
                  >
                    <Button
                      variant="destructive"
                      className="text-base font-medium rounded hover:scale-105 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkClick(modal.buttonUrl);
                      }}
                    >
                      {modalI18nData?.buttonText}
                    </Button>
                  </div>
                )}
  
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose(modal.id);
                  }}
                  className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 rounded focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
  
                {modal.hideOption !== 'ALWAYS' && (
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {modal.hideOption === 'DAY' && (
                      <button
                        onClick={() => handleHideOption(modal.id, 'DAY')}
                        className="px-4 py-2 text-sm text-white bg-black/50 hover:bg-black/70 rounded shadow-lg backdrop-blur-sm"
                      >
                        <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                          오늘은 보지 않기
                        </span>
                      </button>
                    )}
                    {modal.hideOption === 'NEVER' && (
                      <button
                        onClick={() => handleHideOption(modal.id, 'NEVER')}
                        className="px-4 py-2 text-sm text-white bg-black/50 hover:bg-black/70 rounded shadow-lg backdrop-blur-sm"
                      >
                        <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                          다시 보지 않기
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
