"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/Common/ThemeToggle";

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
}

interface FormErrors {
  [key: string]: string;
}

export default function EnhancedAuthPage() {
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
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authType, setAuthType] = useState<"login" | "signup">("login");
  const [userType, setUserType] = useState<"CLIENT" | "PHARMACY" | "ADMIN">(
    "CLIENT"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already authenticated (run in effect to avoid updating Router during render)
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

    if (authType === "signup") {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }

      // Pharmacy-specific validation
      if (userType === "PHARMACY") {
        if (!formData.licenseNumber.trim()) {
          newErrors.licenseNumber =
            "License number is required for pharmacists";
        }
        if (!formData.pharmacyName.trim()) {
          newErrors.pharmacyName = "Pharmacy name is required";
        }
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone number is required";
        }
      }
    } else {
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
      if (authType === "login") {
        const result = await signIn("credentials", {
          username: formData.username,
          password: formData.password,
          role: userType,
          redirect: false,
        });

        if (result?.error) {
          setErrors({ general: "Invalid username or password" });
        } else if (result?.ok) {
          // Successful login - redirect will be handled by the redirect logic above
        }
      } else {
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
        };

        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(signupData),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ general: data.error || "Signup failed" });
        } else {
          const result = await signIn("credentials", {
            username: formData.username,
            password: formData.password,
            role: userType,
            redirect: false,
          });

          if (result?.error) {
            setErrors({
              general:
                "Account created but login failed. Please try logging in.",
            });
          } else if (result?.ok) {
            // Successful signup and login - redirect will be handled by the useEffect above
          }
        }
      }
    } catch {
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
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full relative"
      >
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle variant="icon" size="sm" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            SafeMeds
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {authType === "login"
              ? "Sign in to your account"
              : "Create your account"}
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

            {authType === "signup" && (
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
            )}
          </div>

          {authType === "signup" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                    errors.firstName
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
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
          )}

          {/* Pharmacy-specific fields */}
          {authType === "signup" && userType === "PHARMACY" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    License Number *
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      handleInputChange("licenseNumber", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                      errors.licenseNumber
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Enter your pharmacy license number"
                  />
                  {errors.licenseNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.licenseNumber}
                    </p>
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
                  onChange={(e) =>
                    handleInputChange("pharmacyName", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white bg-white dark:bg-gray-700 ${
                    errors.pharmacyName
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter your pharmacy name"
                />
                {errors.pharmacyName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.pharmacyName}
                  </p>
                )}
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
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
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

            {authType === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
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
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
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
            {isLoading
              ? authType === "login"
                ? "Signing in..."
                : "Creating account..."
              : authType === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {authType === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setAuthType(authType === "login" ? "signup" : "login");
                resetForm();
              }}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              {authType === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🔒 Your privacy is our priority. All consultations and data are
            encrypted and protected.
            {userType === "PHARMACY" &&
              " License verification ensures only qualified pharmacists can provide consultations."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
