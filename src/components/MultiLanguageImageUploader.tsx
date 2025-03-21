'use client';

import { useCallback, useState } from 'react';
import { Language } from '@prisma/client';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/ImageUploader';
import { getThumbnailUrl } from '@/lib/constants';

interface MultiLanguageImageUploaderProps {
  onImagesUploaded: (files: { file: File; locale: Language }[]) => void;
  onButtonTextChange?: (locale: string, text: string) => void;
  onDefaultButtonTextChange?: (text: string) => void; // 디폴트 버튼 텍스트 변경 콜백 추가
  onImageRemove?: (locale: string) => void;
  buttonTexts?: Record<string, string>;
  className?: string;
  username?: string;
  initialImages?: Record<string, { imageId: string }>;
}

const LANGUAGE_CODES = {
  kr: 'KOREAN',
  en: 'ENGLISH',
  cn: 'CHINESE',
  jp: 'JAPANESE',
  th: 'THAI',
  es: 'SPANISH',
  id: 'INDONESIAN',
  vn: 'VIETNAMESE',
} as const;

const FLAGS: Record<Language, string> = {
  KOREAN: '🇰🇷',
  ENGLISH: '🇺🇸',
  CHINESE: '🇨🇳',
  JAPANESE: '🇯🇵',
  THAI: '🇹🇭',
  SPANISH: '🇪🇸',
  INDONESIAN: '🇮🇩',
  VIETNAMESE: '🇻🇳',
};

interface PreviewImage {
  file: File;
  preview: string;
  locale: Language;
  isDefault?: boolean; // 디폴트 이미지 여부 추가
}

export function MultiLanguageImageUploader({ 
  onImagesUploaded, 
  onButtonTextChange, 
  onDefaultButtonTextChange,
  onImageRemove,
  buttonTexts = {}, 
  className, 
  username,
  initialImages = {}
}: MultiLanguageImageUploaderProps) {
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>(() => {
    return Object.entries(initialImages).map(([locale, data]) => ({
      file: new File([], `preview_${locale}`),
      preview: getThumbnailUrl(data.imageId, 'public'),
      locale: locale === 'default' ? 'KOREAN' : locale.toUpperCase() as Language,
      isDefault: locale === 'default' // 디폴트 이미지 여부 설정
    }));
  });

  const getLocaleFromFileName = (fileName: string): Language => {
    const match = fileName.match(/_([a-z]{2})\./i);
    if (!match) {
      // 언어 코드가 없는 경우 기본값 반환 (변경 없음)
      return 'KOREAN';
    }
    
    const code = match[1].toLowerCase();
    return LANGUAGE_CODES[code as keyof typeof LANGUAGE_CODES] || 'KOREAN';
  };

  const handleImagePrepared = useCallback(({ file, preview }: { file: File; preview: string }) => {
    const locale = getLocaleFromFileName(file.name);
    const hasLanguageCode = file.name.match(/_([a-z]{2})\./i);
    const isDefault = !hasLanguageCode;
    
    // 기존 이미지 목록 업데이트
    setPreviewImages(prev => {
      // 디폴트 이미지인 경우 기존 디폴트 이미지 제거
      let newImages = [...prev];
      if (isDefault) {
        newImages = newImages.filter(img => !img.isDefault);
      } else {
        // 특정 언어 이미지인 경우 해당 언어의 기존 이미지 제거
        const existingIndex = newImages.findIndex(img => img.locale === locale && !img.isDefault);
        if (existingIndex !== -1) {
          URL.revokeObjectURL(newImages[existingIndex].preview);
          newImages.splice(existingIndex, 1);
        }
      }
      
      // 새 이미지 추가
      return [...newImages, { 
        file, 
        preview, 
        locale, 
        isDefault 
      }];
    });
  
    // 부모 컴포넌트에 이미지 정보 전달
    onImagesUploaded([{ file, locale }]);
  }, [onImagesUploaded]);

  const removeImage = (index: number) => {
    const imageToRemove = previewImages[index];
    
    setPreviewImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
    
    // 부모 컴포넌트에 이미지 삭제 알림
    if (onImageRemove) {
      if (imageToRemove.isDefault) {
        onImageRemove('default');
      } else {
        onImageRemove(imageToRemove.locale.toLowerCase());
      }
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* 이미지 업로더 */}
        <ImageUploader
          onImagePrepared={handleImagePrepared}
          aspectRatio={2/3}
          hidePreview
          username={`notice_modal_${username || 'unknown'}`}
        />

        {/* 이미지 프리뷰 */}
        {previewImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {previewImages.map((image, index) => (
              <div key={index} className="relative">
                <div className="w-[50px] h-[75px] relative">
                  <Image
                    src={image.preview}
                    alt=""
                    fill
                    className="rounded border object-cover"
                    unoptimized
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-1 -right-1 h-4 w-4 bg-black/50 hover:bg-black/70 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3 text-white" />
                </Button>
                {/* 디폴트 이미지가 아닌 경우에만 국기 표시 */}
                {!image.isDefault && (
                  <span className="absolute -bottom-1 -right-1 text-xs bg-black/50 text-white px-1 rounded">
                    {FLAGS[image.locale]}
                  </span>
                )}
                {/* 디폴트 이미지인 경우 '기본' 표시 */}
                {image.isDefault && (
                  <span className="absolute -bottom-1 -right-1 text-xs bg-black/50 text-white px-1 rounded">
                    All
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 디폴트 이미지 버튼 텍스트 입력 */}
        {onButtonTextChange && previewImages.some(img => img.isDefault) && onDefaultButtonTextChange && (
          <div className="mt-4 border-t pt-4">
            {/* <p className="text-sm font-medium mb-2">기본 이미지 버튼 텍스트</p> */}
            <div className="flex items-center gap-2">
              <span className="text-sm">All</span>
              <Input
                value={buttonTexts.default || ''}
                onChange={(e) => onDefaultButtonTextChange(e.target.value)}
                placeholder="버튼 텍스트"
                className="text-sm h-8"
              />
            </div>
          </div>
        )}

        {/* 버튼 텍스트 입력 */}
        {onButtonTextChange && previewImages.filter(img => !img.isDefault).length > 0 && (
          <div className="border-t pt-4">
            {/* <p className="text-sm font-medium mb-2">버튼 텍스트</p> */}
            <div className="grid grid-cols-2 gap-2">
              {previewImages
                .filter(image => !image.isDefault) // 디폴트 이미지는 버튼 텍스트 입력에서 제외
                .map((image) => (
                  <div key={image.locale} className="flex items-center gap-2">
                    <span className="text-sm">{FLAGS[image.locale]}</span>
                    <Input
                      value={buttonTexts[image.locale.toLowerCase()] || ''}
                      onChange={(e) => onButtonTextChange(image.locale.toLowerCase(), e.target.value)}
                      placeholder="버튼 텍스트"
                      className="text-sm h-8"
                    />
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
