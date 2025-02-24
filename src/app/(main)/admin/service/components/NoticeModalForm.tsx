'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoticeModalFormData, HideOption, LowerCaseLanguage } from './types';
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

  useEffect(() => {
    if (initialData) {
      console.log('Setting form data:', initialData);
      setTitle(initialData.title);
      setPriority(initialData.priority);
      setHideOption(initialData.hideOption);
      setLinkUrl(initialData.linkUrl || '');
      setButtonUrl(initialData.buttonUrl || '');
      setI18nData(initialData.i18nData);
    } else {
      // 새 모달 생성 시 초기화
      setTitle('');
      setPriority(1);
      setHideOption('ALWAYS');
      setLinkUrl('');
      setButtonUrl('');
      setI18nData({});
    }
  }, [initialData]);

  const handleImagesUploaded = async (files: { file: File; locale: Language }[]) => {
    const newI18nData = { ...i18nData };
    
    for (const { file, locale } of files) {
      try {
        // Cloudflare에 이미지 업로드하고 ID 받기
        const imageId = await uploadImage(file);
        
        const localeKey = locale.toLowerCase() as Lowercase<Language>;
        newI18nData[localeKey] = {
          ...newI18nData[localeKey],
          imageId, // 파일명 대신 Cloudflare 이미지 ID 저장
        };
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
    
    setI18nData(newI18nData);
  };

  const handleButtonTextChange = (locale: string, text: string) => {
    const localeKey = locale as keyof NoticeModalFormData['i18nData'];
    setI18nData(prev => ({
      ...prev,
      [localeKey]: {
        ...prev[localeKey],
        buttonText: text
      }
    }));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    onSubmit({
      title,
      priority,
      hideOption,
      linkUrl: linkUrl || undefined,
      buttonUrl: buttonUrl || undefined,
      i18nData
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-[425px] p-6">
        <DialogHeader className="mb-4">
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
              buttonTexts={Object.entries(i18nData).reduce((acc, [locale, data]) => ({
                ...acc,
                [locale]: data?.buttonText
              }), {})}
              initialImages={Object.entries(i18nData).reduce((acc, [locale, data]) => ({
                ...acc,
                [locale]: { imageId: data?.imageId }
              }), {})}
              username={user?.username}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
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
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
