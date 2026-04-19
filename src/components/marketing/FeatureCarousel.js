"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";

const SLIDES = [
  {
    title: "Proximity-aware",
    body: "Prioritizes feasible pipe distances so partnerships are practical to build, not just close on a map.",
    accent: "var(--accent-cool)",
  },
  {
    title: "Thermal fit",
    body: "Matches waste heat temperature and capacity to demand so transfer losses stay predictable.",
    accent: "var(--accent-heat)",
  },
  {
    title: "Schedule alignment",
    body: "Surfaces overlap in operating windows so energy exchange lines up with how plants actually run.",
    accent: "var(--accent-violet)",
  },
  {
    title: "Feedback loop",
    body: "Mark matches as useful or not so ranking quality improves from real facility outcomes.",
    accent: "var(--good)",
  },
  {
    title: "Map view",
    body: "See your facility alongside ranked partners geographically — full tile integration on the roadmap.",
    accent: "var(--primary)",
  },
];

export default function FeatureCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  const go = useCallback((next) => {
    const n = ((next % SLIDES.length) + SLIDES.length) % SLIDES.length;
    setIndex(n);
  }, []);

  const slide = SLIDES[index];

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex((i) => (i + 1) % SLIDES.length);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
    }
  };

  return (
    <div
      className="carousel"
      tabIndex={0}
      role="region"
      aria-label="Feature highlights"
      onKeyDown={onKeyDown}
      style={{ outline: "none" }}
    >
      <Card variant="brutal" strong aria-live="polite" aria-atomic="true">
        <div
          style={{
            width: 6,
            height: 48,
            borderRadius: 2,
            background: slide.accent,
            marginBottom: 16,
          }}
        />
        <h3 style={{ margin: "0 0 10px", fontSize: "clamp(22px, 4vw, 30px)" }}>{slide.title}</h3>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 16, lineHeight: 1.55, maxWidth: 560 }}>{slide.body}</p>
      </Card>
      <div className="carousel-controls" role="tablist" aria-label="Feature highlights">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            className="carousel-dot"
            aria-label={`Show ${s.title}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
