"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LEGAL_VERSION } from "@/lib/legal";
import { buttonClasses, Input } from "@/components/ui";
import { CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";

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
  const [userType, setUserType] = useState<"CLIENT" | "PHARMACY" | "COURIER">("CLIENT");
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
          : session.user.role === "COURIER"
          ? "/courier-dashboard"
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

    if (userType === "COURIER") {
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required.";
      } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ""))) {
        newErrors.phone = "Enter a valid phone number.";
      }
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
    <div className="flex min-h-screen bg-surface dark:bg-surface-dark">
      {/* Brand panel — no stock photo; same reasoning as /auth. */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-dark-navy via-surface-dark to-medical-teal p-margin-desktop lg:flex">
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-soft-aqua" aria-hidden="true" />
          <span className="text-headline-md font-bold text-white">SafeMeds</span>
        </Link>
        <div className="relative z-10 mb-12 max-w-md">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex rounded-full bg-soft-aqua/20 p-2 text-soft-aqua">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-soft-aqua">
              Private by Design
            </span>
          </div>
          <h1 className="text-headline-lg text-white">Your health, entirely on your terms.</h1>
          <p className="mt-4 text-lg text-cool-gray">
            Experience anonymous-first healthcare. End-to-end encryption and discreet
            consultation channels, from the first message.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center overflow-y-auto p-6 lg:p-margin-desktop">
        <div className="w-full max-w-lg py-10">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <ShieldCheck className="h-6 w-6 text-medical-teal" aria-hidden="true" />
            <span className="text-lg font-bold text-medical-teal">SafeMeds</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-headline-lg text-on-surface">Create Account</h2>
            <p className="mt-2 text-on-surface-variant">
              Already have an account?{" "}
              <Link href="/auth" className="font-semibold text-medical-teal hover:text-soft-aqua dark:text-primary-fixed-dim">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mb-8 flex rounded-lg bg-surface-container-low p-1 dark:bg-surface-container">
            {(
              [
                { value: "CLIENT", label: "Student" },
                { value: "PHARMACY", label: "Pharmacist" },
                { value: "COURIER", label: "Courier" },
              ] as const
            ).map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setUserType(type.value);
                  resetForm();
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-200 ${
                  userType === type.value
                    ? "bg-surface-container-lowest text-on-surface shadow-sm dark:bg-surface-container-high"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Jane"
                error={errors.firstName}
              />
              <Input
                label="Last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Smith"
                error={errors.lastName}
              />
            </div>

            <Input
              label="Username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="janesmith"
              error={errors.username}
            />

            <Input
              label={isEmailChecking ? "Email (checking…)" : "Email"}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="jane@example.com"
              error={errors.email}
            />

            {userType === "PHARMACY" && (
              <>
                <Input
                  label={isLicenseChecking ? "License number (verifying…)" : "License number"}
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                  placeholder="e.g. RPh-123456"
                  error={errors.licenseNumber}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Pharmacy name"
                    value={formData.pharmacyName}
                    onChange={(e) => handleInputChange("pharmacyName", e.target.value)}
                    placeholder="City Pharmacy"
                    error={errors.pharmacyName}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 555 000 0000"
                    error={errors.phone}
                  />
                </div>

                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main St"
                />

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="New York"
                  />
                  <Input
                    label="State"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="NY"
                  />
                  <Input
                    label="Zip code"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </>
            )}

            {userType === "COURIER" && (
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 555 000 0000"
                hint="Used by dispatch to reach you about active deliveries."
                error={errors.phone}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Min. 8 characters"
                error={errors.password}
                trailingSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="p-2 text-on-surface-variant transition-colors hover:text-on-surface"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                }
              />
              <Input
                label="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Repeat password"
                error={errors.confirmPassword}
                trailingSlot={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="p-2 text-on-surface-variant transition-colors hover:text-on-surface"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                }
              />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                id="agreeToTerms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (errors.agreeToTerms) setErrors((prev) => ({ ...prev, agreeToTerms: "" }));
                }}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-outline-variant text-medical-teal focus:ring-soft-aqua"
              />
              <label htmlFor="agreeToTerms" className="cursor-pointer text-sm text-on-surface-variant">
                I agree to the{" "}
                <Link href="/legal?tab=terms" className="text-medical-teal hover:underline dark:text-primary-fixed-dim">
                  Terms of Service
                </Link>
                ,{" "}
                <Link href="/legal?tab=privacy" className="text-medical-teal hover:underline dark:text-primary-fixed-dim">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link href="/legal?tab=hipaa" className="text-medical-teal hover:underline dark:text-primary-fixed-dim">
                  HIPAA Statement
                </Link>
                .
              </label>
            </div>
            {errors.agreeToTerms && <p className="-mt-2 text-xs text-error">{errors.agreeToTerms}</p>}

            {isSuccess && (
              <div className="flex items-start gap-3 rounded-lg border border-secondary/30 bg-secondary-container/40 px-4 py-3 text-sm text-on-secondary-container">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  Account created. Redirecting to your dashboard…
                  {userType === "PHARMACY" && (
                    <p className="mt-1">
                      Once signed in, please{" "}
                      <Link href="/verify-license" className="font-medium underline">
                        verify your pharmacy license
                      </Link>{" "}
                      to start providing consultations.
                    </p>
                  )}
                </div>
              </div>
            )}

            {errors.general && (
              <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isEmailChecking || isLicenseChecking || !agreeToTerms}
              className={buttonClasses({ size: "lg", fullWidth: true })}
            >
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-on-surface-variant">
            All data is encrypted and handled in accordance with HIPAA guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
