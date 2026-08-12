"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `value` once, the moment it scrolls into view — never on a
 * loop. Per the redesign brief: "subtle count-up animation when visible... do
 * not continuously animate." Only meant for numbers that are actually real
 * (e.g. a count of real campus drop points) — never wire this to a fabricated
 * statistic.
 */
export default function CountUp({
  value,
  durationMs = 900,
  className,
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = () => {
      if (hasRun.current) return;
      hasRun.current = true;

      if (prefersReducedMotion) {
        setDisplay(value);
        return;
      }

      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / durationMs);
        // Ease-out cubic — quick start, gentle settle.
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) run();
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
