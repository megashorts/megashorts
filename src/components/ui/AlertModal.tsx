'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  imageUrl?: string;
  redirectUrl?: string;
  buttonText?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  message,
  imageUrl,
  redirectUrl,
  buttonText,
}: AlertModalProps) {
  const router = useRouter();

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAction = () => {
    if (redirectUrl) {
      router.push(redirectUrl);
    }
    onClose();
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        // onClick={onClose}
        aria-hidden="true"
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-black rounded-lg shadow-xl w-[90vw] max-w-[300px] transform transition-all border">
        <div className="flex flex-col items-center gap-8 p-8">
          {imageUrl && (
            <div className="relative overflow-hidden">
              <Image
                src={imageUrl}
                alt="megashorts emblem"
                width={100}
                height={100}
                className="object-cover"
                priority
              />
            </div>
          )}
          <p 
            id="modal-title"
            className="text-center text-base font-medium text-muted-foreground"
            style={{ whiteSpace: 'pre-line' }}
          >
            {message}
          </p>
          {redirectUrl && (
            <button
              onClick={handleAction}
              className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}