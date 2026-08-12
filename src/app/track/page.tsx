"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Navigation from "@/components/Common/Navigation";
import { getAnonymousConsultationStatus } from "@/services/consultationService";

interface TrackedMessage {
  content: string;
  createdAt: string;
  isFromPharmacist: boolean;
}

interface TrackedPrescription {
  dosage: string;
  duration: string;
  frequency: string;
  quantity: number;
  status: string;
  instructions?: string;
  medication: { name: string };
}

interface TrackedConsultation {
  id: string;
  type: string;
  status: string;
  description?: string;
  symptoms?: string;
  allergies?: string;
  medications?: string;
  anonymousId?: string;
  createdAt: string;
  updatedAt: string;
  messages: TrackedMessage[];
  prescriptions: TrackedPrescription[];
}

function TrackConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState(searchParams.get("sessionId") || "");
  const [consultation, setConsultation] = useState<TrackedConsultation | null>(null);
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
        setConsultation(response.consultation as TrackedConsultation);
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
        return "bg-primary-fixed text-on-primary-fixed";
      case "COMPLETED":
        return "bg-secondary-container text-on-secondary-container";
      case "CANCELLED":
        return "bg-error-container text-on-error-container";
      default:
        return "bg-surface-container-low text-on-surface";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return "⏳";
      case "IN_PROGRESS":
        return "‍️";
      case "COMPLETED":
        return "";
      case "CANCELLED":
        return "";
      default:
        return "";
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
    <div className="min-h-screen bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high">
      <Navigation title="Track Consultation" userRole="client" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4"></div>
            <h1 className="text-3xl font-bold text-on-surface mb-2">
              Track Your Consultation
            </h1>
            <p className="text-lg text-on-surface-variant">
              Enter your session ID to check the status of your anonymous consultation
            </p>
          </div>

          {/* Session ID Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Session ID
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="flex-1 px-3 py-2 border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-high text-on-surface rounded-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent"
                placeholder="Enter your session ID..."
              />
              <button
                onClick={handleTrack}
                disabled={loading || !sessionId.trim()}
                className="bg-medical-teal text-white px-6 py-2 rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Tracking..." : "Track"}
              </button>
            </div>
            {error && (
              <p className="text-error text-sm mt-2">{error}</p>
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
              <div className="bg-surface dark:bg-surface-container-high/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{getStatusIcon(consultation.status)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-on-surface">
                        Consultation Status
                      </h3>
                      <p className="text-sm text-on-surface-variant">
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
                    <span className="font-medium text-on-surface-variant">Type:</span>
                    <span className="ml-2 text-on-surface dark:text-on-surface capitalize">{consultation.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-on-surface-variant">Created:</span>
                    <span className="ml-2 text-on-surface dark:text-on-surface">{formatDate(consultation.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/60 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-on-surface mb-4">Consultation Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Description</label>
                    <p className="text-on-surface dark:text-on-surface bg-surface dark:bg-surface-container-high/50 rounded-lg p-3">{consultation.description}</p>
                  </div>
                  
                  {consultation.symptoms && (
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-1">Symptoms</label>
                      <p className="text-on-surface dark:text-on-surface bg-surface dark:bg-surface-container-high/50 rounded-lg p-3">{consultation.symptoms}</p>
                    </div>
                  )}
                  
                  {consultation.medications && (
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-1">Current Medications</label>
                      <p className="text-on-surface dark:text-on-surface bg-surface dark:bg-surface-container-high/50 rounded-lg p-3">{consultation.medications}</p>
                    </div>
                  )}
                  
                  {consultation.allergies && (
                    <div>
                      <label className="block text-sm font-medium text-on-surface-variant mb-1">Allergies</label>
                      <p className="text-on-surface dark:text-on-surface bg-surface dark:bg-surface-container-high/50 rounded-lg p-3">{consultation.allergies}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              {consultation.messages && consultation.messages.length > 0 && (
                <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/60 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-on-surface mb-4">Messages</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {consultation.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          message.isFromPharmacist
                            ? "bg-primary-fixed/30 border-l-4 border-soft-aqua"
                            : "bg-surface border-l-4 border-gray-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-on-surface-variant">
                            {message.isFromPharmacist ? "Pharmacist" : "You"}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-on-surface dark:text-on-surface">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/60 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-on-surface mb-4">Prescriptions</h4>
                  <div className="space-y-4">
                    {consultation.prescriptions.map((prescription, index) => (
                      <div key={index} className="border border-outline-variant/60 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-on-surface">
                            {prescription.medication.name}
                          </h5>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prescription.status)}`}>
                            {prescription.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-on-surface-variant">Dosage:</span>
                            <span className="ml-2 text-on-surface dark:text-on-surface">{prescription.dosage}</span>
                          </div>
                          <div>
                            <span className="font-medium text-on-surface-variant">Frequency:</span>
                            <span className="ml-2 text-on-surface dark:text-on-surface">{prescription.frequency}</span>
                          </div>
                          <div>
                            <span className="font-medium text-on-surface-variant">Quantity:</span>
                            <span className="ml-2 text-on-surface dark:text-on-surface">{prescription.quantity}</span>
                          </div>
                          <div>
                            <span className="font-medium text-on-surface-variant">Duration:</span>
                            <span className="ml-2 text-on-surface dark:text-on-surface">{prescription.duration}</span>
                          </div>
                        </div>
                        {prescription.instructions && (
                          <div className="mt-3">
                            <span className="font-medium text-on-surface-variant">Instructions:</span>
                            <p className="text-on-surface dark:text-on-surface mt-1">{prescription.instructions}</p>
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
                  className="flex-1 bg-medical-teal text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary transition-colors"
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
              <li>• If you&apos;ve lost your session ID, you&apos;ll need to submit a new consultation</li>
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
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high" /> }>
      <TrackConsultationContent />
    </Suspense>
  );
}