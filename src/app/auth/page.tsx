"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge, buttonClasses, Input } from "@/components/ui";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, User } from "lucide-react";

/**
 * SafeMeds Vital sign-in — split-screen layout per design.md §22.
 *
 * The design system's mockup shows a two-tab Student/Pharmacy toggle. The
 * real app also supports ADMIN sign-in (username + password, same shape as
 * Student) — dropping it here would break real login capability for admin
 * accounts, so it stays as a third tab rather than being designed away.
 *
 * Brand panel image is the landing page's hero photo (the design system's
 * own generated asset, no third-party stock-agency branding) — matching
 * the treatment used there. Two other assets were proposed and declined for
 * this spot: a Getty Images clip and a Videohive/iStock clip, both
 * confirmed via an extracted frame to carry a visible stock-agency
 * watermark and both explicitly preview-only comps, not licensed for use in
 * a live product. Shown on both mobile (compact banner above the form) and
 * desktop (full panel).
 */

interface FormData {
  username: string;
  email: string;
  password: string;
  licenseNumber: string;
}

interface FormErrors {
  [key: string]: string;
}

const ROLES = [
  { value: "CLIENT", label: "Student" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "COURIER", label: "Courier" },
  { value: "ADMIN", label: "Admin" },
] as const;

export default function AuthPage() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    licenseNumber: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"CLIENT" | "PHARMACY" | "ADMIN" | "COURIER">("CLIENT");
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
          : session.user.role === "COURIER"
          ? "/courier-dashboard"
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
    } else if (!formData.username.trim()) {
      newErrors.username = "Username is required.";
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
          ? { email: formData.email, password: formData.password, licenseNumber: formData.licenseNumber, role: userType }
          : { username: formData.username, password: formData.password, role: userType };

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

  const formTitle = userType === "PHARMACY" ? "Pharmacist Portal" : "Welcome Back";
  const formSubtitle =
    userType === "PHARMACY" ? "Secure access for verified providers." : "Sign in securely to your account.";

  return (
    <div className="flex min-h-screen bg-surface dark:bg-surface-dark">
      {/* Brand panel — desktop */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-margin-desktop md:flex">
        <Image
          src="/assets/images/hero-student.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-navy via-dark-navy/70 to-dark-navy/20" />

        <div className="relative z-10 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-soft-aqua" aria-hidden="true" />
          <span className="text-headline-md font-bold text-white">SafeMeds</span>
        </div>
        <div className="relative z-10 mb-12 max-w-lg">
          <h1 className="text-hero leading-tight text-white">
            Private healthcare,
            <br />
            built for students.
          </h1>
          <p className="mt-4 text-lg text-cool-gray">
            Secure, anonymous-first consultations and prescription delivery directly to campus.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-1 flex-col items-center justify-center p-6 md:p-margin-desktop">
        <Link href="/" className="mb-6 flex items-center gap-2 self-start md:hidden">
          <ShieldCheck className="h-6 w-6 text-medical-teal" aria-hidden="true" />
          <span className="text-lg font-bold text-medical-teal">SafeMeds</span>
        </Link>

        {/* Brand image — mobile only, compact banner above the form */}
        <div className="relative mb-6 h-40 w-full max-w-md overflow-hidden rounded-lg shadow-soft md:hidden">
          <Image
            src="/assets/images/hero-student.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-navy/80 via-dark-navy/10 to-transparent" />
          <p className="absolute bottom-3 left-4 right-4 text-sm font-semibold text-white">
            Private healthcare, built for students.
          </p>
        </div>

        <div className="w-full max-w-md rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card dark:bg-surface-container">
          <div className="mb-8 flex rounded-lg bg-surface-container-low p-1 dark:bg-surface-dark">
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => {
                  setUserType(role.value);
                  resetForm();
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-200 ${
                  userType === role.value
                    ? "bg-surface-container-lowest text-on-surface shadow-sm dark:bg-surface-container"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-headline-md text-on-surface">{formTitle}</h2>
            <p className="mt-2 text-on-surface-variant">{formSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {userType === "PHARMACY" ? (
              <Input
                label="Work Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="pharmacist@example.com"
                autoComplete="email"
                leadingIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
                error={errors.email}
              />
            ) : (
              <Input
                label="Username / Campus ID"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                leadingIcon={<User className="h-4 w-4" aria-hidden="true" />}
                error={errors.username}
              />
            )}

            {userType === "PHARMACY" && (
              <Input
                label="License Number"
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                placeholder="e.g. RPh-123456"
                autoComplete="off"
                hint="Must match the license number on your account."
                error={errors.licenseNumber}
              />
            )}

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              leadingIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
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

            {errors.general && (
              <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={buttonClasses({ variant: userType === "PHARMACY" ? "inverse" : "primary", size: "lg", fullWidth: true })}
            >
              {isLoading ? "Signing in…" : userType === "PHARMACY" ? "Access Portal" : "Sign In"}
            </button>
          </form>

          {/* Students only. A first-time Google sign-in provisions a CLIENT,
              so offering this under Pharmacy/Courier/Admin would quietly hand
              someone the wrong kind of account — and pharmacist access depends
              on a reviewed license number, which OAuth cannot attest to.
              Staff who already have an account still sign in with credentials. */}
          {userType === "CLIENT" && (
            <>
              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-outline-variant/60" aria-hidden="true" />
                <span className="text-sm text-on-surface-variant">or</span>
                <span className="h-px flex-1 bg-outline-variant/60" aria-hidden="true" />
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className={buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })}
              >
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-8 border-t border-outline-variant/60 pt-6 text-center">
            <p className="text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-medical-teal hover:text-soft-aqua dark:text-primary-fixed-dim">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <div className="absolute bottom-6">
          <Badge tone="neutral" icon={<Lock className="h-3.5 w-3.5" aria-hidden="true" />}>
            End-to-end encrypted. Privacy-first by design.
          </Badge>
        </div>
      </div>
    </div>
  );
}
