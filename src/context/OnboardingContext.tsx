"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingContextValue {
  showOnboarding: boolean;
  dismissOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const STORAGE_KEY = "safemeds_onboarding_done";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setShowOnboarding(true);
    }
  }, [isAuthenticated, isLoading]);

  const dismissOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowOnboarding(false);
  }, []);

  return (
    <OnboardingContext.Provider value={{ showOnboarding, dismissOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
