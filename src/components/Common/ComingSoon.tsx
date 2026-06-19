"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Placeholder for features that are scaffolded in navigation but not yet built.
// Keeps links functional (no 404) and tells the user the state honestly.
export default function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-700"
      >
        <div className="text-5xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {description || "This feature is on the roadmap and not built yet."}
        </p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          ← Go back
        </button>
      </motion.div>
    </div>
  );
}
