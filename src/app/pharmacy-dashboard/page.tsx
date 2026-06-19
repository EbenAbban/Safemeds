"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import IncomingCallListener from "@/components/Chat/IncomingCallListener";

export default function PharmacyDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["PHARMACY"]}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        {/* Listens for incoming student video consultation calls */}
        <IncomingCallListener />

        {/* Navigation */}
        <Navigation title="Pharmacy Dashboard" userRole="pharmacy" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-purple-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Pharmacy Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Pharmacist:</span>
                    <span className="ml-2 font-medium">
                      {user?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="ml-2 font-medium">
                      {user?.email || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Username:</span>
                    <span className="ml-2 font-medium">
                      {user?.username || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Role:</span>
                    <span className="ml-2 font-medium capitalize">
                      {user?.role || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl mb-2">💊</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pharmacy Account</div>
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-purple-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Patient Consultations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Provide medication advice and consultations to patients.
              </p>
              <button
                onClick={() => router.push("/inbox")}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                View Patient Chats
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-purple-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">💊</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Medication Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Manage inventory, prescriptions, and medication orders.
              </p>
              <button
                onClick={() => router.push("/medications")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Manage Medications
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-purple-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Order Processing
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Process and track medication orders and deliveries.
              </p>
              <button
                onClick={() => router.push("/orders")}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Process Orders
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-purple-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Pharmacy Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                View detailed analytics about prescriptions and sales.
              </p>
              <button
                onClick={() => router.push("/analytics")}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                View Analytics
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-purple-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Staff Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Manage pharmacy staff and their schedules.
              </p>
              <button
                onClick={() => router.push("/staff")}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
              >
                Manage Staff
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-purple-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Configure pharmacy settings and preferences.
              </p>
              <button
                onClick={() => router.push("/settings")}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                Open Settings
              </button>
            </motion.div>
          </div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔒</div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Security Notice
                </h3>
                <p className="text-yellow-700 text-sm">
                  This dashboard contains sensitive healthcare information.
                  Please ensure you log out when finished and never share your
                  credentials. All activities are logged for security purposes.
                </p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
