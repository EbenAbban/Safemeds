"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const steps = [
  {
    icon: "👋",
    title: "Welcome to SafeMeds!",
    description: "Your secure telepharmacy platform. Let's take a quick tour of what you can do."
  },
  {
    icon: "💬",
    title: "Consult a Pharmacist",
    description: "Start an anonymous consultation anytime. Licensed pharmacists are available to help with your health concerns.",
    action: "/consult"
  },
  {
    icon: "📋",
    title: "Track Your Orders",
    description: "Get prescriptions delivered to your location. Track the delivery in real time on the map.",
    action: "/delivery"
  },
  {
    icon: "📊",
    title: "Manage Your Health",
    description: "View your consultation history, medications, and health analytics from your dashboard.",
    action: "/client-dashboard"
  }
];

export default function OnboardingWizard() {
  const { showOnboarding, dismissOnboarding } = useOnboarding();
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);

  if (!showOnboarding) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">{current.icon}</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {current.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {!isLast && (
              <button
                onClick={dismissOnboarding}
                className="flex-1 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  dismissOnboarding();
                } else {
                  const next = steps[step + 1];
                  if (next.action) router.push(next.action);
                  setStep(step + 1);
                }
              }}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {isLast ? "Get Started" : "Next"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
