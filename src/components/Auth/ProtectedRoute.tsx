"use client";

import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  fallback,
}: ProtectedRouteProps) {
  const { isLoading, user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Handle role-based redirects in useEffect
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      user?.role &&
      allowedRoles.length > 0
    ) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        const dashboardPath =
          user.role === "ADMIN"
            ? "/admin"
            : user.role === "PHARMACY"
            ? "/pharmacy-dashboard"
            : user.role === "COURIER"
            ? "/courier-dashboard"
            : "/client-dashboard";
        router.push(dashboardPath);
      }
    }
  }, [isLoading, isAuthenticated, user?.role, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-soft-aqua border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-on-surface mb-2">
            Loading...
          </h2>
          <p className="text-on-surface-variant">Checking authentication status</p>
        </motion.div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-surface dark:bg-surface-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-floating p-8 max-w-md w-full text-center border border-outline-variant/60"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed/50 dark:bg-primary-container/40">
            <Lock className="h-7 w-7 text-medical-teal dark:text-primary-fixed-dim" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-3">
            Authentication Required
          </h1>
          <p className="text-on-surface-variant mb-6">
            Please log in to access this page.
          </p>
        </motion.div>
      </div>
    );
  }

  // Check if user has required role
  if (
    allowedRoles.length > 0 &&
    user?.role &&
    !allowedRoles.includes(user.role)
  ) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-surface dark:bg-surface-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-floating p-8 max-w-md w-full text-center border border-outline-variant/60"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-container/60">
            <ShieldAlert className="h-7 w-7 text-error" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-3">
            Access Denied
          </h1>
          <p className="text-on-surface-variant mb-6">
            You don&apos;t have permission to access this page.
            {allowedRoles.length > 0 && (
              <>
                {" "}
                This area is restricted to {allowedRoles.join(" or ")} users
                only.
              </>
            )}
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
