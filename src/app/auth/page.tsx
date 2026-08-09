"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ThreadsBackground from "@/components/effects/ThreadsBackground";

interface FormData {
  username: string;
  email: string;
  password: string;
  licenseNumber: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function AuthPage() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    licenseNumber: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"CLIENT" | "PHARMACY" | "ADMIN">("CLIENT");
  const [showPassword, setShowPassword] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const dashboardPath =
        session.user.role === "ADMIN"
          ? "/admin"
          : session.user.role === "PHARMACY"
          ? "/pharmacy-dashboard"
          : "/client-dashboard";
      router.replace(dashboardPath);
    }
  }, [status, session, router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (userType === "PHARMACY") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Enter a valid email address.";
      }
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = "License number is required.";
      }
    } else {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required.";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const loginParams =
        userType === "PHARMACY"
          ? {
              email: formData.email,
              password: formData.password,
              licenseNumber: formData.licenseNumber,
              role: userType,
            }
          : {
              username: formData.username,
              password: formData.password,
              role: userType,
            };

      const result = await signIn("credentials", { ...loginParams, redirect: false });

      if (result?.error) {
        setErrors({ general: "Invalid credentials. Please check your details and try again." });
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ username: "", email: "", password: "", licenseNumber: "" });
    setErrors({});
  };

  const roles = [
    { value: "CLIENT", label: "Student" },
    { value: "PHARMACY", label: "Pharmacist" },
    { value: "ADMIN", label: "Admin" },
  ];

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col justify-between overflow-hidden bg-gray-950 dark:bg-black p-10">
        <ThreadsBackground
          wrapperClassName="absolute inset-0 pointer-events-none opacity-50"
          color={[0.36, 0.29, 1]}
          amplitude={1.2}
          distance={0.2}
          enableMouseInteraction
        />
        <div className="relative">
          <span className="text-white text-xl font-semibold tracking-tight">SafeMeds</span>
        </div>
        <div className="relative">
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Secure healthcare management platform for students and licensed pharmacists.
            All data is encrypted end-to-end.
          </p>
        </div>
        <p className="relative text-gray-600 text-xs">
          &copy; {new Date().getFullYear()} SafeMeds. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="w-full max-w-sm mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Sign in</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No account?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Create one
              </button>
            </p>
          </div>

          {/* Role tabs */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Sign in as
            </label>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900 gap-1">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    setUserType(role.value as "CLIENT" | "PHARMACY" | "ADMIN");
                    resetForm();
                  }}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                    userType === role.value
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: email (Pharmacist) or username (Client/Admin) */}
            {userType === "PHARMACY" ? (
              <Field label="Email" error={errors.email} required>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="pharmacist@example.com"
                  autoComplete="email"
                  className={inputClass(!!errors.email)}
                />
              </Field>
            ) : (
              <Field label="Username" error={errors.username} required>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="your_username"
                  autoComplete="username"
                  className={inputClass(!!errors.username)}
                />
              </Field>
            )}

            {/* License number (Pharmacist only) */}
            {userType === "PHARMACY" && (
              <Field label="License number" error={errors.licenseNumber} required>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                  placeholder="e.g. RPh-123456"
                  autoComplete="off"
                  className={inputClass(!!errors.licenseNumber)}
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Must match the license number on your account.
                </p>
              </Field>
            )}

            {/* Password */}
            <Field label="Password" error={errors.password} required>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={inputClass(!!errors.password) + " pr-16"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </Field>

            {/* Error banner */}
            {errors.general && (
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {errors.general}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* What each role needs */}
          <div className="mt-8 rounded-lg border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <div className="px-4 py-3">
              <span className="font-medium text-gray-700 dark:text-gray-300">Student</span>
              &nbsp;&mdash; username + password
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-gray-700 dark:text-gray-300">Pharmacist</span>
              &nbsp;&mdash; email + license number + password
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-gray-700 dark:text-gray-300">Admin</span>
              &nbsp;&mdash; username + password
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-400 dark:text-gray-600 text-center">
            All data is encrypted and handled in accordance with HIPAA guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- Helpers ----

function inputClass(hasError: boolean): string {
  return [
    "w-full px-3 py-2 rounded-lg text-sm border bg-white dark:bg-gray-900",
    "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600",
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors",
    hasError
      ? "border-red-400 dark:border-red-600"
      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
  ].join(" ");
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: React.ReactNode;
  error: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
