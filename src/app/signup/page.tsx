"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LEGAL_VERSION } from "@/lib/legal";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  pharmacyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    licenseNumber: "",
    pharmacyName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userType, setUserType] = useState<"CLIENT" | "PHARMACY" | "ADMIN">("CLIENT");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isLicenseChecking, setIsLicenseChecking] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

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

  const checkEmailAvailability = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setIsEmailChecking(true);
    try {
      const response = await fetch(`/api/auth/signup?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (data.exists) {
        setErrors((prev) => ({ ...prev, email: "This email is already registered." }));
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, email: "Unable to verify email availability." }));
    } finally {
      setIsEmailChecking(false);
    }
  };

  const checkLicenseAvailability = async (licenseNumber: string) => {
    if (!licenseNumber || userType !== "PHARMACY") return;
    setIsLicenseChecking(true);
    try {
      const response = await fetch(
        `/api/auth/verify-license?licenseNumber=${encodeURIComponent(licenseNumber)}`
      );
      const data = await response.json();
      if (!data.isValid) {
        setErrors((prev) => ({ ...prev, licenseNumber: data.error || "Invalid license number." }));
      } else {
        setErrors((prev) => ({ ...prev, licenseNumber: "" }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, licenseNumber: "Unable to verify license number." }));
    } finally {
      setIsLicenseChecking(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required.";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    } else if (formData.username.length > 50) {
      newErrors.username = "Username must be fewer than 50 characters.";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = "Only letters, numbers, hyphens, and underscores allowed.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Include uppercase, lowercase, and a number.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";

    if (userType === "PHARMACY") {
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = "License number is required.";
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required.";
      } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ""))) {
        newErrors.phone = "Enter a valid phone number.";
      }
      if (!formData.pharmacyName.trim()) newErrors.pharmacyName = "Pharmacy name is required.";
    }

    if (!agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms to continue.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));

    if (field === "email") {
      const timeoutId = setTimeout(() => checkEmailAvailability(value), 500);
      return () => clearTimeout(timeoutId);
    }
    if (field === "licenseNumber" && userType === "PHARMACY") {
      const timeoutId = setTimeout(() => checkLicenseAvailability(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const signupData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: userType,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        pharmacyName: formData.pharmacyName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        termsAccepted: agreeToTerms,
        termsVersion: LEGAL_VERSION,
      };

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Signup failed. Please try again." });
        return;
      }

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
        setErrors({
          general: "Account created. Auto-login failed — please sign in manually.",
        });
      } else if (result?.ok) {
        setIsSuccess(true);
      } else {
        setErrors({ general: "Account created. Please sign in to continue." });
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      licenseNumber: "",
      pharmacyName: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    });
    setErrors({});
    setIsSuccess(false);
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col justify-between bg-gray-950 dark:bg-black p-10 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-white text-xl font-semibold tracking-tight">SafeMeds</span>
        </div>
        {/* Illustration */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-xs rounded-2xl overflow-hidden bg-slate-100 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pharmacist-patient.jpg"
              alt="Pharmacist consulting with a patient"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-4">
            Secure healthcare management platform for students and licensed pharmacists.
            All data is encrypted end-to-end.
          </p>
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} SafeMeds. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Create an account
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/auth")}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Account type tabs */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Account type
            </label>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900 gap-1">
              {[
                { value: "CLIENT", label: "Student" },
                { value: "PHARMACY", label: "Pharmacist" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setUserType(type.value as "CLIENT" | "PHARMACY" | "ADMIN");
                    resetForm();
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    userType === type.value
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" error={errors.firstName} required>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Jane"
                  className={inputClass(!!errors.firstName)}
                />
              </Field>
              <Field label="Last name" error={errors.lastName} required>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Smith"
                  className={inputClass(!!errors.lastName)}
                />
              </Field>
            </div>

            {/* Username */}
            <Field label="Username" error={errors.username} required>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="janesmith"
                className={inputClass(!!errors.username)}
              />
            </Field>

            {/* Email */}
            <Field
              label={
                <span>
                  Email{" "}
                  {isEmailChecking && (
                    <span className="text-gray-400 font-normal text-xs ml-1">Checking...</span>
                  )}
                </span>
              }
              error={errors.email}
              required
            >
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="jane@example.com"
                className={inputClass(!!errors.email)}
              />
            </Field>

            {/* Pharmacy-specific fields */}
            {userType === "PHARMACY" && (
              <>
                <Field
                  label={
                    <span>
                      License number{" "}
                      {isLicenseChecking && (
                        <span className="text-gray-400 font-normal text-xs ml-1">Verifying...</span>
                      )}
                    </span>
                  }
                  error={errors.licenseNumber}
                  required
                >
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                    placeholder="e.g. RPh-123456"
                    className={inputClass(!!errors.licenseNumber)}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Pharmacy name" error={errors.pharmacyName} required>
                    <input
                      type="text"
                      value={formData.pharmacyName}
                      onChange={(e) => handleInputChange("pharmacyName", e.target.value)}
                      placeholder="City Pharmacy"
                      className={inputClass(!!errors.pharmacyName)}
                    />
                  </Field>
                  <Field label="Phone" error={errors.phone} required>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+1 555 000 0000"
                      className={inputClass(!!errors.phone)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="City" error="">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="New York"
                      className={inputClass(false)}
                    />
                  </Field>
                  <Field label="State" error="">
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      placeholder="NY"
                      className={inputClass(false)}
                    />
                  </Field>
                </div>
              </>
            )}

            {/* Password row */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Password" error={errors.password} required>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Min. 8 characters"
                    className={inputClass(!!errors.password) + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-medium"
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword} required>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Repeat password"
                    className={inputClass(!!errors.confirmPassword) + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-medium"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="agreeToTerms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (errors.agreeToTerms) setErrors((prev) => ({ ...prev, agreeToTerms: "" }));
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-gray-800 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => router.push("/legal?tab=terms")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Terms of Service
                </button>
                ,{" "}
                <button
                  type="button"
                  onClick={() => router.push("/legal?tab=privacy")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Privacy Policy
                </button>
                , and{" "}
                <button
                  type="button"
                  onClick={() => router.push("/legal?tab=hipaa")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  HIPAA Statement
                </button>
                .
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-red-500 text-xs -mt-2">{errors.agreeToTerms}</p>
            )}

            {/* Status messages */}
            {isSuccess && (
              <div className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 px-4 py-3 text-sm text-green-800 dark:text-green-300">
                Account created. Redirecting to your dashboard&hellip;
                {userType === "PHARMACY" && (
                  <p className="mt-1 text-green-700 dark:text-green-400">
                    Once signed in, please{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/verify-license")}
                      className="underline font-medium"
                    >
                      verify your pharmacy license
                    </button>{" "}
                    to start providing consultations.
                  </p>
                )}
              </div>
            )}

            {errors.general && (
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {errors.general}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || isEmailChecking || isLicenseChecking || !agreeToTerms}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-xs text-gray-400 dark:text-gray-600 text-center">
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
