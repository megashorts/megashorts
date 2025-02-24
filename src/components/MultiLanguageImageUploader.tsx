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
}

export function MultiLanguageImageUploader({ 
  onImagesUploaded, 
  onButtonTextChange, 
  buttonTexts = {}, 
  className, 
  username,
  initialImages = {}
}: MultiLanguageImageUploaderProps) {
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>(() => {
    return Object.entries(initialImages).map(([locale, data]) => ({
      file: new File([], `preview_${locale}`),
      preview: getThumbnailUrl(data.imageId, 'public'),
      locale: locale.toUpperCase() as Language
    }));
  });

  const getLocaleFromFileName = (fileName: string): Language => {
    const match = fileName.match(/_([a-z]{2})\./i);
    if (!match) return 'KOREAN';
    
    const code = match[1].toLowerCase();
    return LANGUAGE_CODES[code as keyof typeof LANGUAGE_CODES] || 'KOREAN';
  };

  const handleImagePrepared = useCallback(({ file, preview }: { file: File; preview: string }) => {
    const locale = getLocaleFromFileName(file.name);

    // 이미 해당 언어의 이미지가 있으면 교체
    setPreviewImages(prev => {
      const existingIndex = prev.findIndex(img => img.locale === locale);
      const newImage = { file, preview, locale };

      if (existingIndex !== -1) {
        URL.revokeObjectURL(prev[existingIndex].preview);
        const newImages = [...prev];
        newImages[existingIndex] = newImage;
        return newImages;
      }
      return [...prev, newImage];
    });

    onImagesUploaded([{ file, locale }]);
  }, [onImagesUploaded]);

  const removeImage = (index: number) => {
    setPreviewImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
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
                <span className="absolute -bottom-1 -right-1 text-xs bg-black/50 text-white px-1 rounded">
                  {FLAGS[image.locale]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 버튼 텍스트 입력 */}
        {onButtonTextChange && previewImages.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">버튼 텍스트</p>
            <div className="grid grid-cols-2 gap-2">
              {previewImages.map((image) => (
                <div key={image.locale} className="flex items-center gap-2">
                  <span className="text-sm">{FLAGS[image.locale]}</span>
                  <Input
                    value={buttonTexts[image.locale.toLowerCase()] || ''}
                    onChange={(e) => onButtonTextChange(image.locale.toLowerCase(), e.target.value)}
                    placeholder="버튼 텍스트"
                    className="text-sm h-8"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
