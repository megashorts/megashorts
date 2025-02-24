import { Language } from '@prisma/client';

export type HideOption = 'ALWAYS' | 'DAY' | 'NEVER';

export interface NoticeModalI18nData {
  imageId: string;
  buttonText?: string;
}

export type LowerCaseLanguage = Lowercase<Language>;

export interface NoticeModal {
  id: number;
  title: string;
  priority: number;
  hideOption: HideOption;
  linkUrl?: string | null;
  buttonUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  i18nData: {
    [K in LowerCaseLanguage]?: NoticeModalI18nData;
  };
}

export interface NoticeModalFormData {
  title: string;
  priority: number;
  hideOption: HideOption;
  linkUrl?: string;
  buttonUrl?: string;
  i18nData: {
    [K in LowerCaseLanguage]?: NoticeModalI18nData;
  };
}
