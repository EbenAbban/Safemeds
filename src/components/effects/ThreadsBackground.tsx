"use client";

import { useEffect, useState, type ComponentProps } from "react";
import Threads from "./Threads";

type ThreadsBackgroundProps = ComponentProps<typeof Threads> & {
  wrapperClassName?: string;
};

// Skips the animated WebGL canvas for users who prefer reduced motion.
export default function ThreadsBackground({ wrapperClassName = "", ...threadsProps }: ThreadsBackgroundProps) {
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
    <div className={wrapperClassName} aria-hidden="true">
      <Threads {...threadsProps} />
    </div>
  );
}
