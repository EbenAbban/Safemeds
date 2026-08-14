"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Image from "next/image";
import SiteHeader from "@/components/Common/SiteHeader";
import Footer from "@/components/Common/Footer";
import { DROP_POINTS } from "@/lib/dropPoints";
import {
  Accordion,
  Badge,
  ButtonLink,
  Card,
  Container,
  CountUp,
  Section,
  SectionHeading,
} from "@/components/ui";
import {
  ArrowRight,
  Check,
  Clock3,
  EyeOff,
  GraduationCap,
  Lock,
  MapPin,
  MessageCircle,
  Pill,
  ShieldCheck,
  Stethoscope,
  Truck,
} from "lucide-react";

/**
 * The public landing page.
 *
 * Redesigned against docs/superpowers (SafeMeds Vital design system).
 * Structure — utility bar, header, hero, trust rail, footer — follows the
 * design system's hero mockup exactly, including its hero photo and
 * pharmacist portrait (the design tool's own generated assets, no
 * third-party stock-agency branding — unlike the Getty-watermarked clip
 * removed from the previous version of this page). Sections the mockup
 * doesn't cover (stats, services, the anonymous-flow timeline, FAQ) follow
 * design.md's fuller spec instead, composed the same way as the rest of
 * this redesign: real data only, nothing fabricated. Two departures from
 * the pre-redesign version, both required rather than optional polish:
 *
 * 1. No testimonials with invented names and quotes, and no "thousands of
 *    students trust us" claim — SafeMeds has no real testimonial data yet.
 *    The brief is explicit: "Never fabricate claims and present them as real
 *    patient experiences." The section below is replaced with an honest
 *    "built on" panel instead of a faked social-proof carousel.
 * 2. No hero video — see the Getty note above.
 */

const TRUST_ITEMS = [
  { Icon: EyeOff, label: "Anonymous by Design" },
  { Icon: Stethoscope, label: "Licensed Pharmacists" },
  { Icon: Lock, label: "Secure & Encrypted" },
  { Icon: GraduationCap, label: "Campus Focused" },
] as const;

const SERVICES = [
  {
    Icon: MessageCircle,
    title: "Anonymous Consultation",
    description: "Describe your concern and reach a licensed pharmacist without creating an account.",
    href: "/consult",
    cta: "Start a consultation",
    featured: true,
  },
  {
    Icon: Pill,
    title: "Prescription Management",
    description: "Track prescriptions issued by your pharmacist from request through to pickup.",
    href: "/medications",
    cta: "View medications",
    featured: false,
  },
  {
    Icon: Truck,
    title: "Campus Delivery",
    description: "Prescriptions delivered to real campus drop points, with live status once dispatched.",
    href: "/delivery",
    cta: "See delivery",
    featured: false,
  },
  {
    Icon: MapPin,
    title: "Track a Consultation",
    description: "Anonymous sessions stay reachable for 7 days using only your session code — no login.",
    href: "/track",
    cta: "Track now",
    featured: false,
  },
] as const;

const CONSULT_STEPS = [
  { title: "Start a consultation", description: "No account, no personal details required to begin." },
  { title: "Describe your concern", description: "Share symptoms in your own words, in a private chat." },
  { title: "Connect with a pharmacist", description: "A license-verified pharmacist reviews your case." },
  { title: "Receive guidance", description: "Get advice, and a prescription if one is appropriate." },
  { title: "Track your session", description: "Return anytime within 7 days using your session code." },
] as const;

const DELIVERY_STEPS = [
  "Order Confirmed",
  "Processing",
  "Packaged",
  "In Transit",
  "Out for Delivery",
  "Delivered",
] as const;

const FAQ_ITEMS = [
  {
    question: "How anonymous is SafeMeds?",
    answer:
      "Anonymous consultations are never linked to a name, email, or account. The system stores an opaque session code instead of your identity — there is no record that connects the two.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. You can start, continue, and track a consultation for 7 days using only the session code you're given — no sign-up required.",
  },
  {
    question: "Who can see my consultation?",
    answer:
      "Only the pharmacist assigned to your consultation. Anonymous sessions carry no name or contact details for them to see in the first place.",
  },
  {
    question: "How do prescriptions work?",
    answer:
      "If your pharmacist determines a prescription is appropriate, it's issued directly to your consultation and can be fulfilled through campus delivery or pickup.",
  },
  {
    question: "How does delivery work?",
    answer:
      "Prescriptions are routed to real campus drop points. Once your order ships, you can follow its status — confirmed, packaged, in transit, delivered — from the tracking page.",
  },
  {
    question: "What happens to anonymous consultations after 7 days?",
    answer:
      "Anonymous sessions expire automatically 7 days after creation. After that, the session code no longer works and the conversation can't be reopened.",
  },
] as const;

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [showConsultCta, setShowConsultCta] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        const dashboardPath =
          user.role === "CLIENT"
            ? "/client-dashboard"
            : user.role === "PHARMACY"
            ? "/pharmacy-dashboard"
            : user.role === "ADMIN"
            ? "/admin"
            : "/auth";
        router.push(dashboardPath);
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Deferred, purely cosmetic — avoids a layout thrash from doing it inline.
  useEffect(() => {
    setShowConsultCta(true);
  }, []);

  // No loading or "redirecting" interstitial.
  //
  // Signed-in visitors are redirected to their dashboard by middleware before
  // this component renders at all, so the authenticated branch that used to
  // live here is unreachable by design. Everyone else gets the landing page
  // immediately — previously they waited behind a full-screen spinner while
  // the session resolved, for a page that does not need a session to render.

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark">
      <SiteHeader />

      {/* Hero — matches the design system's hero mockup exactly: full-bleed
          photo behind the copy, faded into the page background so text stays
          legible, rather than the WebGL backdrop used elsewhere in this
          redesign. Image is the design system's own generated asset (no
          third-party stock-agency branding), not a hotlinked external URL. */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/images/hero-student.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-right opacity-90 md:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent dark:from-surface-dark dark:via-surface-dark/80" />
        </div>

        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <Badge tone="primary" className="mb-6">
              Anonymous-first care
            </Badge>
            <h1 className="text-hero text-dark-navy dark:text-on-surface">
              Private healthcare,
              <br />
              built for students.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-surface-variant">
              Confidential telepharmacy and secure campus delivery. Get the
              care you need without compromising your privacy.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <ButtonLink href="/consult" size="lg">
                Start Anonymous Consultation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="#how-it-works" variant="secondary" size="lg">
                How it works
              </ButtonLink>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Trust rail */}
      <section className="border-y border-outline-variant/60 bg-surface-container-lowest dark:bg-surface-dark">
        <Container className="flex flex-wrap items-center justify-between gap-8 py-8 md:gap-4">
          {TRUST_ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-soft-aqua" aria-hidden="true" />
              <span className="text-sm font-medium text-on-surface-variant">{label}</span>
            </div>
          ))}
        </Container>
      </section>

      {/* What SafeMeds is built on — real, verifiable facts, not vanity metrics.
          Per the design brief: "Do NOT fabricate numbers... If no real number
          exists, display meaningful labels without fake statistics." */}
      <Section>
        <Container>
          <div className="grid gap-6 sm:grid-cols-3">
            <Card radius="xl" className="text-center">
              <div className="text-headline-lg text-medical-teal dark:text-primary-fixed-dim">
                <CountUp value={DROP_POINTS.length} />
              </div>
              <p className="mt-2 text-sm font-medium text-on-surface-variant">Real campus drop points</p>
            </Card>
            <Card radius="xl" className="text-center">
              <div className="text-headline-lg text-medical-teal dark:text-primary-fixed-dim">
                <CountUp value={7} />
                <span className="text-2xl">d</span>
              </div>
              <p className="mt-2 text-sm font-medium text-on-surface-variant">Anonymous session validity</p>
            </Card>
            <Card radius="xl" className="text-center">
              <div className="text-headline-lg text-medical-teal dark:text-primary-fixed-dim">0</div>
              <p className="mt-2 text-sm font-medium text-on-surface-variant">Consultations linked to your identity, ever</p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* About */}
      <Section className="bg-surface-container-low dark:bg-surface-container">
        <Container>
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary-fixed/40 to-transparent blur-2xl dark:from-primary-container/30" />
              <div className="relative overflow-hidden rounded-xl shadow-card">
                <Image
                  src="/assets/images/pharmacist-portrait.png"
                  alt="A licensed pharmacist in a campus pharmacy"
                  width={800}
                  height={900}
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Floating info card, per design.md's "small floating information
                  card" — real claim, not a stat. */}
              <Card radius="lg" className="absolute -bottom-6 -right-4 w-56 sm:-right-8">
                <ShieldCheck className="h-6 w-6 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-on-surface">Session-based, not identity-based</p>
                <p className="mt-1 text-xs text-on-surface-variant">Nothing traces back to you.</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-medical-teal dark:text-primary-fixed-dim">
                About SafeMeds
              </span>
              <h2 className="mt-3 text-headline-lg text-on-surface">
                Healthcare that doesn&apos;t require you to explain yourself twice.
              </h2>
              <p className="mt-4 leading-relaxed text-on-surface-variant">
                SafeMeds connects students to licensed pharmacists for private,
                text-based consultations — with no queue, no waiting room, and
                no requirement to share who you are.
              </p>
              <ul className="mt-6 space-y-3">
                {["Anonymous consultations", "Licensed pharmacist support", "Private messaging", "Prescription management", "Campus delivery tracking"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3 text-on-surface">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                      </span>
                      {item}
                    </li>
                  )
                )}
              </ul>
              <ButtonLink href="/about" variant="ghost" className="mt-8 px-0">
                Read our story
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Services */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Platform"
            title="Everything you need to manage your health"
            description="Every feature below connects to the real, working SafeMeds platform — not a preview."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ Icon, title, description, href, cta, featured }) => (
              <Card
                key={title}
                interactive
                radius="xl"
                className={featured ? "lg:col-span-2 lg:row-span-1 bg-primary-fixed/40 dark:bg-primary-container/20" : ""}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-medical-teal text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-on-surface">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
                <Link
                  href={href}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-medical-teal transition-transform hover:translate-x-0.5 dark:text-primary-fixed-dim"
                >
                  {cta}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Anonymous consultation flow */}
      <Section id="how-it-works" className="bg-dark-navy dark:bg-surface-dim/5">
        <Container>
          <SectionHeading
            eyebrow="The anonymous flow"
            title={<span className="text-white">You don&apos;t need to reveal who you are to ask for help.</span>}
            description={<span className="text-cool-gray">Five steps, no account, start to finish inside one private chat.</span>}
          />

          <div className="mt-14 grid gap-6 md:grid-cols-5">
            {CONSULT_STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="relative"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-soft-aqua text-sm font-bold text-dark-navy">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cool-gray">{step.description}</p>
              </motion.div>
            ))}
          </div>

          {showConsultCta && (
            <div className="mt-12 text-center">
              <ButtonLink href="/consult" variant="inverse" size="lg">
                Start Anonymous Consultation
              </ButtonLink>
            </div>
          )}
        </Container>
      </Section>

      {/* Delivery */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Delivery"
            title="From pharmacy to your campus drop point"
            description="Real delivery states from the SafeMeds backend — tracking appears automatically once your order ships."
          />

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-2 gap-y-6">
            {DELIVERY_STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-sm font-semibold text-on-surface-variant dark:bg-surface-container-highest">
                    {index + 1}
                  </div>
                  <span className="w-24 text-xs font-medium text-on-surface-variant">{step}</span>
                </div>
                {index < DELIVERY_STEPS.length - 1 && (
                  <div className="h-px w-6 shrink-0 bg-outline-variant sm:w-10" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <ButtonLink href="/track" variant="secondary">
              Track a delivery
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* Built on — replaces fabricated testimonials. No invented quotes, no
          invented user counts; see the file-level comment for why. */}
      <Section className="bg-surface-container-low dark:bg-surface-container">
        <Container>
          <SectionHeading eyebrow="Built with intent" title="Built on privacy, not on promises" />
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            <Card radius="xl">
              <Lock className="h-6 w-6 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-on-surface">Session-based identity</h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                Anonymous consultations are tracked by an opaque session code —
                never a name, email, or account.
              </p>
            </Card>
            <Card radius="xl">
              <ShieldCheck className="h-6 w-6 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-on-surface">License-verified pharmacists</h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                Every pharmacist account goes through a license verification
                review before it can respond to consultations.
              </p>
            </Card>
            <Card radius="xl">
              <Clock3 className="h-6 w-6 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-on-surface">Sessions expire on their own</h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                Anonymous sessions self-expire 7 days after creation — there&apos;s
                nothing left to look back at afterward.
              </p>
            </Card>
            <Card radius="xl">
              <MapPin className="h-6 w-6 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-on-surface">Real campus infrastructure</h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                Delivery routes to actual campus drop points — not a generic
                shipping address.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
          <div className="mt-10">
            <Accordion items={FAQ_ITEMS} />
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="rounded-xl bg-medical-teal px-8 py-16 text-center dark:bg-primary-container"
          >
            <h2 className="text-headline-lg text-white">Need help with your health?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Start a private consultation with a licensed pharmacist — no
              account, no waiting room, no judgment.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <ButtonLink href="/consult" variant="inverse" size="lg">
                Start Anonymous Consultation
              </ButtonLink>
              <ButtonLink
                href="/auth"
                size="lg"
                className="border border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                Sign In
              </ButtonLink>
            </div>
          </motion.div>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
