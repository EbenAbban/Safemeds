import { describe, it, expect } from "vitest";
import { resolveGateState } from "@/lib/pwa/resolve-gate-state";
import type { PwaEnvironment } from "@/lib/pwa/environment";

const mobileBrowser: PwaEnvironment = {
  isMobile: true,
  isStandalone: false,
  isIOS: true,
  isAndroid: false,
  isInAppWebview: false,
  isBot: false,
};

const resolve = (env: Partial<PwaEnvironment>, overrides: { pathname?: string; bypassed?: boolean; canPromptInstall?: boolean } = {}) =>
  resolveGateState({
    env: { ...mobileBrowser, ...env },
    pathname: overrides.pathname ?? "/consult",
    bypassed: overrides.bypassed ?? false,
    canPromptInstall: overrides.canPromptInstall ?? false,
  });

describe("resolveGateState", () => {
  // Rules are ordered; each of these asserts the rule wins over everything below it.
  describe("allow rules, in priority order", () => {
    it("1. lets crawlers through even on a gated route with a phone UA", () => {
      expect(resolve({ isBot: true })).toEqual({ kind: "allow" });
    });

    it("2. lets any ungated route through", () => {
      expect(resolve({}, { pathname: "/about" })).toEqual({ kind: "allow" });
    });

    it("3. lets the installed app through", () => {
      expect(resolve({ isStandalone: true })).toEqual({ kind: "allow" });
    });

    it("4. never gates desktop", () => {
      expect(resolve({ isMobile: false, isIOS: false })).toEqual({ kind: "allow" });
    });

    it("5. honours a session bypass", () => {
      expect(resolve({}, { bypassed: true })).toEqual({ kind: "allow" });
    });
  });

  describe("install screen modes", () => {
    it("6. shows webview mode inside an in-app browser", () => {
      expect(resolve({ isInAppWebview: true })).toEqual({ kind: "install", mode: "webview" });
    });

    it("webview mode wins over an available install prompt", () => {
      expect(resolve({ isInAppWebview: true }, { canPromptInstall: true })).toEqual({
        kind: "install",
        mode: "webview",
      });
    });

    it("7. shows the native prompt when Chrome offered one", () => {
      expect(resolve({ isIOS: false, isAndroid: true }, { canPromptInstall: true })).toEqual({
        kind: "install",
        mode: "android-prompt",
      });
    });

    it("8. shows iOS instructions on iOS Safari", () => {
      expect(resolve({})).toEqual({ kind: "install", mode: "ios-instructions" });
    });

    it("8. shows generic instructions on Android without the prompt event", () => {
      expect(resolve({ isIOS: false, isAndroid: true })).toEqual({
        kind: "install",
        mode: "generic-instructions",
      });
    });
  });

  describe("gating applies to every declared route", () => {
    it.each(["/auth", "/signin", "/signup", "/consult", "/client-dashboard", "/pharmacy-dashboard", "/admin"])(
      "gates %s",
      (pathname) => {
        expect(resolve({}, { pathname }).kind).toBe("install");
      }
    );
  });

  // A healthcare product must never trap a user out of care because our
  // detection got confused. Anything ambiguous renders the page.
  describe("fail open", () => {
    it("allows through when the environment is unknown", () => {
      expect(resolveGateState({ env: null, pathname: "/consult", bypassed: false, canPromptInstall: false })).toEqual({
        kind: "allow",
      });
    });

    it("allows through when the pathname is missing", () => {
      expect(resolve({}, { pathname: "" })).toEqual({ kind: "allow" });
    });
  });
});
