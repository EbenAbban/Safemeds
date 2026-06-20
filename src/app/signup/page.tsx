"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

  // Redirect if already authenticated
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

  // Real-time email validation
  const checkEmailAvailability = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setIsEmailChecking(true);
    try {
      console.log("🔍 Checking email availability:", email);
      const response = await fetch(`/api/auth/signup?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      console.log("📧 Email check result:", data);
      
      if (data.exists) {
        setErrors(prev => ({ ...prev, email: "Email is already registered" }));
      } else {
        setErrors(prev => ({ ...prev, email: "" }));
      }
    } catch (error) {
      console.error("❌ Email check error:", error);
      setErrors(prev => ({ ...prev, email: "Unable to verify email availability" }));
    } finally {
      setIsEmailChecking(false);
    }
  };

  // Real-time license validation for pharmacists
  const checkLicenseAvailability = async (licenseNumber: string) => {
    if (!licenseNumber || userType !== "PHARMACY") return;

    setIsLicenseChecking(true);
    try {
      console.log("🔍 Checking license availability:", licenseNumber);
      const response = await fetch(`/api/auth/verify-license?licenseNumber=${encodeURIComponent(licenseNumber)}`);
      const data = await response.json();
      
      console.log("💊 License check result:", data);
      
      if (!data.isValid) {
        setErrors(prev => ({ ...prev, licenseNumber: data.error || "Invalid license number" }));
      } else {
        setErrors(prev => ({ ...prev, licenseNumber: "" }));
      }
    } catch (error) {
      console.error("❌ License check error:", error);
      setErrors(prev => ({ ...prev, licenseNumber: "Unable to verify license number" }));
    } finally {
      setIsLicenseChecking(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 50) {
      newErrors.username = "Username must be less than 50 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, hyphens, and underscores";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Pharmacy-specific validation
    if (userType === "PHARMACY") {
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = "License number is required";
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ""))) {
        newErrors.phone = "Please enter a valid phone number";
      }

      if (!formData.pharmacyName.trim()) {
        newErrors.pharmacyName = "Pharmacy name is required";
      }
    }

    // Terms validation
    if (!agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the Terms of Service, Privacy Policy, and HIPAA Statement to proceed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Real-time validation with proper cleanup
    if (field === "email") {
      // Clear any existing timeout
      const timeoutId = setTimeout(() => checkEmailAvailability(value), 500);
      return () => clearTimeout(timeoutId);
    }

    if (field === "licenseNumber" && userType === "PHARMACY") {
      // Clear any existing timeout
      const timeoutId = setTimeout(() => checkLicenseAvailability(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log("❌ Form validation failed");
      return;
    }

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

      // Comprehensive debugging logs
      console.log("🚀 Attempting signup with:", {
        role: userType,
        username: formData.username,
        email: formData.email,
        hasPassword: !!formData.password,
        hasLicense: !!formData.licenseNumber,
        signupData
      });

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      console.log("📋 Signup response:", { status: response.status, data });

      if (!response.ok) {
        console.error("❌ Signup failed:", data.error);
        setErrors({ general: data.error || "Signup failed" });
        return;
      }

      console.log("✅ Account created successfully, attempting auto-login...");

      // Auto-login after successful signup
      const loginParams = userType === "PHARMACY"
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

      console.log("🔐 Auto-login params:", loginParams);

      const result = await signIn("credentials", {
        ...loginParams,
        redirect: false,
      });

      console.log("📋 Auto-login result:", result);

      if (result?.error) {
        console.error("❌ Auto-login failed:", result.error);
        setErrors({
          general: `Account created successfully! However, auto-login failed: ${result.error}. Please try logging in manually.`,
        });
      } else if (result?.ok) {
        console.log("✅ Auto-login successful, redirecting...");
        setIsSuccess(true);
        // Success - redirect will be handled by the useEffect above
      } else {
        console.error("❌ Unexpected auto-login result:", result);
        setErrors({
          general: "Account created successfully! Please try logging in manually.",
        });
      }
    } catch (error) {
      console.error("❌ Signup error:", error);
      setErrors({ general: "An error occurred. Please try again." });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full relative"
      >
        {/* Theme Toggle */}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            SafeMeds
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create your account
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Secure, anonymous healthcare consultations for students
          </p>
        </div>

        {/* User Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            I am a:
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              // Admins are never self-registered (server rejects role=ADMIN);
              // they are seeded or promoted from the admin dashboard.
              { value: "CLIENT", label: "Student", icon: "👨‍🎓" },
              { value: "PHARMACY", label: "Pharmacist", icon: "💊" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setUserType(type.value as "CLIENT" | "PHARMACY" | "ADMIN");
                  resetForm();
                }}
                className={`p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  userType === type.value
                    ? "bg-blue-500 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                  errors.username
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
                {isEmailChecking && (
                  <span className="ml-2 text-blue-500 text-xs">Checking...</span>
                )}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                  errors.email
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Full Name fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                  errors.firstName
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                  errors.lastName
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Pharmacy-specific fields */}
          {userType === "PHARMACY" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    License Number *
                    {isLicenseChecking && (
                      <span className="ml-2 text-blue-500 text-xs">Verifying...</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                      errors.licenseNumber
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Enter your pharmacy license number"
                  />
                  {errors.licenseNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                      errors.phone
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pharmacy Name *
                </label>
                <input
                  type="text"
                  value={formData.pharmacyName}
                  onChange={(e) => handleInputChange("pharmacyName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                    errors.pharmacyName
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter your pharmacy name"
                />
                {errors.pharmacyName && (
                  <p className="text-red-500 text-xs mt-1">{errors.pharmacyName}</p>
                )}
              </div>

              {/* Address fields for pharmacy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Enter state"
                  />
                </div>
              </div>
            </>
          )}

          {/* Password fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                    errors.password
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex items-start my-4">
            <div className="flex items-center h-5">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (errors.agreeToTerms) {
                    setErrors((prev) => ({ ...prev, agreeToTerms: "" }));
                  }
                }}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToTerms" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => router.push("/legal?tab=terms")}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium cursor-pointer"
                >
                  Terms of Service
                </button>
                ,{" "}
                <button
                  type="button"
                  onClick={() => router.push("/legal?tab=privacy")}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium cursor-pointer"
                >
                  Privacy Policy
                </button>
                , and{" "}
                <button
                  type="button"
                  onClick={() => router.push("/legal?tab=hipaa")}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium cursor-pointer"
                >
                  HIPAA & Health Security Statement
                </button>
                .
              </label>
              {errors.agreeToTerms && (
                <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>
              )}
            </div>
          </div>

          {isSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
              <p>✅ Account created successfully! Redirecting to your dashboard...</p>
              {userType === "PHARMACY" && (
                <p className="mt-2 text-sm">
                  After logging in, please{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/verify-license")}
                    className="text-green-600 dark:text-green-300 underline font-medium hover:text-green-700 dark:hover:text-green-200 cursor-pointer"
                  >
                    verify your pharmacy license
                  </button>{" "}
                  to start providing consultations.
                </p>
              )}
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isEmailChecking || isLicenseChecking || !agreeToTerms}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              agreeToTerms
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            } disabled:opacity-60`}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/auth")}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🔒 Your privacy is our priority. All consultations and data are encrypted (AES-256). Read our{" "}
            <button
              onClick={() => router.push("/legal?tab=privacy")}
              className="underline hover:text-blue-800 dark:hover:text-blue-200 font-semibold cursor-pointer"
            >
              Privacy Policy
            </button>{" "}
            and{" "}
            <button
              onClick={() => router.push("/legal?tab=hipaa")}
              className="underline hover:text-blue-800 dark:hover:text-blue-200 font-semibold cursor-pointer"
            >
              HIPAA Statement
            </button>
            .
            {userType === "PHARMACY" &&
              " License verification ensures only qualified pharmacists can provide consultations."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
