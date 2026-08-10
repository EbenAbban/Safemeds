"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import InstallScreen from "./InstallScreen";
import { classifyEnvironment, readEnvironment, type PwaEnvironment } from "@/lib/pwa/environment";
import { resolveGateState } from "@/lib/pwa/resolve-gate-state";

export const BYPASS_KEY = "safemeds:pwa-install-bypassed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Shows the install screen over gated routes for mobile browser users.
 *
 * `children` is always rendered — the install screen is an overlay on top, not
 * a replacement. That's what lets the server emit real page content *and* the
 * overlay in one pass: an installed user sees content immediately (the overlay
 * is hidden pre-paint by CSS keyed on the display-mode stamp in <head>), and a
 * gated user sees the install screen immediately, with no hydration flash in
 * either direction.
 *
 * The gate is a nudge, not a security boundary — gated page content is present
 * in the DOM underneath, exactly as documented in the design spec.
 */
export default function InstallGate({
  userAgent,
  children,
}: {
  userAgent: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // First render (server *and* client) must agree, so it uses UA-only signals.
  // Anything the server cannot know — installed state, session bypass, whether
  // Chrome offered an install prompt — is folded in after mount.
  const ssrEnv = useMemo(
    () =>
      classifyEnvironment({
        userAgent,
        displayModeStandalone: false,
        navigatorStandalone: false,
        maxTouchPoints: 0,
      }),
    [userAgent]
  );

  const [clientEnv, setClientEnv] = useState<PwaEnvironment | null>(null);
  const [bypassed, setBypassed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const sync = () => {
      setClientEnv(readEnvironment());
      try {
        setBypassed(sessionStorage.getItem(BYPASS_KEY) === "1");
      } catch {
        // Private browsing can throw on sessionStorage access. Failing to read
        // a bypass just means we ask again — never a lockout.
        setBypassed(false);
      }
    };
    sync();

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      sync();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Catches the moment an Android user completes the install without a
    // reload, so the gate dissolves on its own.
    const standalone = window.matchMedia?.("(display-mode: standalone)");
    standalone?.addEventListener("change", sync);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      standalone?.removeEventListener("change", sync);
    };
  }, []);

  const verdict = resolveGateState({
    env: clientEnv ?? ssrEnv,
    pathname: pathname ?? "",
    bypassed,
    canPromptInstall: installPrompt !== null,
  });

  const dismiss = () => {
    try {
      sessionStorage.setItem(BYPASS_KEY, "1");
    } catch {
      // Nothing to persist to; the bypass simply lasts for this render.
    }
    setBypassed(true);
    document.documentElement.dataset.pwaBypass = "1";
  };

  const install = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      // A prompt can only be fired once; if it's already spent, fall through
      // and let the display-mode listener settle the outcome.
    } finally {
      setInstallPrompt(null);
    }
  };

  return (
    <>
      {children}
      {verdict.kind === "install" && (
        <InstallScreen
          mode={verdict.mode}
          onInstall={verdict.mode === "android-prompt" ? install : undefined}
          onDismiss={dismiss}
        />
      )}
    </>
  );
}
