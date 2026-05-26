export const CONTENT_LANGUAGE_POLICIES = [
  'SHOW_ALL_WITH_FALLBACK',
  'FILTER_BY_SELECTED_LANGUAGE',
] as const;

export type ContentLanguagePolicy = (typeof CONTENT_LANGUAGE_POLICIES)[number];

export const DEFAULT_CONTENT_LANGUAGE_POLICY: ContentLanguagePolicy = 'SHOW_ALL_WITH_FALLBACK';

export const CONTENT_LANGUAGE_POLICY_LABELS: Record<ContentLanguagePolicy, string> = {
  SHOW_ALL_WITH_FALLBACK: 'Show all content + prioritize selected language',
  FILTER_BY_SELECTED_LANGUAGE: 'Show only content that supports selected language',
};

export const CONTENT_LANGUAGE_POLICY_DESCRIPTIONS: Record<ContentLanguagePolicy, string> = {
  SHOW_ALL_WITH_FALLBACK:
    'Show all content. For title, description, and subtitles, prioritize the selected language, then fall back to English, then original text.',
  FILTER_BY_SELECTED_LANGUAGE:
    'Show only content where the selected language is the original language or is included in available subtitle languages.',
};

export type VideoUserLanguage =
  | 'KOREAN'
  | 'ENGLISH'
  | 'JAPANESE'
  | 'CHINESE'
  | 'THAI'
  | 'SPANISH'
  | 'INDONESIAN'
  | 'VIETNAMESE';

const LOCALE_TO_VIDEO_LANGUAGE: Record<string, VideoUserLanguage> = {
  en: 'ENGLISH',
  ko: 'KOREAN',
  zh: 'CHINESE',
  ja: 'JAPANESE',
  th: 'THAI',
  es: 'SPANISH',
  id: 'INDONESIAN',
  vi: 'VIETNAMESE',
};

const VIDEO_LANGUAGE_TO_SUBTITLE_LANG: Record<VideoUserLanguage, string> = {
  ENGLISH: 'en',
  KOREAN: 'ko',
  JAPANESE: 'ja',
  CHINESE: 'zh',
  THAI: 'th',
  SPANISH: 'es',
  INDONESIAN: 'id',
  VIETNAMESE: 'vi',
};

const LOCALE_KEY_ALIASES: Record<string, string[]> = {
  en: ['en', 'EN', 'english', 'English', 'ENGLISH'],
  ko: ['ko', 'kr', 'KO', 'KR', 'korean', 'Korean', 'KOREAN', '한국어'],
  zh: ['zh', 'cn', 'ZH', 'CN', 'chinese', 'Chinese', 'CHINESE', '中文'],
};

function normalizeLocale(locale?: string | null) {
  return (locale || 'en').toLowerCase().split('-')[0];
}

function getJsonText(value: unknown, locale: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const keys = LOCALE_KEY_ALIASES[locale] || [locale];

  for (const key of keys) {
    const text = record[key];
    if (typeof text === 'string' && text.trim().length > 0) {
      return text;
    }
  }

  return null;
}

export function isContentLanguagePolicy(value: unknown): value is ContentLanguagePolicy {
  return typeof value === 'string' && CONTENT_LANGUAGE_POLICIES.includes(value as ContentLanguagePolicy);
}

export function getLocalizedContent(
  originalContent: string | null | undefined,
  i18nContent: unknown,
  currentLocale?: string | null,
  fallbackLocale = 'en',
) {
  const locale = normalizeLocale(currentLocale);
  const fallback = normalizeLocale(fallbackLocale);

  return (
    getJsonText(i18nContent, locale) ||
    getJsonText(i18nContent, fallback) ||
    originalContent ||
    ''
  );
}

export function getLocalizedPostTitle<T extends { title: string | null; titleI18n?: unknown }>(
  post: T,
  currentLocale?: string | null,
) {
  return getLocalizedContent(post.title, post.titleI18n, currentLocale);
}

export function getLocalizedPostContent<T extends { content?: string | null; contentI18n?: unknown }>(
  post: T,
  currentLocale?: string | null,
) {
  return getLocalizedContent(post.content, post.contentI18n, currentLocale);
}

export function localeToVideoUserLanguage(locale?: string | null): VideoUserLanguage {
  return LOCALE_TO_VIDEO_LANGUAGE[normalizeLocale(locale)] || 'ENGLISH';
}

export function videoUserLanguageToSubtitleLang(language: VideoUserLanguage) {
  return VIDEO_LANGUAGE_TO_SUBTITLE_LANG[language] || 'en';
}

export function getSubtitleLangCandidates(language: VideoUserLanguage) {
  const preferred = videoUserLanguageToSubtitleLang(language);
  return Array.from(new Set([preferred, 'en']));
}
