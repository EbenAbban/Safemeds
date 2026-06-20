"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import { Shield, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

export default function VerifyLicensePage() {
  const { user } = useAuth();
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "verified" | "rejected">("idle");
  const [error, setError] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const checkVerification = async () => {
      try {
        const res = await fetch(`/api/auth/profile?userId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user) {
          setLicenseNumber(data.user.licenseNumber || "");
        }
      } catch {
        // silent
      } finally {
        setCheckingStatus(false);
      }
    };
    checkVerification();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!licenseNumber.trim() || !licenseType.trim() || !issuingBody.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseNumber: licenseNumber.trim(),
          state: issuingBody,
          email: user?.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setLoading(false);
        return;
      }

      // Submit license verification request for admin approval
      const verifyRes = await fetch("/api/admin/license-verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          licenseNumber: licenseNumber.trim(),
          licenseType: licenseType.trim(),
          issuingBody: issuingBody.trim(),
        }),
      });

      if (verifyRes.ok) {
        setStatus("pending");
      } else {
        setError("License verified but could not submit for admin review");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["PHARMACY"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation title="License Verification" userRole="pharmacy" />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Pharmacist License Verification
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Submit your pharmacy license for verification by our admin team.
            </p>
          </motion.div>

          {status === "pending" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                  Verification Pending
                </h2>
              </div>
              <p className="text-amber-700 dark:text-amber-400 text-sm">
                Your license has been submitted for review. An admin will review
                your credentials shortly. You will be notified once the
                verification is complete.
              </p>
            </motion.div>
          )}

          {status === "verified" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">
                  Verified
                </h2>
              </div>
              <p className="text-green-700 dark:text-green-400 text-sm">
                Your pharmacy license has been verified. You can now provide
                consultations on the platform.
              </p>
            </motion.div>
          )}

          {status === "rejected" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
                  Verification Rejected
                </h2>
              </div>
              <p className="text-red-700 dark:text-red-400 text-sm">
                Your license verification was not approved. Please contact
                support for more information.
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter your pharmacy license number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Type *
                </label>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select license type</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="PHARMACY_TECH">Pharmacy Technician</option>
                  <option value="CONSULTANT">Consultant Pharmacist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Issuing Body / State *
                </label>
                <input
                  type="text"
                  value={issuingBody}
                  onChange={(e) => setIssuingBody(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. Pharmacy Council of Ghana"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Submit for Verification
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
