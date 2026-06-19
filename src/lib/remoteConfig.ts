import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
  RemoteConfig,
} from "firebase/remote-config";
import { setLogLevel } from "firebase/app"; // Correct import location
import { app } from "./firebase";

// Initialize Firebase Remote Config
export const remoteConfig: RemoteConfig = getRemoteConfig(app);

// Configure Remote Config settings
remoteConfig.settings = {
  minimumFetchIntervalMillis: 3600000, // 1 hour in development
  fetchTimeoutMillis: 10000, // 10 seconds timeout
};

// Set default values for Remote Config parameters
remoteConfig.defaultConfig = {
  welcome_message: "Welcome to SafeMeds!",
  feature_chat_enabled: true,
  feature_delivery_enabled: true,
  feature_consultation_enabled: true,
  maintenance_mode: false,
  app_version: "1.0.0",
  max_chat_messages: 100,
  delivery_tracking_enabled: true,
  pharmacy_verification_required: true,
  client_registration_enabled: true,
  pharmacy_registration_enabled: true,
  session_timeout_minutes: 30,
  offline_mode_enabled: true,
  debug_mode: false,
  api_rate_limit: 1000,
  notification_enabled: true,
  email_verification_required: true,
  password_min_length: 6,
  max_login_attempts: 5,
  lockout_duration_minutes: 15,
};

// Remote Config helper functions
export const initializeRemoteConfig = async (): Promise<boolean> => {
  try {
    // Set log level for debugging (this affects the entire Firebase app)
    setLogLevel("info");

    // Fetch and activate remote config
    await fetchAndActivate(remoteConfig);
    console.log("Remote Config initialized and activated");

    return true;
  } catch (error) {
    console.error("Failed to initialize Remote Config:", error);
    return false;
  }
};

export const getRemoteConfigValue = (
  key: string,
  defaultValue?: string
): string => {
  try {
    const value = getValue(remoteConfig, key);
    return value.asString() || defaultValue || "";
  } catch (error) {
    console.error(`Failed to get Remote Config value for key: ${key}`, error);
    return defaultValue || "";
  }
};

export const getRemoteConfigBoolean = (
  key: string,
  defaultValue: boolean = false
): boolean => {
  try {
    const value = getValue(remoteConfig, key);
    return value.asBoolean() ?? defaultValue;
  } catch (error) {
    console.error(`Failed to get Remote Config boolean for key: ${key}`, error);
    return defaultValue;
  }
};

export const getRemoteConfigNumber = (
  key: string,
  defaultValue: number = 0
): number => {
  try {
    const value = getValue(remoteConfig, key);
    return value.asNumber() ?? defaultValue;
  } catch (error) {
    console.error(`Failed to get Remote Config number for key: ${key}`, error);
    return defaultValue;
  }
};

// Remote Config parameter types
export interface RemoteConfigParams {
  welcome_message: string;
  feature_chat_enabled: boolean;
  feature_delivery_enabled: boolean;
  feature_consultation_enabled: boolean;
  maintenance_mode: boolean;
  app_version: string;
  max_chat_messages: number;
  delivery_tracking_enabled: boolean;
  pharmacy_verification_required: boolean;
  client_registration_enabled: boolean;
  pharmacy_registration_enabled: boolean;
  session_timeout_minutes: number;
  offline_mode_enabled: boolean;
  debug_mode: boolean;
  api_rate_limit: number;
  notification_enabled: boolean;
  email_verification_required: boolean;
  password_min_length: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
}

// Get all remote config values
export const getAllRemoteConfigValues = (): Partial<RemoteConfigParams> => {
  return {
    welcome_message: getRemoteConfigValue(
      "welcome_message",
      "Welcome to SafeMeds!"
    ),
    feature_chat_enabled: getRemoteConfigBoolean("feature_chat_enabled", true),
    feature_delivery_enabled: getRemoteConfigBoolean(
      "feature_delivery_enabled",
      true
    ),
    feature_consultation_enabled: getRemoteConfigBoolean(
      "feature_consultation_enabled",
      true
    ),
    maintenance_mode: getRemoteConfigBoolean("maintenance_mode", false),
    app_version: getRemoteConfigValue("app_version", "1.0.0"),
    max_chat_messages: getRemoteConfigNumber("max_chat_messages", 100),
    delivery_tracking_enabled: getRemoteConfigBoolean(
      "delivery_tracking_enabled",
      true
    ),
    pharmacy_verification_required: getRemoteConfigBoolean(
      "pharmacy_verification_required",
      true
    ),
    client_registration_enabled: getRemoteConfigBoolean(
      "client_registration_enabled",
      true
    ),
    pharmacy_registration_enabled: getRemoteConfigBoolean(
      "pharmacy_registration_enabled",
      true
    ),
    session_timeout_minutes: getRemoteConfigNumber(
      "session_timeout_minutes",
      30
    ),
    offline_mode_enabled: getRemoteConfigBoolean("offline_mode_enabled", true),
    debug_mode: getRemoteConfigBoolean("debug_mode", false),
    api_rate_limit: getRemoteConfigNumber("api_rate_limit", 1000),
    notification_enabled: getRemoteConfigBoolean("notification_enabled", true),
    email_verification_required: getRemoteConfigBoolean(
      "email_verification_required",
      true
    ),
    password_min_length: getRemoteConfigNumber("password_min_length", 6),
    max_login_attempts: getRemoteConfigNumber("max_login_attempts", 5),
    lockout_duration_minutes: getRemoteConfigNumber(
      "lockout_duration_minutes",
      15
    ),
  };
};
