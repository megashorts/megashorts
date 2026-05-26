import { Language } from "@prisma/client";
import { getLocalizedContent } from "@/lib/content-language";

/**
 * Returns translated content for the current locale,
 * then falls back to English and finally the original content.
 */
export function getDynamicContent(
  originalContent: string | null | undefined,
  i18nContent: unknown,
  currentLocale: string
): string {
  return getLocalizedContent(originalContent, i18nContent, currentLocale);
}

/**
 * Helper to get an array of supported subtitle languages from the DB array
 */
export function getSupportedSubtitleLocales(subtitles: Language[] | undefined): string[] {
  if (!subtitles) return [];
  const map: Record<Language, string> = {
    [Language.ENGLISH]: 'en',
    [Language.KOREAN]: 'ko',
    [Language.CHINESE]: 'zh',
    [Language.JAPANESE]: 'ja',
    [Language.THAI]: 'th',
    [Language.SPANISH]: 'es',
    [Language.INDONESIAN]: 'id',
    [Language.VIETNAMESE]: 'vi',
  };
  
  return subtitles.map(s => map[s]).filter(Boolean);
}
