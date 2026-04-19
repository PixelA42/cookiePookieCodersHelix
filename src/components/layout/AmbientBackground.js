"use client";

import { useEffect } from "react";

export default function AmbientBackground() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-public", "true");

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const applyHue = () => {
      if (mq.matches) {
        root.style.setProperty("--ambient-h", "228");
        return;
      }
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const t = Math.min(window.scrollY / maxScroll, 1);
      const hue = Math.round(200 + t * 95);
      root.style.setProperty("--ambient-h", String(hue));
    };

    applyHue();
    window.addEventListener("scroll", applyHue, { passive: true });
    window.addEventListener("resize", applyHue);

    return () => {
      window.removeEventListener("scroll", applyHue);
      window.removeEventListener("resize", applyHue);
      root.removeAttribute("data-public");
      root.style.removeProperty("--ambient-h");
    };
  }, []);

  return null;
}
