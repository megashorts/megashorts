'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';

export function OrientationModal() {
  const [isLandscape, setIsLandscape] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 모바일/태블릿 기기 감지
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      // 모바일, 태블릿 모두 포함
      return /android|ipad|iphone|ipod|mobile|tablet/i.test(userAgent);
    };

    setIsMobileDevice(checkMobileDevice());
  }, []);

  useEffect(() => {
    if (!isMobileDevice) return;

    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        // screen.orientation API 사용 (모던 브라우저)
        if (screen.orientation) {
          setIsLandscape(screen.orientation.type.includes('landscape'));
        } 
        // window.orientation 사용 (레거시 지원)
        else if (typeof window.orientation !== 'undefined') {
          setIsLandscape(Math.abs(window.orientation as number) === 90);
        }
      }
    };

    // 초기 체크
    checkOrientation();

    // 방향 변경 이벤트 리스너
    window.addEventListener('orientationchange', checkOrientation);
    // screen.orientation API 이벤트 리스너
    if (screen.orientation) {
      screen.orientation.addEventListener('change', checkOrientation);
    }

    return () => {
      window.removeEventListener('orientationchange', checkOrientation);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', checkOrientation);
      }
    };
  }, [isMobileDevice]);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isLandscape) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLandscape]);

  if (!mounted || !isLandscape || !isMobileDevice) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="orientation-modal-title"
    >
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/95 transition-opacity"
        aria-hidden="true"
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-black rounded-lg shadow-xl w-[70vw] max-w-[400px] transform transition-all border">
        <div className="flex flex-col items-center gap-6 p-8">
          <div className="relative overflow-hidden">
            <Image
              src="/MS Logo emblem.svg"
              alt="megashorts emblem"
              width={80}
              height={80}
              className="object-cover"
              priority
            />
          </div>
          <p 
            id="orientation-modal-title"
            className="text-center text-base font-medium text-muted-foreground"
            style={{ whiteSpace: 'pre-line' }}
          >
            메가쇼츠는 세로컨텐츠 전용 플랫폼입니다.{'\n'}디바이스를 세로로 이용하세요!
          </p>
          <Link
            href=""
            className="w-auto text-sm px-4 py-2 bg-primary text-white text-center rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            디바이스 세로고정 안내
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
