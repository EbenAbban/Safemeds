"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type LiquidEtherType from "./LiquidEther";

// Loaded on demand — never part of the initial page JS — and skipped
// entirely for prefers-reduced-motion users, same as the other WebGL effects.
const LiquidEther = dynamic(() => import("./LiquidEther"), { ssr: false });

type LiquidEtherBackgroundProps = ComponentProps<typeof LiquidEtherType> & {
  wrapperClassName?: string;
};

export default function LiquidEtherBackground({ wrapperClassName = "", ...etherProps }: LiquidEtherBackgroundProps) {
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
    <div className={wrapperClassName}>
      <LiquidEther {...etherProps} />
    </div>
  );
}
