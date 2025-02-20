import { Language } from '@prisma/client';

export interface LanguageFlagProps {
  language: Language;
  className?: string;
}

export default function LanguageFlag({ language, className = '' }: LanguageFlagProps) {
  const getFlag = (lang: Language) => {
    switch (lang) {
      case 'KOREAN':
        return '🇰🇷';
      case 'ENGLISH':
        return '🇺🇸';
      case 'CHINESE':
        return '🇨🇳';
      case 'JAPANESE':
        return '🇯🇵';
      case 'THAI':
        return '🇹🇭';
      case 'SPANISH':
        return '🇪🇸';
      case 'INDONESIAN':
        return '🇮🇩';
      case 'VIETNAMESE':
        return '🇻🇳';
      default:
        return '🌐';
    }
  };

  return (
    <span className={className}>
      {getFlag(language)}
    </span>
  );
}
