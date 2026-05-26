import Image from "next/image";
import { Language } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface LanguageFlagProps {
  language: Language | string;
  className?: string;
}

const FLAG_BY_CODE: Record<string, string> = {
  KOREAN: "/flags/ko.svg",
  KO: "/flags/ko.svg",
  KR: "/flags/ko.svg",
  ENGLISH: "/flags/en.svg",
  EN: "/flags/en.svg",
  US: "/flags/en.svg",
  CHINESE: "/flags/zh.svg",
  ZH: "/flags/zh.svg",
  CN: "/flags/zh.svg",
};

const FALLBACK_FLAG_BY_CODE: Record<string, string> = {
  JAPANESE: "🇯🇵",
  JP: "🇯🇵",
  THAI: "🇹🇭",
  TH: "🇹🇭",
  SPANISH: "🇪🇸",
  ES: "🇪🇸",
  INDONESIAN: "🇮🇩",
  ID: "🇮🇩",
  VIETNAMESE: "🇻🇳",
  VN: "🇻🇳",
};

function getFlagSrc(value: string) {
  const normalized = value.trim().toUpperCase();
  return FLAG_BY_CODE[normalized] || null;
}

export default function LanguageFlag({ language, className = "" }: LanguageFlagProps) {
  const src = getFlagSrc(String(language || ""));
  const fallbackFlag = FALLBACK_FLAG_BY_CODE[String(language || "").trim().toUpperCase()];

  if (!src) {
    return <span className={className}>{fallbackFlag || "🌐"}</span>;
  }

  return (
    <span className={cn("relative inline-flex h-5 w-5 overflow-hidden rounded-full align-middle", className)}>
      <Image src={src} alt="" fill sizes="20px" className="object-cover" />
    </span>
  );
}
