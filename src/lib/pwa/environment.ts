// Classification of the visitor's browsing context, used to decide whether to
// show the install gate. Kept as a pure function over plain signals so it can
// be tested without a DOM.

export interface PwaEnvironment {
  isMobile: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isInAppWebview: boolean;
  isBot: boolean;
}

export interface EnvironmentSignals {
  userAgent: string;
  /** window.matchMedia("(display-mode: standalone)").matches */
  displayModeStandalone: boolean;
  /** iOS-only legacy flag, still the only reliable signal in older Safari. */
  navigatorStandalone: boolean;
  /** iPadOS 13+ reports a desktop UA; touch points are what give it away. */
  maxTouchPoints: number;
}

// Googlebot's smartphone crawler sends a UA containing both "Android" and
// "Mobile". If it were gated, /consult and /signup would vanish from search.
const BOT_PATTERN =
  /bot\b|googlebot|bingbot|duckduckbot|baiduspider|yandex|slurp|crawler|spider|facebookexternalhit|lighthouse|headlesschrome/i;

// Links opened from social apps land in an embedded webview that has no
// "Add to Home Screen" affordance at all, so these get different instructions.
const WEBVIEW_PATTERN =
  /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Twitter|TikTok|musical_ly|BytedanceWebview|Snapchat|LinkedInApp|Pinterest/i;

export function classifyEnvironment(signals: EnvironmentSignals): PwaEnvironment {
  const ua = signals.userAgent ?? "";

  const isBot = BOT_PATTERN.test(ua);

  // iPadOS 13+ masquerades as macOS; a Mac with a touchscreen doesn't exist,
  // so multiple touch points on a Macintosh UA means it's really an iPad.
  const isIpadOS = /Macintosh/i.test(ua) && signals.maxTouchPoints > 1;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || isIpadOS;
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobile|Windows Phone/i.test(ua);

  return {
    isBot,
    isIOS,
    isAndroid,
    isMobile,
    isInAppWebview: WEBVIEW_PATTERN.test(ua),
    isStandalone: signals.displayModeStandalone || signals.navigatorStandalone,
  };
}

/**
 * Reads the live browser signals. Returns null when unavailable (server render,
 * or a browser that throws on any of these) — callers treat null as "allow",
 * so a detection failure can never lock someone out.
 */
export function readEnvironment(): PwaEnvironment | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") return null;

  try {
    return classifyEnvironment({
      userAgent: navigator.userAgent ?? "",
      displayModeStandalone: window.matchMedia?.("(display-mode: standalone)")?.matches ?? false,
      navigatorStandalone: (navigator as Navigator & { standalone?: boolean }).standalone === true,
      maxTouchPoints: navigator.maxTouchPoints ?? 0,
    });
  } catch {
    return null;
  }
}
