"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";

export default function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["CLIENT"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        {/* Navigation */}
        <Navigation title="Client Dashboard" userRole="client" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-blue-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Account Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Name:
                    </span>
                    <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">
                      {user?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Email:
                    </span>
                    <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">
                      {user?.email || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Username:
                    </span>
                    <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">
                      {user?.username || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Role:
                    </span>
                    <span className="ml-2 font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {user?.role || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Client Account</div>
              </div>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Chat with Pharmacist
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Get instant consultation and medication advice from licensed
                pharmacists.
              </p>
              <button
                onClick={() => router.push("/chat")}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Start Chat
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Track Deliveries
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Monitor your medication deliveries in real-time with live
                tracking.
              </p>
              <button
                onClick={() => router.push("/delivery")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                View Deliveries
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Consultations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Schedule and manage your healthcare consultations with
                specialists.
              </p>
              <button
                onClick={() => router.push("/consult")}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                Book Consultation
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Configure your account settings and preferences.
              </p>
              <button
                onClick={() => router.push("/settings")}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                Open Settings
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
