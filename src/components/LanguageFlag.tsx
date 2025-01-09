import { ReactNode } from 'react';
import { Language } from '@prisma/client';

interface LanguageFlagProps {
  language: Language;
}

const languageFlags: Record<Language, ReactNode> = {
  KOREAN: '🇰🇷',
  ENGLISH: '🇺🇸',
  CHINESE: '🇨🇳',
  JAPANESE: '🇯🇵',
  THAI: '🇹🇭',
  SPANISH: '🇪🇸',
  INDONESIAN: '🇮🇩',
  VIETNAMESE: '🇻🇳'
};

export default function LanguageFlag({ language }: LanguageFlagProps) {
  return (
    <span className="inline-flex items-center text-xl translate-y-[2px]">
      {languageFlags[language] || language}
    </span>
  );
}