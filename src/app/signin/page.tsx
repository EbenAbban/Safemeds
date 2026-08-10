"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This route is kept only so old links/bookmarks don't 404 — the actual
// sign-in form lives at /auth, which every other entry point in the app
// (middleware, signup, signout) already points to.
export default function SigninRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth");
  }, [router]);

  return null;
}
