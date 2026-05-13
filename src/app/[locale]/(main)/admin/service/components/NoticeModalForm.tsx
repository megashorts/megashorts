'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoticeModalFormData, HideOption, LowerCaseLanguage, NoticeModalI18nData } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Link as LinkIcon, Timer, Save, X, Image as ImageIcon, Square } from 'lucide-react';
import { MultiLanguageImageUploader } from '@/components/MultiLanguageImageUploader';
import { Language } from '@prisma/client';
import { useSession } from '@/components/SessionProvider';
import { useUploader } from '@/hooks/useUploader';

interface NoticeModalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NoticeModalFormData) => void;
  initialData?: NoticeModalFormData;
}

export function NoticeModalForm({ open, onClose, onSubmit, initialData }: NoticeModalFormProps) {
  const { user } = useSession();
  const { uploadImage } = useUploader();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(1);
  const [hideOption, setHideOption] = useState<HideOption>('ALWAYS');
  const [linkUrl, setLinkUrl] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [i18nData, setI18nData] = useState<NoticeModalFormData['i18nData']>({});
  const [isUploading, setIsUploading] = useState(false);

  // 컴포넌트 마운트 시 한 번만 실행되는 useEffect
  const initialDataRef = useRef(initialData);
  
  useEffect(() => {
    // 컴포넌트가 마운트될 때만 초기 데이터 설정
    if (initialDataRef.current) {
      console.log('Setting form data:', initialDataRef.current);
      setTitle(initialDataRef.current.title);
      setPriority(initialDataRef.current.priority);
      setHideOption(initialDataRef.current.hideOption);
      setLinkUrl(initialDataRef.current.linkUrl || '');
      setButtonUrl(initialDataRef.current.buttonUrl || '');
      
      // i18nData가 문자열인 경우 파싱
      let parsedI18nData: NoticeModalFormData['i18nData'] = {};
      
      if (typeof initialDataRef.current.i18nData === 'string') {
        try {
          parsedI18nData = JSON.parse(initialDataRef.current.i18nData);
        } catch (error) {
          console.error('Failed to parse i18nData:', error);
        }
      } else if (initialDataRef.current.i18nData && typeof initialDataRef.current.i18nData === 'object') {
        // 객체인 경우 그대로 사용 (복사하여 사용)
        parsedI18nData = JSON.parse(JSON.stringify(initialDataRef.current.i18nData));
      }
      
      setI18nData(parsedI18nData);
    } else {
      // 새 모달 생성 시 초기화
      setTitle('');
      setPriority(1);
      setHideOption('ALWAYS');
      setLinkUrl('');
      setButtonUrl('');
      setI18nData({});
    }
    // 컴포넌트 마운트 시 한 번만 실행
  }, []);

  const handleImagesUploaded = async (files: { file: File; locale: Language }[]) => {
    if (isUploading) return; // 이미 업로드 중이면 중복 실행 방지
    
    setIsUploading(true);
    try {
      const newI18nData = { ...i18nData };
      
      for (const { file, locale } of files) {
        try {
          // Cloudflare에 이미지 업로드하고 ID 받기
          const imageId = await uploadImage(file);
          console.log(`Image uploaded: ${imageId} for locale: ${locale}`);
          
          // 파일명에서 언어 코드 확인
          const hasLanguageCode = file.name.match(/_([a-z]{2})\./i);
          
          if (!hasLanguageCode) {
            // 언어 코드가 없는 경우 (공통 이미지)
            // defaultImageId로만 저장
            newI18nData.defaultImageId = imageId;
            console.log(`Set defaultImageId: ${imageId}`);
          } else {
            // 특정 언어용 이미지인 경우
            const localeKey = locale.toLowerCase() as LowerCaseLanguage;
            
            // 해당 언어 데이터가 없으면 초기화
            if (!newI18nData[localeKey]) {
              newI18nData[localeKey] = { imageId };
              console.log(`Created new locale data for ${localeKey}: ${imageId}`);
            } else {
              newI18nData[localeKey] = {
                ...newI18nData[localeKey],
                imageId
              };
              console.log(`Updated locale data for ${localeKey}: ${imageId}`);
            }
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }
      
      console.log('Updated i18nData:', JSON.stringify(newI18nData, null, 2));
      setI18nData(newI18nData);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = (locale: string) => {
    setI18nData(prev => {
      const newI18nData = { ...prev };
      
      if (locale === 'default') {
        // 디폴트 이미지 삭제
        delete newI18nData.defaultImageId;
      } else {
        // 특정 언어 이미지 삭제
        // imageId는 필수 속성이므로 해당 언어 데이터를 완전히 삭제
        delete newI18nData[locale as LowerCaseLanguage];
      }
      
      return newI18nData;
    });
  };

  const handleButtonTextChange = (locale: string, text: string) => {
    const localeKey = locale as LowerCaseLanguage;
    
    setI18nData(prev => {
      const newI18nData = { ...prev };
      
      // 해당 언어 데이터가 없으면 초기화 (imageId는 필수이므로 임시 값 설정)
      if (!newI18nData[localeKey]) {
        // 이미지 ID가 없으면 버튼 텍스트만 설정할 수 없음
        return newI18nData;
      }
      
      // 이미 해당 언어 데이터가 있는 경우
      if (newI18nData[localeKey]) {
        newI18nData[localeKey] = {
          ...newI18nData[localeKey],
          buttonText: text
        };
      }
      
      return newI18nData;
    });
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
  
    // 최종 데이터 로깅
    const formData = {
      title,
      priority,
      hideOption,
      linkUrl: linkUrl || undefined,
      buttonUrl: buttonUrl || undefined,
      i18nData: JSON.parse(JSON.stringify(i18nData)) // 깊은 복사를 통해 참조 문제 방지
    };
    
    console.log('Submitting data:', formData);
  
    // 중요: 여기서 i18nData를 직접 전달합니다.
    // 이렇게 하면 업데이트된 i18nData가 API로 전송됩니다.
    onSubmit(formData);
  };

  // 디폴트 이미지에 대한 버튼 텍스트 처리 함수 추가
  const handleDefaultButtonTextChange = (text: string) => {
    setI18nData(prev => ({
      ...prev,
      defaultButtonText: text
    }));
  };

  // 버튼 텍스트 및 이미지 ID 추출 함수 수정
  const getButtonTexts = (): Record<string, string> => {
    const result: Record<string, string> = {};
    
    Object.entries(i18nData).forEach(([locale, data]) => {
      if (locale !== 'defaultImageId' && locale !== 'defaultButtonText' && data && typeof data === 'object' && 'buttonText' in data) {
        result[locale] = data.buttonText || '';
      }
    });
    
    // 디폴트 버튼 텍스트가 있으면 추가
    if ('defaultButtonText' in i18nData && i18nData.defaultButtonText) {
      result.default = i18nData.defaultButtonText;
    }
    
    return result;
  };
  
  const getInitialImages = (): Record<string, { imageId: string }> => {
    const result: Record<string, { imageId: string }> = {};
    
    // 각 언어별 이미지 ID 추가
    Object.entries(i18nData).forEach(([locale, data]) => {
      if (locale !== 'defaultImageId' && locale !== 'defaultButtonText' && data && typeof data === 'object' && 'imageId' in data) {
        result[locale] = { imageId: data.imageId };
      }
    });
    
    // 기본 이미지 ID가 있으면 추가
    if (i18nData.defaultImageId) {
      result.default = { imageId: i18nData.defaultImageId };
    }
    
    return result;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-[425px] px-6 py-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-base">
            {initialData ? '모달 수정' : '새 모달'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="모달 제목"
            className="text-sm"
          />

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                max={10}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-20 text-sm"
              />
            </div>

            <div className="flex-1 flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <Select value={hideOption} onValueChange={(value: HideOption) => setHideOption(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALWAYS">항상 보기</SelectItem>
                  <SelectItem value="DAY">오늘은 보지 않기</SelectItem>
                  <SelectItem value="NEVER">다시 보지 않기</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 items-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="이미지 클릭시 이동할 URL"
              className="text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 items-center">
              <Square className="h-4 w-4 text-muted-foreground" />
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="url"
              value={buttonUrl}
              onChange={(e) => setButtonUrl(e.target.value)}
              placeholder="버튼 URL"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              이미지 업로드
            </label>
            <MultiLanguageImageUploader
              onImagesUploaded={handleImagesUploaded}
              onButtonTextChange={handleButtonTextChange}
              onDefaultButtonTextChange={handleDefaultButtonTextChange}
              onImageRemove={handleImageRemove}
              buttonTexts={getButtonTexts()}
              initialImages={getInitialImages()}
              username={user?.username}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={handleSubmit}
            className="h-8 w-8"
            disabled={isUploading}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
