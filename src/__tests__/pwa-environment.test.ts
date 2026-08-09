import { describe, it, expect } from "vitest";
import { classifyEnvironment } from "@/lib/pwa/environment";

const UA = {
  iosSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
  instagramIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 302.0.0.23.113 (iPhone14,3; iOS 17_0)",
  facebookAndroid:
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 [FBAN/FB4A;FBAV/440.0.0.30.117;]",
  whatsapp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.23.20.79",
  // Google's smartphone crawler. Note it contains both "Android" and
  // "Mobile" — the bot check has to win, or we hide /consult from search.
  googlebotSmartphone:
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  bingbot:
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  desktopChrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  // iPadOS 13+ reports a desktop Macintosh UA; only maxTouchPoints betrays it.
  ipadOS:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
};

const base = { displayModeStandalone: false, navigatorStandalone: false, maxTouchPoints: 0 };

describe("classifyEnvironment", () => {
  it("classifies iOS Safari as mobile iOS", () => {
    const env = classifyEnvironment({ ...base, userAgent: UA.iosSafari });
    expect(env).toMatchObject({ isMobile: true, isIOS: true, isAndroid: false, isInAppWebview: false, isBot: false });
  });

  it("classifies Chrome on Android as mobile Android", () => {
    const env = classifyEnvironment({ ...base, userAgent: UA.androidChrome });
    expect(env).toMatchObject({ isMobile: true, isIOS: false, isAndroid: true, isInAppWebview: false, isBot: false });
  });

  it("classifies desktop Chrome as not mobile", () => {
    const env = classifyEnvironment({ ...base, userAgent: UA.desktopChrome });
    expect(env.isMobile).toBe(false);
  });

  it("detects iPadOS despite its desktop user agent", () => {
    const env = classifyEnvironment({ ...base, userAgent: UA.ipadOS, maxTouchPoints: 5 });
    expect(env).toMatchObject({ isMobile: true, isIOS: true });
  });

  it("does not mistake a real Mac for an iPad", () => {
    const env = classifyEnvironment({ ...base, userAgent: UA.ipadOS, maxTouchPoints: 0 });
    expect(env.isMobile).toBe(false);
  });

  describe("in-app webviews", () => {
    it.each([
      ["Instagram", UA.instagramIos],
      ["Facebook", UA.facebookAndroid],
      ["WhatsApp", UA.whatsapp],
    ])("detects the %s webview", (_name, userAgent) => {
      const env = classifyEnvironment({ ...base, userAgent });
      expect(env.isInAppWebview).toBe(true);
      expect(env.isMobile).toBe(true);
    });

    it("does not flag ordinary mobile browsers as webviews", () => {
      expect(classifyEnvironment({ ...base, userAgent: UA.iosSafari }).isInAppWebview).toBe(false);
      expect(classifyEnvironment({ ...base, userAgent: UA.androidChrome }).isInAppWebview).toBe(false);
    });
  });

  describe("crawlers", () => {
    it("detects Googlebot even though its UA looks like a phone", () => {
      const env = classifyEnvironment({ ...base, userAgent: UA.googlebotSmartphone });
      expect(env.isBot).toBe(true);
    });

    it("detects bingbot", () => {
      expect(classifyEnvironment({ ...base, userAgent: UA.bingbot }).isBot).toBe(true);
    });

    it("does not flag real users as bots", () => {
      expect(classifyEnvironment({ ...base, userAgent: UA.iosSafari }).isBot).toBe(false);
      expect(classifyEnvironment({ ...base, userAgent: UA.androidChrome }).isBot).toBe(false);
    });
  });

  describe("installed detection", () => {
    it("treats display-mode standalone as installed", () => {
      const env = classifyEnvironment({ ...base, userAgent: UA.androidChrome, displayModeStandalone: true });
      expect(env.isStandalone).toBe(true);
    });

    it("treats iOS navigator.standalone as installed", () => {
      const env = classifyEnvironment({ ...base, userAgent: UA.iosSafari, navigatorStandalone: true });
      expect(env.isStandalone).toBe(true);
    });

    it("is not standalone in a plain browser tab", () => {
      expect(classifyEnvironment({ ...base, userAgent: UA.iosSafari }).isStandalone).toBe(false);
    });
  });

  it("fails open on a missing user agent rather than gating a mystery client", () => {
    const env = classifyEnvironment({ ...base, userAgent: "" });
    expect(env.isMobile).toBe(false);
  });
});
