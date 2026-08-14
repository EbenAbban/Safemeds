"use client";

import { Reveal } from "@/components/animations";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Menu, Pill, ShieldCheck, Stethoscope, Truck, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "./NotificationBell";
import AccountMenu from "./AccountMenu";

interface NavigationProps {
  title: string;
  userRole: "client" | "pharmacy" | "admin" | "courier";
}

const ROLE_ICON = { client: GraduationCap, pharmacy: Pill, admin: ShieldCheck, courier: Truck } as const;

/**
 * Authenticated app-shell header — SafeMeds Vital design system.
 *
 * Shared by every internal CLIENT/PHARMACY/ADMIN page still on this
 * component. Previously each role had its own gradient identity color
 * (blue/purple/red). Dropped in favor of the single medical-teal identity —
 * the design brief explicitly warns against a "rainbow UI."
 */
export default function Navigation({ title, userRole }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const RoleIcon = ROLE_ICON[userRole];

  return (
    <nav className="border-b border-outline-variant/60 bg-surface-container-lowest shadow-soft dark:bg-surface-container">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Reveal variant="left" className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-medical-teal text-white">
              <RoleIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-on-surface">{title}</h1>
              <p className="text-sm text-on-surface-variant">Welcome, {user?.name || "User"}</p>
            </div>
          </Reveal>

          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => router.push("/about")} className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-medical-teal dark:hover:text-primary-fixed-dim">
              About
            </button>
            {userRole !== "courier" && (
              <>
                <button onClick={() => router.push("/chat")} className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-medical-teal dark:hover:text-primary-fixed-dim">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Chat
                </button>
                <button onClick={() => router.push("/delivery")} className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-medical-teal dark:hover:text-primary-fixed-dim">
                  <Truck className="h-4 w-4" aria-hidden="true" />
                  Delivery
                </button>
                <button onClick={() => router.push("/consult")} className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-medical-teal dark:hover:text-primary-fixed-dim">
                  <Stethoscope className="h-4 w-4" aria-hidden="true" />
                  Consult
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <AccountMenu userRole={userRole} />

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:hidden"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Height collapse without JS measurement: a 0fr/1fr grid row
            transitions to auto height, which plain `height: auto` cannot. */}
        <div
          aria-hidden={!isMenuOpen}
          className={`grid overflow-hidden transition-all duration-300 motion-reduce:transition-none md:hidden ${
            isMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
          <div className="space-y-1 border-t border-outline-variant/60 py-4">
            {userRole !== "courier" && (
              <>
                <button
                  onClick={() => { router.push("/chat"); setIsMenuOpen(false); }}
                  className="block w-full rounded-lg px-4 py-2 text-left text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  Chat with Pharmacist
                </button>
                <button
                  onClick={() => { router.push("/delivery"); setIsMenuOpen(false); }}
                  className="block w-full rounded-lg px-4 py-2 text-left text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  Track Delivery
                </button>
                <button
                  onClick={() => { router.push("/consult"); setIsMenuOpen(false); }}
                  className="block w-full rounded-lg px-4 py-2 text-left text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  Book Consultation
                </button>
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
