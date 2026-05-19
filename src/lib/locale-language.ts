import { Language } from "@prisma/client";
import { defaultLocale, isValidLocale, type LocaleCode } from "@/i18n/config";

const localeToLanguageMap: Record<LocaleCode, Language> = {
  en: Language.ENGLISH,
  ko: Language.KOREAN,
  zh: Language.CHINESE,
};

const languageToLocaleMap: Partial<Record<Language, LocaleCode>> = {
  [Language.ENGLISH]: "en",
  [Language.KOREAN]: "ko",
  [Language.CHINESE]: "zh",
};

export const supportedProfileLanguages = Object.values(localeToLanguageMap);

export function localeToMyLanguage(locale: string): Language {
  return isValidLocale(locale) ? localeToLanguageMap[locale] : localeToLanguageMap[defaultLocale];
}

export function myLanguageToLocale(language: Language | string | null | undefined): LocaleCode {
  if (!language) return defaultLocale;

  return languageToLocaleMap[language as Language] ?? defaultLocale;
}
