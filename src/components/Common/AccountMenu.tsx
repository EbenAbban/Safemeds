"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * Account menu for the authenticated header.
 *
 * Replaces a filled red "Logout" pill that sat beside the user's full email
 * address. Three things were wrong with that:
 *
 *  - It was painted with the error role. Red is the colour of a destructive,
 *    hard-to-undo action; signing out is routine and reversible, so the button
 *    read as a warning and drew the eye away from the actual navigation.
 *  - It was the most prominent control in the header, for the least important
 *    action on the page.
 *  - It displayed the raw email on every screen, which is both visually
 *    unbalanced and more identity than a privacy-first product should put
 *    permanently on display.
 *
 * Identity now collapses into a single quiet trigger, and sign-out lives
 * inside the menu where destructive-adjacent actions belong.
 */
export default function AccountMenu({ userRole }: { userRole: string }) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  // Close on outside click and on Escape. A menu that can only be dismissed by
  // choosing something in it is a trap for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.name || user?.username || "Account";
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-container-high focus-visible:bg-surface-container-high"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-medical-teal text-sm font-semibold text-white dark:bg-primary dark:text-on-primary"
        >
          {initial}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-on-surface sm:block">
          {displayName}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-on-surface-variant transition-transform duration-200 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-floating dark:bg-surface-container"
        >
          <div className="border-b border-outline-variant/60 px-4 py-3">
            <p className="truncate text-sm font-medium text-on-surface">{displayName}</p>
            {user?.email && (
              <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
            )}
            <p className="mt-1 text-xs capitalize text-on-surface-variant">{userRole} account</p>
          </div>

          <div className="p-1">
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                router.push("/settings");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <SettingsIcon className="h-4 w-4" aria-hidden="true" />
              Settings
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                router.push("/client-dashboard");
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </button>
          </div>

          <div className="border-t border-outline-variant/60 p-1">
            <button
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:opacity-60"
            >
              {isLoggingOut ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
                  />
                  Signing out…
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
