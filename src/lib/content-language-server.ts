import { Language, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  DEFAULT_CONTENT_LANGUAGE_POLICY,
  type ContentLanguagePolicy,
  isContentLanguagePolicy,
} from '@/lib/content-language';
import { localeToMyLanguage } from '@/lib/locale-language';

export async function getContentLanguagePolicy(): Promise<ContentLanguagePolicy> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'contentLanguagePolicy' },
    select: { value: true },
  });

  const storedValue = setting?.value as { enabled?: boolean; value?: unknown } | null | undefined;

  if (storedValue?.enabled === false) {
    return DEFAULT_CONTENT_LANGUAGE_POLICY;
  }

  return isContentLanguagePolicy(storedValue?.value)
    ? storedValue.value
    : DEFAULT_CONTENT_LANGUAGE_POLICY;
}

export function getContentLanguageWhere(
  locale: string,
  policy: ContentLanguagePolicy,
): Prisma.PostWhereInput {
  if (policy !== 'FILTER_BY_SELECTED_LANGUAGE') {
    return {};
  }

  const language = localeToMyLanguage(locale) as Language;

  return {
    OR: [
      { postLanguage: language },
      {
        videos: {
          some: {
            subtitle: {
              has: language,
            },
          },
        },
      },
    ],
  };
}
