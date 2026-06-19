import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
  Analytics,
} from "firebase/analytics";
import { app } from "./firebase";

// Initialize Firebase Analytics (only in browser environment)
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics initialization failed:", error);
  }
}

// Analytics event tracking functions
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, unknown>
) => {
  if (!analytics) {
    console.warn("Analytics not available");
    return;
  }

  try {
    logEvent(analytics, eventName, parameters);
  } catch (error) {
    console.error("Failed to track analytics event:", error);
  }
};

export const setUserAnalytics = (
  userId: string,
  userProperties?: Record<string, unknown>
) => {
  if (!analytics) {
    console.warn("Analytics not available");
    return;
  }

  try {
    setUserId(analytics, userId);
    if (userProperties) {
      setUserProperties(analytics, userProperties);
    }
    // User analytics set
  } catch (error) {
    console.error("Failed to set user analytics:", error);
  }
};

// Predefined analytics events for SafeMeds
export const AnalyticsEvents = {
  // Authentication events
  USER_SIGN_UP: "user_sign_up",
  USER_SIGN_IN: "user_sign_in",
  USER_SIGN_OUT: "user_sign_out",
  USER_VERIFICATION: "user_verification",

  // Feature usage events
  CHAT_STARTED: "chat_started",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  DELIVERY_TRACKED: "delivery_tracked",
  CONSULTATION_BOOKED: "consultation_booked",

  // Navigation events
  PAGE_VIEW: "page_view",
  DASHBOARD_ACCESSED: "dashboard_accessed",
  FEATURE_ACCESSED: "feature_accessed",

  // Error events
  ERROR_OCCURRED: "error_occurred",
  NETWORK_ERROR: "network_error",
  AUTHENTICATION_ERROR: "authentication_error",

  // Performance events
  APP_LOAD_TIME: "app_load_time",
  FEATURE_LOAD_TIME: "feature_load_time",

  // Business events
  PHARMACY_REGISTRATION: "pharmacy_registration",
  CLIENT_REGISTRATION: "client_registration",
  MEDICATION_ORDERED: "medication_ordered",
  CONSULTATION_COMPLETED: "consultation_completed",
};

// Analytics helper functions
export const trackUserSignUp = (userRole: string, method: string = "email") => {
  trackEvent(AnalyticsEvents.USER_SIGN_UP, {
    user_role: userRole,
    signup_method: method,
    timestamp: new Date().toISOString(),
  });
};

export const trackUserSignIn = (userRole: string, method: string = "email") => {
  trackEvent(AnalyticsEvents.USER_SIGN_IN, {
    user_role: userRole,
    signin_method: method,
    timestamp: new Date().toISOString(),
  });
};

export const trackUserSignOut = (userRole: string) => {
  trackEvent(AnalyticsEvents.USER_SIGN_OUT, {
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackChatStarted = (
  userRole: string,
  chatType: string = "general"
) => {
  trackEvent(AnalyticsEvents.CHAT_STARTED, {
    user_role: userRole,
    chat_type: chatType,
    timestamp: new Date().toISOString(),
  });
};

export const trackChatMessage = (
  userRole: string,
  messageType: string = "text"
) => {
  trackEvent(AnalyticsEvents.CHAT_MESSAGE_SENT, {
    user_role: userRole,
    message_type: messageType,
    timestamp: new Date().toISOString(),
  });
};

export const trackDeliveryTracking = (userRole: string, deliveryId: string) => {
  trackEvent(AnalyticsEvents.DELIVERY_TRACKED, {
    user_role: userRole,
    delivery_id: deliveryId,
    timestamp: new Date().toISOString(),
  });
};

export const trackConsultationBooked = (
  userRole: string,
  consultationType: string
) => {
  trackEvent(AnalyticsEvents.CONSULTATION_BOOKED, {
    user_role: userRole,
    consultation_type: consultationType,
    timestamp: new Date().toISOString(),
  });
};

export const trackPageView = (pageName: string, userRole?: string) => {
  trackEvent(AnalyticsEvents.PAGE_VIEW, {
    page_name: pageName,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackDashboardAccess = (
  dashboardType: string,
  userRole: string
) => {
  trackEvent(AnalyticsEvents.DASHBOARD_ACCESSED, {
    dashboard_type: dashboardType,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackFeatureAccess = (featureName: string, userRole: string) => {
  trackEvent(AnalyticsEvents.FEATURE_ACCESSED, {
    feature_name: featureName,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackError = (
  errorType: string,
  errorMessage: string,
  userRole?: string
) => {
  trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
    error_type: errorType,
    error_message: errorMessage,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackNetworkError = (errorCode: string, userRole?: string) => {
  trackEvent(AnalyticsEvents.NETWORK_ERROR, {
    error_code: errorCode,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackAuthenticationError = (
  errorCode: string,
  userRole?: string
) => {
  trackEvent(AnalyticsEvents.AUTHENTICATION_ERROR, {
    error_code: errorCode,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackAppLoadTime = (loadTime: number, userRole?: string) => {
  trackEvent(AnalyticsEvents.APP_LOAD_TIME, {
    load_time_ms: loadTime,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackFeatureLoadTime = (
  featureName: string,
  loadTime: number,
  userRole?: string
) => {
  trackEvent(AnalyticsEvents.FEATURE_LOAD_TIME, {
    feature_name: featureName,
    load_time_ms: loadTime,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackPharmacyRegistration = (
  pharmacyName: string
) => {
  trackEvent(AnalyticsEvents.PHARMACY_REGISTRATION, {
    pharmacy_name: pharmacyName,
    timestamp: new Date().toISOString(),
  });
};

export const trackClientRegistration = (organizationName: string) => {
  trackEvent(AnalyticsEvents.CLIENT_REGISTRATION, {
    organization_name: organizationName,
    timestamp: new Date().toISOString(),
  });
};

export const trackMedicationOrdered = (
  medicationType: string,
  userRole: string
) => {
  trackEvent(AnalyticsEvents.MEDICATION_ORDERED, {
    medication_type: medicationType,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export const trackConsultationCompleted = (
  consultationType: string,
  userRole: string
) => {
  trackEvent(AnalyticsEvents.CONSULTATION_COMPLETED, {
    consultation_type: consultationType,
    user_role: userRole,
    timestamp: new Date().toISOString(),
  });
};

export { analytics };
