"use client";

import { useEffect } from "react";
import { isMobileViewport, isStandalonePWA, markStandalonePwaCookie } from "@/lib/pwa-client";
import { videoDB } from "@/lib/indexedDB";

const PWA_SESSION_EXTENDED_AT_KEY = "ms_pwa_session_extended_at";
const PWA_SESSION_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;

async function lockPortraitIfAvailable() {
  const orientation = screen.orientation as ScreenOrientation & {
    lock?: (orientation: "portrait" | "landscape" | "any" | "natural") => Promise<void>;
  };

  if (!orientation?.lock) return;

  try {
    await orientation.lock("portrait");
  } catch {
    // Some browsers, especially iOS Safari, do not allow programmatic locks.
  }
}

async function extendPwaSessionIfNeeded() {
  const lastExtendedAt = Number(localStorage.getItem(PWA_SESSION_EXTENDED_AT_KEY) ?? 0);
  if (Date.now() - lastExtendedAt < PWA_SESSION_REFRESH_INTERVAL_MS) return;

  const response = await fetch("/api/auth/pwa-session", {
    method: "POST",
    headers: {
      "X-Megashorts-PWA": "1",
    },
  });

  if (response.ok) {
    localStorage.setItem(PWA_SESSION_EXTENDED_AT_KEY, String(Date.now()));
  }
}

export function PWAEnhancer() {
  useEffect(() => {
    const updatePwaState = () => {
      const standalone = isStandalonePWA();
      const mobile = isMobileViewport();
      const landscape = window.matchMedia("(orientation: landscape)").matches;

      document.documentElement.classList.toggle("pwa-standalone", standalone);
      document.documentElement.classList.toggle("pwa-mobile", standalone && mobile);
      document.documentElement.classList.toggle("pwa-landscape", standalone && mobile && landscape);

      if (!standalone) return;

      markStandalonePwaCookie();
      lockPortraitIfAvailable();
      extendPwaSessionIfNeeded().catch(() => {});
      videoDB.flushOfflineActions().catch(() => {});
    };

    updatePwaState();

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");
    const orientationQuery = window.matchMedia("(orientation: landscape)");

    standaloneQuery.addEventListener("change", updatePwaState);
    fullscreenQuery.addEventListener("change", updatePwaState);
    orientationQuery.addEventListener("change", updatePwaState);
    window.addEventListener("orientationchange", updatePwaState);
    window.addEventListener("online", updatePwaState);

    return () => {
      standaloneQuery.removeEventListener("change", updatePwaState);
      fullscreenQuery.removeEventListener("change", updatePwaState);
      orientationQuery.removeEventListener("change", updatePwaState);
      window.removeEventListener("orientationchange", updatePwaState);
      window.removeEventListener("online", updatePwaState);
    };
  }, []);

  return null;
}
