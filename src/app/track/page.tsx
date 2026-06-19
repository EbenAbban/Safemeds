"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Navigation from "@/components/Common/Navigation";
import { getAnonymousConsultationStatus } from "@/services/consultationService";

function TrackConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState(searchParams.get("sessionId") || "");
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = useCallback(async () => {
    if (!sessionId.trim()) {
      setError("Please enter a session ID");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await getAnonymousConsultationStatus(sessionId);
      if (response) {
        setConsultation(response.consultation);
      } else {
        setError("Session not found or has expired");
      }
    } catch (error) {
      console.error("Error tracking consultation:", error);
      setError("Failed to track consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      handleTrack();
    }
  }, [sessionId, handleTrack]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return "⏳";
      case "IN_PROGRESS":
        return "👨‍⚕️";
      case "COMPLETED":
        return "✅";
      case "CANCELLED":
        return "❌";
      default:
        return "📋";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation title="Track Consultation" userRole="client" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Track Your Consultation
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Enter your session ID to check the status of your anonymous consultation
            </p>
          </div>

          {/* Session ID Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session ID
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your session ID..."
              />
              <button
                onClick={handleTrack}
                disabled={loading || !sessionId.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Tracking..." : "Track"}
              </button>
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Consultation Status */}
          {consultation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status Card */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{getStatusIcon(consultation.status)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Consultation Status
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last updated: {formatDate(consultation.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(consultation.status)}`}>
                    {consultation.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100 capitalize">{consultation.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{formatDate(consultation.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Consultation Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{consultation.description}</p>
                  </div>
                  
                  {consultation.symptoms && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms</label>
                      <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{consultation.symptoms}</p>
                    </div>
                  )}
                  
                  {consultation.medications && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Medications</label>
                      <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{consultation.medications}</p>
                    </div>
                  )}
                  
                  {consultation.allergies && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allergies</label>
                      <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{consultation.allergies}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              {consultation.messages && consultation.messages.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Messages</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {consultation.messages.map((message: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          message.isFromPharmacist
                            ? "bg-blue-50 border-l-4 border-blue-500"
                            : "bg-gray-50 border-l-4 border-gray-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {message.isFromPharmacist ? "Pharmacist" : "You"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-900 dark:text-gray-100">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prescriptions</h4>
                  <div className="space-y-4">
                    {consultation.prescriptions.map((prescription: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {prescription.medication.name}
                          </h5>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prescription.status)}`}>
                            {prescription.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Dosage:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100">{prescription.dosage}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Frequency:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100">{prescription.frequency}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Quantity:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100">{prescription.quantity}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100">{prescription.duration}</span>
                          </div>
                        </div>
                        {prescription.instructions && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Instructions:</span>
                            <p className="text-gray-900 dark:text-gray-100 mt-1">{prescription.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push(`/chat/${consultation.id}?anonymousId=${consultation.anonymousId}`)}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Chat with Pharmacist
                </button>
                <button
                  onClick={() => router.push("/consult")}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  New Consultation
                </button>
              </div>
            </motion.div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Need Help?</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Your session ID was provided when you submitted your consultation</li>
              <li>• If you've lost your session ID, you'll need to submit a new consultation</li>
              <li>• For emergencies, please contact emergency services immediately</li>
              <li>• Sessions expire after 7 days for security reasons</li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 

export default function TrackConsultationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800" /> }>
      <TrackConsultationContent />
    </Suspense>
  );
}