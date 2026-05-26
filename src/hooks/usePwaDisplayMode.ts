"use client";

import { useEffect, useState } from "react";
import { isMobileViewport, isStandalonePWA } from "@/lib/pwa-client";

export function usePwaDisplayMode() {
  const [state, setState] = useState({
    isStandalone: false,
    isMobile: false,
    isLandscape: false,
  });

  useEffect(() => {
    const update = () => {
      setState({
        isStandalone: isStandalonePWA(),
        isMobile: isMobileViewport(),
        isLandscape: window.matchMedia("(orientation: landscape)").matches,
      });
    };

    update();

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const orientationQuery = window.matchMedia("(orientation: landscape)");

    standaloneQuery.addEventListener("change", update);
    fullscreenQuery.addEventListener("change", update);
    mobileQuery.addEventListener("change", update);
    orientationQuery.addEventListener("change", update);
    window.addEventListener("orientationchange", update);

    return () => {
      standaloneQuery.removeEventListener("change", update);
      fullscreenQuery.removeEventListener("change", update);
      mobileQuery.removeEventListener("change", update);
      orientationQuery.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return state;
}
