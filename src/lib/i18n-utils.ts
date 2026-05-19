import { Language } from "@prisma/client";

/**
 * Returns the translated content if it exists for the current locale,
 * otherwise falls back to the original content (regardless of whether the locale is 'en' or not).
 * This prevents forcing English titles for Korean/Chinese original content.
 */
export function getDynamicContent(
  originalContent: string | null | undefined,
  i18nContent: any | null | undefined,
  currentLocale: string
): string {
  if (!originalContent) return "";
  
  if (i18nContent && typeof i18nContent === "object" && i18nContent[currentLocale]) {
    return i18nContent[currentLocale];
  }

  // Fallback to original content
  return originalContent;
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
