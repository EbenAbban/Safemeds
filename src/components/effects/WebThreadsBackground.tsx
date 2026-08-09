"use client";

import { useEffect, useState, type ComponentProps } from "react";
import dynamic from "next/dynamic";
import type WebThreadsType from "./WebThreads";

// Loaded on demand — kept out of the initial page JS — and skipped
// entirely for prefers-reduced-motion users.
const WebThreads = dynamic(() => import("./WebThreads"), { ssr: false });

type WebThreadsBackgroundProps = ComponentProps<typeof WebThreadsType> & {
  wrapperClassName?: string;
};

export default function WebThreadsBackground({ wrapperClassName = "", ...webThreadsProps }: WebThreadsBackgroundProps) {
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
      <WebThreads {...webThreadsProps} />
    </div>
  );
}
