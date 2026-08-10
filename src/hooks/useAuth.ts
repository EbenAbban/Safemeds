"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isPublicRoute } from "@/lib/routes";

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

  // Handle redirects in useEffect to avoid render-time navigation.
  //
  // Only routes that actually require a session are bounced. This used to
  // exempt just /auth, /signup and /, which meant any public page calling this
  // hook (/about, /contact, /legal, /track…) threw signed-out visitors at the
  // sign-in screen even though the middleware served those routes happily.
  // Both now consult the same allowlist.
  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (!isPublicRoute(window.location.pathname)) {
      router.push("/auth");
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
