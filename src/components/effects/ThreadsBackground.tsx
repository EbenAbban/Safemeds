"use client";

import { useEffect, useState, type ComponentProps } from "react";
import dynamic from "next/dynamic";
import type ThreadsType from "./Threads";

// Loaded on demand — kept out of the initial page JS — and skipped
// entirely for prefers-reduced-motion users.
const Threads = dynamic(() => import("./Threads"), { ssr: false });

type ThreadsBackgroundProps = ComponentProps<typeof ThreadsType> & {
  wrapperClassName?: string;
};

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
