"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";

export default function SignOutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        setIsLoggingOut(false);

        // Redirect to auth page after a brief delay
        setTimeout(() => {
          router.push("/auth");
        }, 2000);
      } catch (error) {
        console.error("Logout error:", error);
        setError("Failed to sign out. Please try again.");
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [logout, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto"
        >
          {isLoggingOut ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-6"
              />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Signing Out...
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Goodbye, {user?.name || user?.username}! We&apos;re signing you
                out securely.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-red-500 rounded-full"
                  />
                  <span>Ending your session</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                    className="w-2 h-2 bg-orange-500 rounded-full"
                  />
                  <span>Clearing local data</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                    className="w-2 h-2 bg-yellow-500 rounded-full"
                  />
                  <span>Redirecting to login</span>
                </div>
              </div>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Sign Out Error
              </h1>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/auth")}
                  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0, type: "spring" }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <span className="text-2xl">✅</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="text-2xl font-bold text-gray-800 dark:text-white mb-4"
              >
                Successfully Signed Out
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="text-gray-600 dark:text-gray-300 mb-6"
              >
                You have been securely signed out of your SafeMeds account.
                Redirecting you to the login page...
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0 }}
                className="flex items-center justify-center gap-2 text-sm text-gray-500"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
                <span>Redirecting in 2 seconds...</span>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
