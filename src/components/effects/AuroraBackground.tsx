"use client";

import { useEffect, useState } from "react";
import Aurora from "./Aurora";

interface AuroraBackgroundProps {
  colorStops?: [string, string, string];
  amplitude?: number;
  blend?: number;
  speed?: number;
  className?: string;
}

// Skips the animated WebGL canvas for users who prefer reduced motion —
// the page's existing static gradient behind this layer is a fine fallback.
export default function AuroraBackground({ className = "", ...auroraProps }: AuroraBackgroundProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEnabled(!query.matches);
    const handleChange = () => setEnabled(!query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  if (!enabled) return null;

  return (
    <div className={className} aria-hidden="true">
      <Aurora {...auroraProps} />
    </div>
  );
}
