// src/i18n/config.ts
// ============================================================
// 다국어 설정 단일 관리 파일 (Single Source of Truth)
// 
// 언어를 추가하거나 제거할 때 이 파일만 수정하면
// 전체 플랫폼(라우팅, 메시지, UI, SEO)에 자동 반영됩니다.
// ============================================================

export type LocaleCode = 'en' | 'ko' | 'zh';

export interface LocaleConfig {
  code: LocaleCode;
  name: string;        // 해당 언어로 표시되는 이름
  englishName: string; // 영어 이름
  flag: string;        // 국기 이미지 경로
  dir: 'ltr' | 'rtl';  // 텍스트 방향
}

// ── 지원 언어 목록 (이 배열만 수정하면 전체 반영) ──
export const locales: LocaleConfig[] = [
  { code: 'en', name: 'English',  englishName: 'English',  flag: '/flags/en.svg', dir: 'ltr' },
  { code: 'ko', name: '한국어',    englishName: 'Korean',   flag: '/flags/ko.svg', dir: 'ltr' },
  { code: 'zh', name: '中文',      englishName: 'Chinese',  flag: '/flags/zh.svg', dir: 'ltr' },
];

// ── 기본 언어 ──
export const defaultLocale: LocaleCode = 'en';

// ── 파생 값 (자동 계산, 수동 수정 불필요) ──
export const localeCodes = locales.map(l => l.code);
export const localeFlags: Record<LocaleCode, string> = Object.fromEntries(
  locales.map(l => [l.code, l.flag])
) as Record<LocaleCode, string>;
export const localeNames: Record<LocaleCode, string> = Object.fromEntries(
  locales.map(l => [l.code, l.name])
) as Record<LocaleCode, string>;

// ── 언어 정보 조회 헬퍼 ──
export function getLocaleConfig(code: string): LocaleConfig | undefined {
  return locales.find(l => l.code === code);
}

export function isValidLocale(code: string): code is LocaleCode {
  return localeCodes.includes(code as LocaleCode);
}
