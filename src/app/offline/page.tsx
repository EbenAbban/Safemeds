import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "You're offline — SafeMeds",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-6 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md dark:bg-gray-800">
          <WifiOff className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">You&apos;re offline</h1>

        <p className="mb-8 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
          SafeMeds needs a connection to reach your pharmacist. Your consultations and messages are safe — they&apos;ll
          be here when you reconnect.
        </p>

        <Link
          href="/"
          className="inline-block rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Try again
        </Link>

        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          In an emergency, call your local emergency number directly.
        </p>
      </div>
    </div>
  );
}
