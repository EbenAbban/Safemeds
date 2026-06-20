"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navigation from "@/components/Common/Navigation";
import { createAnonymousConsultation } from "@/services/consultationService";

export default function AnonymousConsultationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    symptoms: "",
    medications: "",
    allergies: "",
    age: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await createAnonymousConsultation({
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        isAnonymous: true,
      });

      if (response) {
        setSessionId(response.sessionId);
        setStep(2);
      }
    } catch (error) {
      console.error("Error creating consultation:", error);
      alert("Failed to submit consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation title="Anonymous Consultation" userRole="client" />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Consultation Submitted Successfully!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your anonymous consultation has been submitted. A licensed pharmacist will review your inquiry and respond within 24 hours.
            </p>
            
            <div className="bg-purple-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">
                Your Session ID
              </h3>
              <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                <code className="text-lg font-mono text-purple-800 break-all">
                  {sessionId}
                </code>
              </div>
              <p className="text-sm text-purple-700 mt-3">
                Save this ID to track your consultation status and access your chat with the pharmacist.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push(`/track?sessionId=${sessionId}`)}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Track My Consultation
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Return to Home
              </button>
            </div>

            <div className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Your consultation is completely anonymous</li>
                <li>• A licensed pharmacist will review your inquiry</li>
                <li>• You can track your consultation using the session ID above</li>
                <li>• For emergencies, please contact emergency services immediately</li>
              </ul>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation title="Anonymous Consultation" userRole="client" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Anonymous Health Consultation
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Submit your health inquiry anonymously. A licensed pharmacist will review and respond to your concerns.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Consultation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Consultation Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: "general", label: "General Health", icon: "🏥" },
                  { value: "mental health", label: "Mental Health", icon: "🧠" },
                  { value: "pain relief", label: "Pain Relief", icon: "💊" },
                  { value: "pregnancy", label: "Pregnancy", icon: "🤱" },
                  { value: "sexual health", label: "Sexual Health", icon: "❤️" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.type === type.value
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 dark:border-gray-600 hover:border-purple-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe your health concern *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Please describe your symptoms, concerns, or questions in detail..."
                required
              />
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Symptoms
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="List any symptoms you're experiencing..."
              />
            </div>

            {/* Current Medications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Medications
              </label>
              <textarea
                name="medications"
                value={formData.medications}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="List any medications you're currently taking..."
              />
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Known Allergies
              </label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="List any known allergies to medications or substances..."
              />
            </div>

            {/* Age and Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="13"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Privacy & Security</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your consultation is completely anonymous</li>
                <li>• No personal information is required</li>
                <li>• All data is encrypted and secure</li>
                <li>• For emergencies, contact emergency services immediately</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.type || !formData.description}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                "Submit Consultation"
              )}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
} 