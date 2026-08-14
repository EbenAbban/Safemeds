"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, Truck, Stethoscope, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/animations";
import { buttonClasses } from "@/components/ui";
import MyPrescriptions from "@/components/Delivery/MyPrescriptions";

/**
 * Migrated off hand-rolled Framer props onto the shared motion primitives.
 * The previous markup repeated `initial/animate/transition={{ delay: 0 }}` on
 * every card, which meant: no reduced-motion handling, a delay of literally
 * zero, and entrances that played on mount rather than on scroll. The cards
 * now stagger in as a group.
 *
 * `whileHover={{ scale: 1.02 }}` was replaced with the `lift` utility from
 * globals.css — §43 rules out aggressive scaling in favour of a small
 * translateY, and `lift` is already reduced-motion gated in CSS, so hover
 * costs no JS at all.
 */

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Chat with Pharmacist",
    description:
      "Get instant consultation and medication advice from licensed pharmacists.",
    action: "Start Chat",
    href: "/chat",
  },
  {
    icon: Truck,
    title: "Track Deliveries",
    description:
      "Monitor your medication deliveries in real-time with live tracking.",
    action: "View Deliveries",
    href: "/delivery",
  },
  {
    icon: Stethoscope,
    title: "Consultations",
    description:
      "Schedule and manage your healthcare consultations with specialists.",
    action: "Book Consultation",
    href: "/consult",
  },
  {
    icon: SettingsIcon,
    title: "Settings",
    description: "Configure your account settings and preferences.",
    action: "Open Settings",
    href: "/settings",
  },
] as const;

export default function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["CLIENT"]}>
      <div className="min-h-screen bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high">
        <Navigation title="Client Dashboard" userRole="client" />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <SlideUp className="mb-8 rounded-2xl border border-primary-fixed bg-surface-container-lowest p-6 shadow-lg dark:border-outline-variant/40 dark:bg-surface-container">
            <h2 className="mb-2 text-xl font-semibold text-on-surface">
              Account Information
            </h2>
            <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              {[
                ["Name", user?.name],
                ["Email", user?.email],
                ["Username", user?.username],
                ["Role", user?.role],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="inline text-on-surface-variant">{label}:</dt>{" "}
                  <dd
                    className={`inline font-medium text-on-surface-variant${
                      label === "Role" ? " capitalize" : ""
                    }`}
                  >
                    {value || "N/A"}
                  </dd>
                </div>
              ))}
            </dl>
          </SlideUp>

          {/* Prescriptions waiting on the student. Above the feature cards
              because an unanswered prescription is the most actionable thing
              on this page — someone is waiting on them to accept it. */}
          <SlideUp className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-on-surface">Your prescriptions</h2>
            <MyPrescriptions />
          </SlideUp>

          <StaggerContainer
            count={FEATURES.length}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map(({ icon: Icon, title, description, action, href }) => (
              <StaggerItem
                key={href}
                className="lift rounded-xl border border-primary-fixed bg-surface-container-lowest p-6 shadow-lg dark:border-outline-variant/40 dark:bg-surface-container"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-fixed/60 text-medical-teal dark:bg-surface-container-high dark:text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mb-2 text-lg font-semibold text-on-surface">
                  {title}
                </h3>
                <p className="mb-4 text-sm text-on-surface-variant">{description}</p>
                <button
                  onClick={() => router.push(href)}
                  className={buttonClasses({ variant: "primary", size: "sm" })}
                >
                  {action}
                </button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </main>
      </div>
    </ProtectedRoute>
  );
}
