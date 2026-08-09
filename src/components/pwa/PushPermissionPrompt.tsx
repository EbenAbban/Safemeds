"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import {
  hasDeclinedPush,
  isPushSupported,
  rememberPushDecline,
  subscribeToPush,
} from "@/lib/pwa/push-client";
import { readEnvironment } from "@/lib/pwa/environment";

/**
 * Asks to enable reply notifications.
 *
 * Mount this at the moment the value is self-evident — right after a student
 * sends their first consultation message — never on page load. Browsers
 * penalise drive-by permission prompts, and the request must originate from a
 * user gesture, which is why the actual call happens in the button handler.
 *
 * Renders nothing when push is unsupported, already granted, already declined,
 * or (on iOS) when the app hasn't been installed — iOS only allows web push
 * for installed PWAs.
 */
export default function PushPermissionPrompt({ anonymousSessionId }: { anonymousSessionId?: string }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported() || hasDeclinedPush()) return;
    if (Notification.permission !== "default") return;

    const env = readEnvironment();
    if (env?.isIOS && !env.isStandalone) return;

    setVisible(true);
  }, []);

  const enable = async () => {
    setBusy(true);
    await subscribeToPush(anonymousSessionId);
    setBusy(false);
    setVisible(false);
  };

  const decline = () => {
    rememberPushDecline();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/15">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Get told when a pharmacist replies?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                We&apos;ll only say you have a new message — never what it&apos;s about.
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={enable}
                  disabled={busy}
                  className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {busy ? "Enabling…" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={decline}
                  className="rounded-lg px-3.5 py-2 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Not now
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={decline}
              aria-label="Dismiss"
              className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
