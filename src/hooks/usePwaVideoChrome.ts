"use client";

import { useEffect } from "react";
import { usePwaDisplayMode } from "@/hooks/usePwaDisplayMode";

export function usePwaVideoChrome(controlsVisible: boolean) {
  const pwaDisplay = usePwaDisplayMode();
  const isPwa = pwaDisplay.isStandalone;
  const isPwaMobile = pwaDisplay.isStandalone && pwaDisplay.isMobile;

  useEffect(() => {
    document.documentElement.classList.toggle("pwa-video-screen", isPwa);
    document.documentElement.classList.toggle(
      "pwa-video-chrome-hidden",
      isPwa && !controlsVisible,
    );

    return () => {
      document.documentElement.classList.remove("pwa-video-screen");
      document.documentElement.classList.remove("pwa-video-chrome-hidden");
    };
  }, [controlsVisible, isPwa]);

  return {
    ...pwaDisplay,
    isPwa,
    isPwaMobile,
  };
}
