"use client";

import { useEffect } from "react";

/**
 * Registers the service worker. Renders nothing.
 *
 * Registration failure is swallowed on purpose: caching and push are
 * enhancements, and the app must stay fully usable without them.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // A worker registered from a dev build would cache Turbopack's
    // ever-changing dev assets and produce confusing stale reloads.
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    };

    // Registering after load keeps the worker's install off the critical path
    // for first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
