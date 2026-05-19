import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';
import {localeCodes, defaultLocale} from './config';

// config.ts의 단일 설정에서 자동으로 라우팅 구성을 생성합니다.
// 언어를 추가/제거할 때 config.ts만 수정하면 여기에도 자동 반영됩니다.
export const routing = defineRouting({
  locales: localeCodes,
  defaultLocale: defaultLocale,
  localePrefix: 'as-needed'
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
