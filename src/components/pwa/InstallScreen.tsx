"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Share, Plus, MoreVertical, Copy, Check, Lock, Zap, WifiOff } from "lucide-react";
import type { InstallMode } from "@/lib/pwa/resolve-gate-state";

interface InstallScreenProps {
  mode: InstallMode;
  /** Fires the captured beforeinstallprompt. Only provided in "android-prompt" mode. */
  onInstall?: () => void;
  onDismiss: () => void;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed dark:bg-primary-container dark:text-on-primary-container">
        {n}
      </span>
      <span className="text-sm text-on-surface-variant">{children}</span>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full space-y-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest/70 p-4 text-left dark:bg-surface-container/60">
      {children}
    </div>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied outright in some webviews. The link is
      // already visible in the address bar, so there's nothing to recover.
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-outline-variant px-6 py-3.5 font-semibold text-on-surface transition-colors hover:border-soft-aqua"
    >
      {copied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}

const BENEFITS = [
  { Icon: Lock, label: "Stays private — no browser history or open tabs" },
  { Icon: Zap, label: "Opens instantly, even on weak campus wifi" },
  { Icon: WifiOff, label: "Keeps working when your connection drops" },
];

export default function InstallScreen({ mode, onInstall, onDismiss }: InstallScreenProps) {
  const isWebview = mode === "webview";

  // data-pwa-install-overlay lets the pre-paint script in <head> hide this via
  // CSS before React hydrates, so installed users never glimpse it.
  return (
    <div
      data-pwa-install-overlay
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-10 text-center"
      >
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={72}
          height={72}
          className="mb-5 rounded-[22%] shadow-lg"
          priority
        />

        <h1 className="mb-2 text-2xl font-bold text-on-surface">
          {isWebview ? "Open SafeMeds in your browser" : "Install SafeMeds"}
        </h1>

        <p className="mb-7 text-[15px] leading-relaxed text-on-surface-variant">
          {isWebview
            ? "You're viewing this inside another app, which can't install SafeMeds. Open it in Safari or Chrome to continue."
            : "Add SafeMeds to your home screen to start your confidential consultation."}
        </p>

        {mode === "ios-instructions" && (
          <Panel>
            <Step n={1}>
              Tap <Share className="mx-0.5 inline h-4 w-4 -translate-y-0.5 text-medical-teal dark:text-primary-fixed-dim" />{" "}
              <strong>Share</strong> in the toolbar below
            </Step>
            <Step n={2}>
              Choose <Plus className="mx-0.5 inline h-4 w-4 -translate-y-0.5" /> <strong>Add to Home Screen</strong>
            </Step>
            <Step n={3}>
              Open SafeMeds from your home screen
            </Step>
          </Panel>
        )}

        {mode === "generic-instructions" && (
          <Panel>
            <Step n={1}>
              Open your browser menu <MoreVertical className="mx-0.5 inline h-4 w-4 -translate-y-0.5" />
            </Step>
            <Step n={2}>
              Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>
            </Step>
            <Step n={3}>Open SafeMeds from your home screen</Step>
          </Panel>
        )}

        {mode === "android-prompt" && (
          <div className="w-full space-y-4">
            <ul className="space-y-2.5 text-left">
              {BENEFITS.map(({ Icon, label }) => (
                <li key={label} className="flex items-start gap-3 text-sm text-on-surface-variant">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-medical-teal dark:text-primary-fixed-dim" />
                  {label}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onInstall}
              className="w-full rounded-xl bg-medical-teal px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-secondary hover:shadow-card"
            >
              Install app
            </button>
          </div>
        )}

        {isWebview && (
          <div className="w-full space-y-3">
            <Panel>
              <Step n={1}>
                Tap the <strong>menu</strong> in the corner of this window
              </Step>
              <Step n={2}>
                Choose <strong>Open in browser</strong>
              </Step>
            </Panel>
            <CopyLinkButton />
          </div>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-8 text-sm text-outline underline underline-offset-4 transition-colors hover:text-on-surface-variant"
        >
          Continue in browser
        </button>
      </motion.div>
    </div>
  );
}
