"use client";

import { PWA_STANDALONE_COOKIE, PWA_SESSION_MAX_AGE_SECONDS } from "@/lib/pwa-session";

export function isStandalonePWA() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isMobileViewport() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(max-width: 767px)").matches ||
    /android|ipad|iphone|ipod|mobile|tablet/i.test(navigator.userAgent)
  );
}

export function markStandalonePwaCookie() {
  if (typeof document === "undefined") return;

  document.cookie = [
    `${PWA_STANDALONE_COOKIE}=1`,
    "Path=/",
    `Max-Age=${PWA_SESSION_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
}

export function canWarmVideoNetwork() {
  if (typeof navigator === "undefined") return false;

  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;

  if (connection?.saveData) return false;
  if (connection?.effectiveType && /(^2g$|slow-2g)/i.test(connection.effectiveType)) {
    return false;
  }

  return true;
}
