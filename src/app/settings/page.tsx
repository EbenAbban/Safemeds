"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Loader2,
  Lock,
  Save,
  Settings,
  Shield,
  Truck,
  Users,
} from "lucide-react";

// These were previously a local `iconMap` of stand-in components, every one of
// which rendered an empty <span> — the emoji they were meant to hold had been
// stripped. Nothing on this page had a visible icon, and the Save control was
// an unlabelled green pill because its only child rendered nothing at all.
// lucide-react is already a dependency and is what the rest of the app uses.

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("privacy");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [settings, setSettings] = useState({
    privacy: {
      anonymousConsultations: true,
      dataRetentionPeriod: "30",
      encryptionLevel: "aes256",
      autoDeleteChats: true,
      maskedDeliveryDefault: true,
    },
    delivery: {
      campusDropPoints: [
        "Library North Entrance",
        "Student Center Lobby",
        "Health Services Building",
      ],
      deliveryHours: { start: "08:00", end: "20:00" },
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
      twoFactorAuth: true,
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
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    loadSettings();
  }, [session, status, router]);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Save error:", error);
      setMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const updateSetting = (category: keyof typeof settings, key: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] as Record<string, unknown>),
        [key]: value,
      },
    }));
  };

  const updateDeliveryHours = (type: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        deliveryHours: {
          ...prev.delivery.deliveryHours,
          [type]: value,
        },
      },
    }));
  };

  const addDropPoint = (newPoint: string) => {
    if (newPoint.trim()) {
      setSettings((prev) => ({
        ...prev,
        delivery: {
          ...prev.delivery,
          campusDropPoints: [...prev.delivery.campusDropPoints, newPoint.trim()],
        },
      }));
    }
  };

  const removeDropPoint = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        campusDropPoints: prev.delivery.campusDropPoints.filter((_, i) => i !== index),
      },
    }));
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface dark:bg-surface-dark flex items-center justify-center">
        <div className="flex items-center gap-2 text-on-surface dark:text-on-surface">
          <Loader2 className="h-8 w-8 animate-spin text-medical-teal motion-reduce:animate-none" aria-hidden="true" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const tabs = [
    { id: "privacy", label: "Privacy & Anonymity", icon: Shield },
    { id: "delivery", label: "Delivery System", icon: Truck },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "consultation", label: "Consultation Settings", icon: Users },
    { id: "appearance", label: "Appearance", icon: Settings },
  ];

  const SectionHeader = ({ icon: Icon, title, subtitle, color }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string; color: string }) => (
    <div className={`bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-700 rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon />
        <h3 className={`font-semibold text-${color}-800 dark:text-${color}-200`}>{title}</h3>
      </div>
      <p className={`text-${color}-700 dark:text-${color}-300 text-sm`}>{subtitle}</p>
    </div>
  );

  const LabeledCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-on-surface dark:text-on-surface">
        {label}
      </label>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-medical-teal focus:ring-soft-aqua dark:bg-surface-container-high dark:border-outline-variant/40"
      />
    </div>
  );

  const SelectInput = ({ label, value, onChange, options }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-sm font-medium text-on-surface dark:text-on-surface mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-outline-variant rounded-md focus:ring-soft-aqua focus:border-soft-aqua dark:bg-surface-container-high dark:text-on-surface"
      >
              {options.map((opt: { value: string; label: string }) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const TextInput = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-sm font-medium text-on-surface dark:text-on-surface mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-outline-variant rounded-md focus:ring-soft-aqua focus:border-soft-aqua dark:bg-surface-container-high dark:text-on-surface"
      />
    </div>
  );

  const renderTabComponent = {
    privacy: () => (
      <div className="space-y-6">
        <SectionHeader
          icon={Shield}
          title="Privacy Protection"
          subtitle="SafeMeds prioritizes student privacy and anonymity in all interactions."
          color="blue"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <LabeledCheckbox
              label="Anonymous Consultations"
              checked={settings.privacy.anonymousConsultations}
              onChange={(e) =>
                updateSetting("privacy", "anonymousConsultations", e.target.checked)
              }
            />
            <SelectInput
              label="Data Retention Period"
              value={settings.privacy.dataRetentionPeriod}
              onChange={(e) =>
                updateSetting("privacy", "dataRetentionPeriod", e.target.value)
              }
              options={[
                { value: "7", label: "7 days" },
                { value: "14", label: "14 days" },
                { value: "30", label: "30 days" },
                { value: "90", label: "90 days" },
              ]}
            />
            <SelectInput
              label="Encryption Level"
              value={settings.privacy.encryptionLevel}
              onChange={(e) =>
                updateSetting("privacy", "encryptionLevel", e.target.value)
              }
              options={[
                { value: "aes128", label: "AES-128" },
                { value: "aes256", label: "AES-256" },
                { value: "rsa2048", label: "RSA-2048" },
              ]}
            />
          </div>
          <div className="space-y-4">
            <LabeledCheckbox
              label="Auto-delete Chat History"
              checked={settings.privacy.autoDeleteChats}
              onChange={(e) =>
                updateSetting("privacy", "autoDeleteChats", e.target.checked)
              }
            />
            <LabeledCheckbox
              label="Masked Delivery Default"
              checked={settings.privacy.maskedDeliveryDefault}
              onChange={(e) =>
                updateSetting("privacy", "maskedDeliveryDefault", e.target.checked)
              }
            />
          </div>
        </div>
      </div>
    ),

    delivery: () => (
      <div className="space-y-6">
        <SectionHeader
          icon={Truck}
          title="Discreet Delivery System"
          subtitle="Configure campus drop points and delivery preferences for student privacy."
          color="green"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-on-surface dark:text-on-surface mb-3">Campus Drop Points</h4>
              <div className="space-y-2 mb-3">
                {settings.delivery.campusDropPoints.map((point, index) => (
                  <div key={index} className="flex items-center justify-between bg-surface dark:bg-surface-container-high p-2 rounded">
                    <span className="text-sm text-on-surface-variant">{point}</span>
                    <button
                      onClick={() => removeDropPoint(index)}
                      className="text-error hover:text-on-error-container text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new drop point"
                  className="flex-1 px-3 py-2 border border-outline-variant rounded-md dark:bg-surface-container-high dark:text-on-surface"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addDropPoint(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling;
                    if (input instanceof HTMLInputElement) {
                      addDropPoint(input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-secondary text-white rounded-md hover:opacity-90"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Delivery Start Time"
                type="time"
                value={settings.delivery.deliveryHours.start}
                onChange={(e) => updateDeliveryHours("start", e.target.value)}
              />
              <TextInput
                label="Delivery End Time"
                type="time"
                value={settings.delivery.deliveryHours.end}
                onChange={(e) => updateDeliveryHours("end", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-4">
            <LabeledCheckbox
              label="Emergency Delivery Available"
              checked={settings.delivery.emergencyDelivery}
              onChange={(e) =>
                updateSetting("delivery", "emergencyDelivery", e.target.checked)
              }
            />
            <TextInput
              label="Delivery Radius (km)"
              type="number"
              value={settings.delivery.deliveryRadius}
              onChange={(e) =>
                updateSetting("delivery", "deliveryRadius", e.target.value)
              }
            />
            <LabeledCheckbox
              label="Package Tracking Enabled"
              checked={settings.delivery.trackingEnabled}
              onChange={(e) =>
                updateSetting("delivery", "trackingEnabled", e.target.checked)
              }
            />
          </div>
        </div>
      </div>
    ),

    notifications: () => (
      <div className="space-y-6">
        <SectionHeader
          icon={Bell}
          title="Notification Preferences"
          subtitle="Configure how and when you receive alerts and updates."
          color="yellow"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-on-surface dark:text-on-surface">System Notifications</h4>
            <LabeledCheckbox
              label="New Consultations"
              checked={settings.notifications.newConsultations}
              onChange={(e) =>
                updateSetting("notifications", "newConsultations", e.target.checked)
              }
            />
            <LabeledCheckbox
              label="Urgent Requests"
              checked={settings.notifications.urgentRequests}
              onChange={(e) =>
                updateSetting("notifications", "urgentRequests", e.target.checked)
              }
            />
            <LabeledCheckbox
              label="Delivery Updates"
              checked={settings.notifications.deliveryUpdates}
              onChange={(e) =>
                updateSetting("notifications", "deliveryUpdates", e.target.checked)
              }
            />
            <LabeledCheckbox
              label="System Alerts"
              checked={settings.notifications.systemAlerts}
              onChange={(e) =>
                updateSetting("notifications", "systemAlerts", e.target.checked)
              }
            />
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-on-surface dark:text-on-surface">Communication Methods</h4>
            <LabeledCheckbox
              label="Email Notifications"
              checked={settings.notifications.emailNotifications}
              onChange={(e) =>
                updateSetting("notifications", "emailNotifications", e.target.checked)
              }
            />
            <LabeledCheckbox
              label="SMS Notifications"
              checked={settings.notifications.smsNotifications}
              onChange={(e) =>
                updateSetting("notifications", "smsNotifications", e.target.checked)
              }
            />
          </div>
        </div>
      </div>
    ),

    security: () => (
      <div className="space-y-6">
        <SectionHeader
          icon={Lock}
          title="Security Settings"
          subtitle="Configure authentication and security measures for your account."
          color="red"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <LabeledCheckbox
              label="Two-Factor Authentication"
              checked={settings.security.twoFactorAuth}
              onChange={(e) =>
                updateSetting("security", "twoFactorAuth", e.target.checked)
              }
            />
            <SelectInput
              label="Session Timeout (minutes)"
              value={settings.security.sessionTimeout}
              onChange={(e) =>
                updateSetting("security", "sessionTimeout", e.target.value)
              }
              options={[
                { value: "15", label: "15 minutes" },
                { value: "30", label: "30 minutes" },
                { value: "60", label: "1 hour" },
                { value: "120", label: "2 hours" },
              ]}
            />
            <LabeledCheckbox
              label="Audit Logging"
              checked={settings.security.auditLogging}
              onChange={(e) =>
                updateSetting("security", "auditLogging", e.target.checked)
              }
            />
          </div>
          <div className="space-y-4">
            <TextInput
              label="IP Whitelist (comma-separated)"
              value={settings.security.ipWhitelist}
              onChange={(e) =>
                updateSetting("security", "ipWhitelist", e.target.value)
              }
              placeholder="192.168.1.1, 10.0.0.1"
            />
            <LabeledCheckbox
              label="Suspicious Activity Alerts"
              checked={settings.security.suspiciousActivityAlerts}
              onChange={(e) =>
                updateSetting("security", "suspiciousActivityAlerts", e.target.checked)
              }
            />
          </div>
        </div>
      </div>
    ),

    consultation: () => (
      <div className="space-y-6">
        <SectionHeader
          icon={Users}
          title="Consultation Management"
          subtitle="Configure settings for student consultations and pharmacist interactions."
          color="indigo"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <TextInput
              label="Maximum Active Chats"
              type="number"
              value={settings.consultation.maxActiveChats}
              onChange={(e) =>
                updateSetting("consultation", "maxActiveChats", e.target.value)
              }
            />
            <TextInput
              label="Response Time Target (minutes)"
              type="number"
              value={settings.consultation.responseTimeTarget}
              onChange={(e) =>
                updateSetting("consultation", "responseTimeTarget", e.target.value)
              }
            />
            <LabeledCheckbox
              label="Auto-assignment of Consultations"
              checked={settings.consultation.autoAssignment}
              onChange={(e) =>
                updateSetting("consultation", "autoAssignment", e.target.checked)
              }
            />
          </div>
          <div className="space-y-4">
            <LabeledCheckbox
              label="Prioritize Urgent Requests"
              checked={settings.consultation.prioritizeUrgent}
              onChange={(e) =>
                updateSetting("consultation", "prioritizeUrgent", e.target.checked)
              }
            />
            <LabeledCheckbox
              label="Allow File Uploads"
              checked={settings.consultation.allowFileUploads}
              onChange={(e) =>
                updateSetting("consultation", "allowFileUploads", e.target.checked)
              }
            />
          </div>
        </div>
      </div>
    ),

    appearance: () => (
      <div className="space-y-6">
        <SectionHeader
          icon={Settings}
          title="Appearance & Theme"
          subtitle="Customize your interface appearance and visual preferences."
          color="purple"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-on-surface dark:text-on-surface">
                  Theme Mode
                </h3>
                <p className="text-on-surface-variant text-sm">
                  Choose between light and dark themes
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 bg-medical-teal text-white rounded-lg hover:bg-secondary transition-colors"
              >
                <span>{theme === "light" ? "" : "️"}</span>
                <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-on-surface dark:text-on-surface">
                  Current Theme
                </h3>
                <p className="text-on-surface-variant text-sm capitalize">{theme} mode</p>
              </div>
              <div className="text-sm text-on-surface-variant">
                {theme === "light" ? "️" : ""}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-on-surface dark:text-on-surface">Interface Preferences</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-on-surface-variant">Compact sidebar</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-on-surface-variant">Show tooltips</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-on-surface-variant">Enable animations</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-on-surface dark:text-on-surface">Color Scheme</h4>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full bg-soft-aqua ring-2 ring-blue-500 ring-offset-2"></button>
                <button className="w-8 h-8 rounded-full bg-secondary hover:ring-2 hover:ring-green-500 hover:ring-offset-2"></button>
                <button className="w-8 h-8 rounded-full bg-tertiary hover:ring-2 hover:ring-purple-500 hover:ring-offset-2"></button>
                <button className="w-8 h-8 rounded-full bg-error hover:ring-2 hover:ring-red-500 hover:ring-offset-2"></button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 border border-outline-variant/60 rounded-lg">
              <h4 className="font-medium text-on-surface dark:text-on-surface mb-2">
                Theme Preview
              </h4>
              <div
                className={`p-3 rounded-lg ${
                  theme === "light"
                    ? "bg-surface-container-low text-on-surface"
                    : "bg-gray-800 text-gray-200"
                }`}
              >
                <p className="text-sm">
                  This is how your interface will look with the {theme} theme.
                </p>
                <div className="mt-2 flex gap-2">
                  <button className="px-3 py-1 bg-soft-aqua text-white text-xs rounded">Button</button>
                  <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-xs rounded">Success</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low dark:bg-surface-container rounded-lg">
              <h4 className="font-medium text-on-surface dark:text-on-surface mb-2">
                Font Settings
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">Font Size</label>
                  <select defaultValue="Medium" className="w-full px-2 py-1 text-sm border rounded dark:bg-surface-container-high dark:border-outline-variant/40 dark:text-on-surface">
                    <option>Small</option>
                    <option>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">Font Family</label>
                  <select defaultValue="System Default" className="w-full px-2 py-1 text-sm border rounded dark:bg-surface-container-high dark:border-outline-variant/40 dark:text-on-surface">
                    <option>System Default</option>
                    <option>Inter</option>
                    <option>Roboto</option>
                    <option>Open Sans</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="text-sm text-on-surface-variant">
              <p>• Theme preference is saved automatically</p>
              <p>• Changes apply immediately</p>
              <p>• Works across all pages</p>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-on-surface mb-2">
            SafeMeds Pharmacy Settings
          </h1>
          <p className="text-on-surface-variant">
            Configure your dashboard for anonymous student consultations and
            secure delivery.
          </p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-on-secondary-container border border-secondary/30 dark:border-green-700"
                : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-on-error-container border border-error/30 dark:border-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === id
                      ? "bg-medical-teal text-white"
                      : "bg-surface-container-lowest dark:bg-surface-container text-on-surface dark:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <Icon />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1">
            <div className="bg-surface-container-lowest dark:bg-surface-container rounded-lg shadow-sm border border-outline-variant/60 p-6">
              {renderTabComponent[activeTab as keyof typeof renderTabComponent]()}

              {/* An icon alone is not a save button. This previously rendered
                  its label from a stand-in component that produced an empty
                  span, so the control appeared as a bare green pill with no
                  indication of what it did. */}
              <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t border-outline-variant/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-on-surface-variant">
                  Changes apply once you save.
                </p>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-medical-teal px-6 py-2.5 font-semibold text-white shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary dark:text-on-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" aria-hidden="true" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
