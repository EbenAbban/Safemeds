"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (userType === "PHARMACY") {
      // Pharmacist login validation
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      }

      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = "License number is required";
      }
    } else {
      // Client and Admin login validation
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      }
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Different login parameters based on user type
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

      const result = await signIn("credentials", {
        ...loginParams,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ general: "Invalid credentials. Please check your information and try again." });
      } else if (result?.ok) {
        // Successful login - redirect will be handled by the useEffect above
      }
    } catch (error) {
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
      licenseNumber: "",
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-lg w-full relative"
      >
        {/* Theme Toggle */}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            SafeMeds
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to your account
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
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "CLIENT", label: "Student", icon: "👨‍🎓" },
              { value: "PHARMACY", label: "Pharmacist", icon: "💊" },
              { value: "ADMIN", label: "Admin", icon: "⚙️" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setUserType(type.value as any);
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
          {userType === "PHARMACY" ? (
            // Pharmacist login fields
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Number *
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
                  placeholder="Enter your license number (e.g., PH123456)"
                />
                {errors.licenseNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 You can enter a new license number if you've recently
                  renewed or changed your license.
                </p>
              </div>
            </div>
          ) : (
            // Client and Admin login fields
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
          )}

          {/* Password field */}
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

          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Quick Access Links */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/signin")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            Alternative Sign In
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            Create New Account
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🔒 Your privacy is our priority. All data is encrypted (AES-256). Read our{" "}
            <button
              onClick={() => router.push("/legal?tab=terms")}
              className="underline hover:text-blue-800 dark:hover:text-blue-200 font-semibold cursor-pointer"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              onClick={() => router.push("/legal?tab=privacy")}
              className="underline hover:text-blue-800 dark:hover:text-blue-200 font-semibold cursor-pointer"
            >
              Privacy Policy
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
