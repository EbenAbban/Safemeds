"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authState, setAuthState] = useState<{
    loading: boolean;
    unauthorized?: boolean;
    authorized?: boolean;
  }>({ loading: true });

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user;

  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/auth");
  };

  const requireAuth = (allowedRoles?: string[]) => {
    if (isLoading) {
      setAuthState({ loading: true });
      return { loading: true };
    }

    if (!isAuthenticated) {
      setAuthState({ loading: false, unauthorized: true });
      return { loading: false, unauthorized: true };
    }

    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
      setAuthState({ loading: false, unauthorized: true });
      return { loading: false, unauthorized: true };
    }

    setAuthState({ loading: false, authorized: true });
    return { loading: false, authorized: true };
  };

  // Handle redirects in useEffect to avoid render-time navigation
  // Only redirect if we're not already on the auth page to prevent loops
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/auth" && currentPath !== "/signup" && currentPath !== "/") {
        router.push("/auth");
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    requireAuth,
    session,
    authState,
  };
}
