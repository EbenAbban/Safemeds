import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "You're offline — SafeMeds",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 px-6 dark:from-surface-dark dark:to-surface-container-high">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-lowest shadow-soft dark:bg-surface-container">
          <WifiOff className="h-8 w-8 text-medical-teal dark:text-primary-fixed-dim" />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-on-surface">You&apos;re offline</h1>

        <p className="mb-8 text-[15px] leading-relaxed text-on-surface-variant">
          SafeMeds needs a connection to reach your pharmacist. Your consultations and messages are safe — they&apos;ll
          be here when you reconnect.
        </p>

        <Link
          href="/"
          className="inline-block rounded-xl bg-medical-teal px-6 py-3.5 font-semibold text-white transition-colors hover:bg-secondary"
        >
          Try again
        </Link>

        <p className="mt-8 text-sm text-on-surface-variant">
          In an emergency, call your local emergency number directly.
        </p>
      </div>
    </div>
  );
}
