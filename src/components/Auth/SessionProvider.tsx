"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
  /**
   * Resolved on the server in the root layout and handed down.
   *
   * Without this the client starts every page load with no session, reports
   * status "loading", and fetches /api/auth/session before it can say who the
   * user is. Every guarded page rendered a full-screen spinner for the length
   * of that round trip — the "loading symbol" on each navigation. With the
   * session already in hand the first paint is authenticated and no spinner
   * appears at all.
   */
  session: Session | null;
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      session={session}
      // Don't re-fetch the session every time the tab regains focus. It is a
      // 24h JWT; refetching on focus caused a fresh "loading" state, and so a
      // fresh spinner, every time the user alt-tabbed back.
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
