"use server";

import { validateRequest } from "@/auth";
import { isValidLocale, type LocaleCode } from "@/i18n/config";
import { localeToMyLanguage } from "@/lib/locale-language";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function updatePreferredLocale(locale: LocaleCode) {
  if (!isValidLocale(locale)) {
    throw new Error("Unsupported locale");
  }

  const myLanguage = localeToMyLanguage(locale);
  const cookieStore = await cookies();

  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  const { user } = await validateRequest();

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { myLanguage },
    });
  }

  return { locale, myLanguage };
}
