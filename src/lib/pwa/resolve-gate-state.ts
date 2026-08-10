import type { PwaEnvironment } from "./environment";
import { matchesGatedRoute } from "./gated-routes";

export type InstallMode =
  /** In-app browser (Instagram, Facebook…) — cannot install; tell them to open in Safari/Chrome. */
  | "webview"
  /** Chrome captured a beforeinstallprompt event; we can offer a real one-tap install. */
  | "android-prompt"
  /** iOS Safari — no programmatic install exists; show the Share sheet steps. */
  | "ios-instructions"
  /** Anything else mobile — generic browser-menu instructions. */
  | "generic-instructions";

export type GateVerdict = { kind: "allow" } | { kind: "install"; mode: InstallMode };

export interface GateInput {
  env: PwaEnvironment | null;
  pathname: string;
  bypassed: boolean;
  canPromptInstall: boolean;
}

const ALLOW: GateVerdict = { kind: "allow" };

/**
 * Decides whether to show the install screen. Rules are ordered; the first
 * match wins.
 *
 * Every uncertain case resolves to "allow". This is a healthcare product: a bug
 * that traps a student out of a consultation is far worse than one that lets
 * them use the mobile web site. The gate is a nudge, never a security boundary.
 */
export function resolveGateState({ env, pathname, bypassed, canPromptInstall }: GateInput): GateVerdict {
  try {
    if (!env) return ALLOW;
    if (env.isBot) return ALLOW;
    if (!pathname || !matchesGatedRoute(pathname)) return ALLOW;
    if (env.isStandalone) return ALLOW;
    if (!env.isMobile) return ALLOW;
    if (bypassed) return ALLOW;

    if (env.isInAppWebview) return { kind: "install", mode: "webview" };
    if (canPromptInstall) return { kind: "install", mode: "android-prompt" };
    if (env.isIOS) return { kind: "install", mode: "ios-instructions" };
    return { kind: "install", mode: "generic-instructions" };
  } catch {
    return ALLOW;
  }
}
