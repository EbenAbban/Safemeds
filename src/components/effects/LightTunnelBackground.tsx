"use client";

import { useEffect, useState, type ComponentProps } from "react";
import dynamic from "next/dynamic";
import type LightTunnelType from "./LightTunnel";

// Loaded on demand — kept out of the initial page JS — and skipped
// entirely for prefers-reduced-motion users.
const LightTunnel = dynamic(() => import("./LightTunnel"), { ssr: false });

type LightTunnelBackgroundProps = ComponentProps<typeof LightTunnelType> & {
  wrapperClassName?: string;
};

export default function LightTunnelBackground({ wrapperClassName = "", ...tunnelProps }: LightTunnelBackgroundProps) {
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
      <LightTunnel {...tunnelProps} />
    </div>
  );
}
