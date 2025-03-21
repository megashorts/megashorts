'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { NoticeModal } from '@/app/(main)/admin/service/components/types';
import { getThumbnailUrl } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export function MainPopupModal() {
  const isMobile = useIsMobile();
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [modals, setModals] = useState<NoticeModal[]>([]);
  const router = useRouter();

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
    if (!url) return;
    
    // 내부 링크인지 확인 (NEXT_PUBLIC_BASE_URL로 시작하는지)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const path = url.startsWith(baseUrl) ? url.substring(baseUrl.length) : url;
    router.push(path);
    // if (url.startsWith(baseUrl) || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    //   // 내부 링크는 Next.js 라우터 사용
    //   // URL에서 baseUrl 부분 제거하여 경로만 추출
    //   const path = url.startsWith(baseUrl) ? url.substring(baseUrl.length) : url;
    //   router.push(path);
    // } else {
    //   // 외부 링크는 새 창으로 열기
    //   window.open(url, '_blank', 'noopener,noreferrer');
    // }
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

  // 이미지 ID를 가져오는 함수 추가
  const getImageId = (modal: NoticeModal, locale: string): string | null => {
    try {
      const i18nData = typeof modal.i18nData === 'string'
        ? JSON.parse(modal.i18nData)
        : modal.i18nData;
      
      // 1. 현재 언어의 이미지 ID가 있으면 사용
      if (i18nData[locale]?.imageId) {
        return i18nData[locale].imageId;
      }
      
      // 2. 없으면 defaultImageId 사용
      if (i18nData.defaultImageId) {
        return i18nData.defaultImageId;
      }
      
      // 3. 둘 다 없으면 null 반환
      return null;
    } catch (error) {
      console.error('Failed to parse modal i18n data:', error);
      return null;
    }
  };

  // 버튼 텍스트를 가져오는 함수 추가
  const getButtonText = (modal: NoticeModal, locale: string): string | null => {
    try {
      const i18nData = typeof modal.i18nData === 'string'
        ? JSON.parse(modal.i18nData)
        : modal.i18nData;
      
      // 1. 현재 언어의 버튼 텍스트가 있으면 사용
      if (i18nData[locale]?.buttonText) {
        return i18nData[locale].buttonText;
      }
      
      // 2. 현재 언어의 이미지가 없고 defaultImageId를 사용하는 경우
      // 디폴트 이미지에 대한 버튼 텍스트가 있으면 사용
      if (i18nData.defaultButtonText) {
        return i18nData.defaultButtonText;
      }
      
      // 3. 둘 다 없으면 null 반환
      return null;
    } catch (error) {
      console.error('Failed to parse modal i18n data:', error);
      return null;
    }
  };

  if (!modals.length) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50" style={{ zIndex: 9999 }}>
      <div className="relative">
        {modals.map((modal, idx) => {
          // 현재 언어에 맞는 이미지 ID 가져오기
          const imageId = getImageId(modal, 'korean'); // 또는 현재 언어 코드
          
          if (!imageId) return null;
          
          return (
            <div 
              key={modal.id}
              className="bg-slate-600 shadow-2xl absolute top-1/2 left-1/2 overflow-hidden rounded-lg"
              style={{ 
                width: isMobile ? 'min(80vw, calc(70vh * 0.667))' : 'min(500px, calc(70vh * 0.667))',
                transform: `translate(-50%, -50%) translate(${idx * 8}px, ${idx * 8}px)`,
                zIndex: modals.length - idx
              }}
            >
              <div
                className={`relative ${modal.linkUrl ? 'cursor-pointer' : ''}`}
                onClick={() => modal.linkUrl && handleLinkClick(modal.linkUrl)}
              >
                <img
                  src={getThumbnailUrl(imageId, 'public')}
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
  
                {/* 버튼 텍스트도 현재 언어에 맞게 가져오기 */}
                {getButtonText(modal, 'korean') && (
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
                      {getButtonText(modal, 'korean')}
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
                        onClick={(e) => {
                          e.stopPropagation(); // 이벤트 버블링 방지
                          handleHideOption(modal.id, 'DAY');
                        }}
                        className="px-4 py-2 text-sm text-white bg-black/50 hover:bg-black/70 rounded shadow-lg backdrop-blur-sm"
                      >
                        <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                          오늘은 보지 않기
                        </span>
                      </button>
                    )}
                    {modal.hideOption === 'NEVER' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 이벤트 버블링 방지
                          handleHideOption(modal.id, 'NEVER');
                        }}
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
