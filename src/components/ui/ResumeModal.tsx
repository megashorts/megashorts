'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: () => void;
  onStartOver: () => void;
  message: string;
  imageUrl?: string;
  lastSequence: number;
  lastTimestamp: number;
}

export function ResumeModal({
  isOpen,
  onClose,
  onResume,
  onStartOver,
  message,
  imageUrl,
  lastSequence,
  lastTimestamp,
}: ResumeModalProps) {
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
        onClick={onClose}
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
            <br />
            <span className="text-sm text-muted-foreground/80">
              {lastSequence}화 {Math.floor(lastTimestamp / 60)}분 {lastTimestamp % 60}초
            </span>
          </p>
          <div className="flex gap-4 w-full">
            <button
              onClick={onStartOver}
              className="flex-1 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
            >
              괜찮아요
            </button>
            <button
              onClick={onResume}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              이어보기
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}