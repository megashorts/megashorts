'use client';

import { useLocale } from 'next-intl';
import { useTransition, useState, useRef, useEffect } from 'react';
import { locales, type LocaleCode } from '@/i18n/config';
import { useRouter as useIntlRouter, usePathname as useIntlPathname } from '@/i18n/routing';
import { useSession } from '@/components/SessionProvider';
import { updatePreferredLocale } from '@/app/actions/locale';
import { myLanguageToLocale } from '@/lib/locale-language';
import { useQueryClient } from '@tanstack/react-query';
import type { Language } from '@prisma/client';
import LanguageFlag from '@/components/LanguageFlag';

// 동그란 국기 버튼 + 드롭다운 방식의 언어 선택 컴포넌트
export default function LocaleSwitcher() {
  const locale = useLocale() as LocaleCode;
  const router = useIntlRouter();
  const pathname = useIntlPathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const userLocale = user?.myLanguage
    ? myLanguageToLocale(user.myLanguage as Language)
    : null;
  const activeLocale = userLocale ?? locale;

  // 현재 선택된 언어
  const currentLocale = locales.find(l => l.code === activeLocale) || locales[0];

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userLocale || userLocale === locale || isPending) return;

    router.replace(pathname, { locale: userLocale });
  }, [isPending, locale, pathname, router, userLocale]);

  function handleLocaleChange(newLocale: LocaleCode) {
    setIsOpen(false);
    startTransition(() => {
      void (async () => {
        const result = await updatePreferredLocale(newLocale);

        queryClient.setQueryData(['session'], (oldData: any) => {
          if (!oldData?.user) return oldData;

          return {
            ...oldData,
            user: {
              ...oldData.user,
              myLanguage: result.myLanguage,
            },
          };
        });

        router.replace(pathname, { locale: newLocale });
        router.refresh();
      })();
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 동그란 국기 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-200 hover:opacity-90"
        aria-label="Select language"
        disabled={isPending}
      >
        <LanguageFlag
          language={currentLocale.code}
          className={`h-5 w-5 ${isPending ? 'opacity-50' : ''}`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px] z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => handleLocaleChange(loc.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent/50 ${
                loc.code === activeLocale ? 'bg-accent/30 font-medium' : ''
              }`}
            >
              <LanguageFlag language={loc.code} className="h-5 w-5 shrink-0" />
              <span>{loc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
