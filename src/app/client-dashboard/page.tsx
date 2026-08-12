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
      <div className="min-h-screen bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high">
        {/* Navigation */}
        <Navigation title="Client Dashboard" userRole="client" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-lg p-6 mb-8 border border-primary-fixed dark:border-outline-variant/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-on-surface mb-2">
                  Account Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-on-surface-variant">
                      Name:
                    </span>
                    <span className="ml-2 font-medium text-on-surface-variant">
                      {user?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">
                      Email:
                    </span>
                    <span className="ml-2 font-medium text-on-surface-variant">
                      {user?.email || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">
                      Username:
                    </span>
                    <span className="ml-2 font-medium text-on-surface-variant">
                      {user?.username || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">
                      Role:
                    </span>
                    <span className="ml-2 font-medium text-on-surface-variant capitalize">
                      {user?.role || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl mb-2"></div>
                <div className="text-sm text-on-surface-variant">Client Account</div>
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
              className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 border border-primary-fixed dark:border-outline-variant/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4"></div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">
                Chat with Pharmacist
              </h3>
              <p className="text-on-surface-variant text-sm mb-4">
                Get instant consultation and medication advice from licensed
                pharmacists.
              </p>
              <button
                onClick={() => router.push("/chat")}
                className="bg-soft-aqua text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-medical-teal transition-colors"
              >
                Start Chat
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 border border-primary-fixed dark:border-outline-variant/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4"></div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">
                Track Deliveries
              </h3>
              <p className="text-on-surface-variant text-sm mb-4">
                Monitor your medication deliveries in real-time with live
                tracking.
              </p>
              <button
                onClick={() => router.push("/delivery")}
                className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                View Deliveries
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 border border-primary-fixed dark:border-outline-variant/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4"></div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">
                Consultations
              </h3>
              <p className="text-on-surface-variant text-sm mb-4">
                Schedule and manage your healthcare consultations with
                specialists.
              </p>
              <button
                onClick={() => router.push("/consult")}
                className="bg-tertiary-fixed/400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-tertiary transition-colors"
              >
                Book Consultation
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 border border-primary-fixed dark:border-outline-variant/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="text-3xl mb-4">️</div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">
                Settings
              </h3>
              <p className="text-on-surface-variant text-sm mb-4">
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
