"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BarChart3, Bell, ClipboardList, LayoutGrid, LogOut, Menu, Pill, Search, Settings, ShieldAlert, Stethoscope, Truck, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/components/ui";

/**
 * Shared authenticated shell for pharmacist-facing screens (dashboard,
 * inventory, consultation workspace) — SafeMeds Vital design system,
 * converted from the design system's fixed w-72 sidebar + top bar layout.
 *
 * Distinct from the public SiteHeader: this is an internal tool chrome for a
 * signed-in PHARMACY user, not the marketing site nav.
 */

const NAV_ITEMS = [
  // Every label names the page it actually opens. Previously "Prescriptions"
  // opened Medication Management and "Delivery" opened Order Management, and
  // four of these destinations rendered outside this shell entirely, so the
  // side panel vanished the moment you used it.
  { key: "consultations", label: "Consultations", href: "/inbox", Icon: Stethoscope },
  { key: "prescriptions", label: "Prescriptions", href: "/prescriptions", Icon: ClipboardList },
  { key: "medications", label: "Medications", href: "/medications", Icon: Pill },
  { key: "inventory", label: "Inventory", href: "/inventory", Icon: LayoutGrid },
  { key: "deliveries", label: "Deliveries", href: "/orders", Icon: Truck },
  { key: "staff", label: "Staff", href: "/staff-management", Icon: Users },
  { key: "analytics", label: "Analytics", href: "/analytics", Icon: BarChart3 },
] as const;

const GO_ONLINE_KEY = "safemeds:pharmacy-availability-preference";

function initialsFor(name?: string | null, username?: string | null): string {
  const source = name || username || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PharmacyShell({
  active,
  pageTitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  children,
}: {
  active: (typeof NAV_ITEMS)[number]["key"];
  pageTitle?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // A personal, session-local display preference — not shared with anyone,
  // not backed by a presence system. SafeMeds has no real-time "online" state
  // for staff, so this must not be presented as visible to patients or peers.
  const [goOnline, setGoOnline] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(GO_ONLINE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleGoOnline = () => {
    setGoOnline((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(GO_ONLINE_KEY, next ? "1" : "0");
      } catch {
        // Best effort — a failed write just means the preference resets next visit.
      }
      return next;
    });
  };

  const initials = initialsFor(user?.name, user?.username);

  const sidebarLinks = (
    <>
      <div className="mb-10 flex flex-col items-center px-2">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary-container bg-surface-container-high text-lg font-bold text-medical-teal shadow-soft dark:text-primary-fixed-dim">
          {initials}
        </div>
        <h2 className="text-center text-lg font-bold leading-tight text-primary dark:text-on-primary-container">
          SafeMeds Clinical
        </h2>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Authorized Professional
        </p>
      </div>

      <ul className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map(({ key, label, href, Icon }) => {
          const isActive = key === active;
          return (
            <li key={key}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-secondary-container font-bold text-on-secondary-container dark:bg-primary-container dark:text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-medical-teal dark:text-cool-gray"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-4 pt-6">
        <Link
          href="/contact"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-error-container py-3 text-sm font-semibold text-on-error-container shadow-soft transition-transform hover:scale-[1.02]"
        >
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          Urgent Support
        </Link>
        <div className="flex flex-col gap-1 border-t border-outline-variant/40 pt-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-medical-teal"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-medium text-on-surface-variant transition-colors hover:text-medical-teal"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark">
      {/* Desktop sidebar */}
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-outline-variant/30 bg-surface-container-low px-6 py-8 md:flex dark:bg-surface-dark">
        {sidebarLinks}
      </nav>

      {/* Mobile sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex h-full w-72 flex-col bg-surface-container-low px-6 py-8 dark:bg-surface-dark">
            {sidebarLinks}
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
            className="flex-1 bg-dark-navy/40"
          />
        </div>
      )}

      {/* Top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-4 shadow-sm backdrop-blur-md md:left-72 md:px-6 dark:bg-surface-dark/80">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-primary md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <span className="font-display text-lg font-black text-primary md:hidden dark:text-primary-fixed">
            SafeMeds
          </span>
          {pageTitle && (
            <span className="hidden text-sm text-on-surface-variant md:block">{pageTitle}</span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {onSearchChange && (
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
              <input
                type="text"
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder ?? "Search..."}
                className="w-64 rounded-full border-none bg-surface-container py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-soft-aqua"
              />
            </div>
          )}

          <div className="flex items-center gap-4 text-medical-teal dark:text-primary-fixed-dim">
            <Link href="/settings" className="transition-colors hover:text-soft-aqua" aria-label="Notifications">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={toggleGoOnline}
              aria-pressed={goOnline}
              title="Personal availability preference — not visible to patients or other staff"
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-bold transition-colors",
                goOnline
                  ? "bg-medical-teal text-white"
                  : "text-medical-teal hover:text-soft-aqua dark:text-primary-fixed-dim"
              )}
            >
              {goOnline ? "Online" : "Go Online"}
            </button>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-high text-xs font-bold text-medical-teal shadow-soft dark:text-primary-fixed-dim">
            {initials}
          </div>
        </div>
      </header>

      <main key={pathname} className="min-h-screen pt-16 md:ml-72">
        {children}
      </main>
    </div>
  );
}
