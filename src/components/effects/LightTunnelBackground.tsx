"use client";

import { useEffect, useState, type ComponentProps } from "react";
import LightTunnel from "./LightTunnel";

type LightTunnelBackgroundProps = ComponentProps<typeof LightTunnel> & {
  wrapperClassName?: string;
};

// Skips the animated WebGL canvas for users who prefer reduced motion.
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
