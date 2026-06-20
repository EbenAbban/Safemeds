import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";

export interface UserSettings {
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  privacy: {
    anonymousConsultations: boolean;
    dataRetentionPeriod: string;
    encryptionLevel: string;
    autoDeleteChats: boolean;
    maskedDeliveryDefault: boolean;
  };
  delivery: {
    campusDropPoints: string[];
    deliveryHours: {
      start: string;
      end: string;
    };
    emergencyDelivery: boolean;
    deliveryRadius: string;
    trackingEnabled: boolean;
  };
  notifications: {
    newConsultations: boolean;
    urgentRequests: boolean;
    deliveryUpdates: boolean;
    systemAlerts: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    ipWhitelist: string;
    auditLogging: boolean;
    suspiciousActivityAlerts: boolean;
  };
  consultation: {
    maxActiveChats: string;
    responseTimeTarget: string;
    autoAssignment: boolean;
    prioritizeUrgent: boolean;
    allowFileUploads: boolean;
  };
}

export interface SettingsUpdateData {
  theme?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  privacy?: {
    anonymousConsultations?: boolean;
    dataRetentionPeriod?: string;
    encryptionLevel?: string;
    autoDeleteChats?: boolean;
    maskedDeliveryDefault?: boolean;
  };
  delivery?: {
    campusDropPoints?: string[];
    deliveryHours?: {
      start?: string;
      end?: string;
    };
    emergencyDelivery?: boolean;
    deliveryRadius?: string;
    trackingEnabled?: boolean;
  };
  notifications?: {
    newConsultations?: boolean;
    urgentRequests?: boolean;
    deliveryUpdates?: boolean;
    systemAlerts?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
  security?: {
    twoFactorAuth?: boolean;
    sessionTimeout?: string;
    ipWhitelist?: string;
    auditLogging?: boolean;
    suspiciousActivityAlerts?: boolean;
  };
  consultation?: {
    maxActiveChats?: string;
    responseTimeTarget?: string;
    autoAssignment?: boolean;
    prioritizeUrgent?: boolean;
    allowFileUploads?: boolean;
  };
}

export function useSettings() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Default settings (memoized so its identity is stable across renders and
  // doesn't churn the useCallback deps below).
  const defaultSettings: UserSettings = useMemo(() => ({
    theme: "light",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    privacy: {
      anonymousConsultations: true,
      dataRetentionPeriod: "30",
      encryptionLevel: "aes256",
      autoDeleteChats: true,
      maskedDeliveryDefault: true,
    },
    delivery: {
      campusDropPoints: [],
      deliveryHours: {
        start: "08:00",
        end: "20:00",
      },
      emergencyDelivery: true,
      deliveryRadius: "5",
      trackingEnabled: true,
    },
    notifications: {
      newConsultations: true,
      urgentRequests: true,
      deliveryUpdates: true,
      systemAlerts: true,
      emailNotifications: true,
      smsNotifications: false,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: "30",
      ipWhitelist: "",
      auditLogging: true,
      suspiciousActivityAlerts: true,
    },
    consultation: {
      maxActiveChats: "10",
      responseTimeTarget: "15",
      autoAssignment: true,
      prioritizeUrgent: true,
      allowFileUploads: true,
    },
  }), []);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    if (status === "loading") return;

    if (!session?.user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/settings");

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch settings");
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, [session, status, defaultSettings]);

  // Update settings
  const updateSettings = useCallback(
    async (updateData: SettingsUpdateData) => {
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      try {
        setSaving(true);
        setError(null);

        const response = await fetch("/api/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Failed to update settings: ${response.statusText}`
          );
        }

        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        return updatedSettings;
      } catch (err) {
        console.error("Error updating settings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to update settings"
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [session]
  );

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    if (!session?.user) {
      throw new Error("User not authenticated");
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/settings", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to reset settings: ${response.statusText}`);
      }

      setSettings(defaultSettings);
      return defaultSettings;
    } catch (err) {
      console.error("Error resetting settings:", err);
      setError(err instanceof Error ? err.message : "Failed to reset settings");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [session, defaultSettings]);

  // Update a specific setting
  const updateSetting = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      const updateData = { [key]: value } as SettingsUpdateData;
      return await updateSettings(updateData);
    },
    [updateSettings]
  );

  // Update nested settings
  const updateNestedSetting = useCallback(
    async <K extends keyof UserSettings, N extends keyof UserSettings[K]>(
      category: K,
      key: N,
      value: UserSettings[K][N]
    ) => {
      const updateData = {
        [category]: {
          [key]: value,
        },
      } as SettingsUpdateData;
      return await updateSettings(updateData);
    },
    [updateSettings]
  );

  // Load settings on mount and when session changes
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings: settings || defaultSettings,
    loading,
    saving,
    error,
    updateSettings,
    updateSetting,
    updateNestedSetting,
    resetSettings,
    refetch: fetchSettings,
  };
}
