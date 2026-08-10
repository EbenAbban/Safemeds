"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Common/Footer";
import LiquidEtherBackground from "@/components/effects/LiquidEtherBackground";
import LightTunnelBackground from "@/components/effects/LightTunnelBackground";
import ClickSpark from "@/components/effects/ClickSpark";
import {
  GraduationCap,
  Pill,
  ShieldCheck,
  Check,
  CheckCircle2,
  Lock,
  Stethoscope,
  Smartphone,
  Truck,
  MessageCircle,
  BarChart3,
  ArrowRight,
  Star,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Loading SafeMeds...
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Preparing your healthcare experience
          </p>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2} />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Welcome back, {user.name || user.username}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Redirecting to your {user.role.toLowerCase()} dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Public Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            SafeMeds
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              About
            </Link>
            <Link href="/consult" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Consult
            </Link>
            <Link href="/track" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Track
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Contact
            </Link>
            <Link
              href="/auth"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <div className="px-4 py-3 space-y-2">
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">About</Link>
                <Link href="/consult" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Consult</Link>
                <Link href="/track" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Track</Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Contact</Link>
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">Sign In</Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 text-center transition-colors">Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-24">
          {/* Ambient fluid backdrop, adapted from React Bits' LiquidEther —
              skipped automatically for prefers-reduced-motion users and
              loaded on demand so it never adds to the initial page JS. */}
          <LiquidEtherBackground
            wrapperClassName="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-60 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)]"
            colors={["#3b82f6", "#a855f7", "#ec4899"]}
            resolution={0.4}
            iterationsPoisson={16}
            mouseForce={16}
            cursorSize={90}
            autoDemo
            autoSpeed={0.4}
            autoIntensity={1.8}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative text-center px-4 sm:px-6 lg:px-8 py-16"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Healthcare,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                anonymized
              </span>
              .<br />
              For students.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Secure, anonymous healthcare consultations for students. Get
              professional medical advice from licensed pharmacists in a safe,
              confidential environment — all from your phone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all hover:shadow-lg"
              >
                Create Free Account
              </Link>
              <Link
                href="/consult"
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl font-semibold text-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors"
              >
                Start Anonymous Consult
              </Link>
            </div>
          </motion.div>
        </div>

        {/* User Type Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase mb-3">
            Three roles, one platform
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Built for how you use it
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-24"
        >
          {(
            [
              {
                type: "CLIENT",
                index: "01",
                title: "Students",
                Icon: GraduationCap,
                description: "Get anonymous medical consultations and advice from licensed pharmacists.",
                features: ["Anonymous consultations", "Secure messaging", "Prescription delivery", "24/7 support"],
                accent: "text-blue-600 dark:text-blue-400",
                gradient: "from-blue-500 to-blue-600",
                ring: "hover:border-blue-300 dark:hover:border-blue-700",
                glow: "bg-blue-500/20",
                spotlight: "rgba(59, 130, 246, 0.16)",
                href: "/signup",
                cta: "Get Started",
              },
              {
                type: "PHARMACY",
                index: "02",
                title: "Pharmacists",
                Icon: Pill,
                description: "Provide professional medical advice and consultations to students.",
                features: ["License verification", "Professional dashboard", "Consultation management", "Secure payments"],
                accent: "text-purple-600 dark:text-purple-400",
                gradient: "from-purple-500 to-purple-600",
                ring: "hover:border-purple-300 dark:hover:border-purple-700",
                glow: "bg-purple-500/20",
                spotlight: "rgba(168, 85, 247, 0.16)",
                href: "/signup",
                cta: "Get Started",
              },
              {
                type: "ADMIN",
                index: "03",
                title: "Administrators",
                Icon: ShieldCheck,
                description: "Manage the platform and oversee all operations and user activities.",
                features: ["System management", "User oversight", "Analytics dashboard", "Platform control"],
                accent: "text-red-600 dark:text-red-400",
                gradient: "from-red-500 to-red-600",
                ring: "hover:border-red-300 dark:hover:border-red-700",
                glow: "bg-red-500/20",
                spotlight: "rgba(239, 68, 68, 0.16)",
                href: "/auth",
                cta: "Admin Login",
              },
            ] as const
          ).map((card, index) => (
            <motion.div
              key={card.type}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              whileHover={{ y: -6 }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
                e.currentTarget.style.setProperty("--spotlight-color", card.spotlight);
              }}
              className={`rb-spotlight group relative overflow-hidden rounded-3xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 ${card.ring}`}
            >
              {/* Ambient glow blob */}
              <div
                className={`absolute -top-16 -right-16 w-40 h-40 rounded-full ${card.glow} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between mb-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300`}>
                  <card.Icon className="w-7 h-7 text-white" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <span className={`font-mono text-xs font-semibold tracking-widest ${card.accent} opacity-60`}>
                  {card.index}
                </span>
              </div>

              <h3 className="relative text-xl font-bold text-gray-900 dark:text-white mb-2">
                {card.title}
              </h3>
              <p className="relative text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                {card.description}
              </p>

              <ul className="relative space-y-2.5 mb-8">
                {card.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={card.href}
                className={`relative flex items-center justify-center gap-2 w-full bg-gradient-to-r ${card.gradient} text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-300`}
              >
                {card.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2} aria-hidden="true" />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-24"
        >
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Everything you need
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {(
              [
                {
                  Icon: Lock,
                  title: "Privacy First",
                  description: "All consultations are completely anonymous and encrypted for maximum privacy.",
                  tint: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
                },
                {
                  Icon: Stethoscope,
                  title: "Licensed Professionals",
                  description: "Only verified, licensed pharmacists can provide medical consultations.",
                  tint: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400",
                },
                {
                  Icon: Smartphone,
                  title: "Easy Access",
                  description: "Simple, intuitive interface accessible from any device, anywhere.",
                  tint: "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400",
                },
                {
                  Icon: Truck,
                  title: "Delivery Tracking",
                  description: "Real-time GPS tracking for prescription deliveries straight to your location.",
                  tint: "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400",
                },
                {
                  Icon: MessageCircle,
                  title: "Live Chat",
                  description: "Real-time messaging with pharmacists for immediate medical advice.",
                  tint: "bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400",
                },
                {
                  Icon: BarChart3,
                  title: "Health Analytics",
                  description: "Track your consultations, medications, and health trends over time.",
                  tint: "bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400",
                },
              ] as const
            ).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.tint}`}>
                  <feature.Icon className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Trusted by students
          </h2>

          {(() => {
            const testimonials = [
              {
                quote: "SafeMeds helped me get a prescription refill without leaving my dorm. The pharmacist was professional and the delivery was fast.",
                author: "Sarah K.",
                role: "Student, KNUST",
              },
              {
                quote: "I was nervous about asking for help, but the anonymous consultation made it easy. Highly recommend for anyone on campus.",
                author: "Michael O.",
                role: "Student, University of Ghana",
              },
              {
                quote: "As a pharmacist, SafeMeds lets me reach students who might otherwise avoid seeking care. The platform is intuitive and secure.",
                author: "Dr. Amma B.",
                role: "Licensed Pharmacist",
              },
              {
                quote: "Ordering a refill between classes used to mean skipping a lecture. Now I do it from the library and it shows up at my hall.",
                author: "Kwame A.",
                role: "Student, Legon",
              },
              {
                quote: "The chat felt like texting a friend who happens to be a pharmacist. No judgment, just clear answers.",
                author: "Priya N.",
                role: "Student, Ashesi University",
              },
              {
                quote: "License verification took minutes and the dashboard makes triaging consultations painless during a full shift.",
                author: "Dr. Kojo M.",
                role: "Licensed Pharmacist",
              },
              {
                quote: "Delivery tracking meant I wasn't stuck guessing when my order would show up. It arrived exactly on time.",
                author: "Ama D.",
                role: "Student, KNUST",
              },
              {
                quote: "As someone new to the city, not knowing a local pharmacy wasn't a barrier. SafeMeds connected me in minutes.",
                author: "Daniel O.",
                role: "Student, University of Ghana",
              },
            ];

            // Base pace scales with list length so the loop always reads at a
            // similar per-card speed, then sped up 1.9x per the requested pace.
            const MARQUEE_SPEED_MULTIPLIER = 1.9;
            const baseSecondsPerCard = 5;
            const durationSeconds = (testimonials.length * baseSecondsPerCard) / MARQUEE_SPEED_MULTIPLIER;

            return (
              <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
                <div
                  className="marquee-track flex w-max gap-6 px-4 sm:px-6 lg:px-8"
                  style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
                >
                  {[...testimonials, ...testimonials].map((testimonial, index) => (
                    <div
                      key={index}
                      className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                    >
                      <div className="flex gap-0.5 text-blue-500 mb-3" aria-label="5 out of 5 stars">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star key={starIndex} className="w-4 h-4 fill-current" aria-hidden="true" />
                        ))}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4 italic leading-relaxed">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {testimonial.author}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-12 text-center"
        >
          {/* Animated fibre-tunnel backdrop, adapted from React Bits —
              skipped for prefers-reduced-motion users. */}
          <LightTunnelBackground
            wrapperClassName="absolute inset-0 pointer-events-none opacity-70"
            cableColor="#c4b5fd"
            pulseColor="#ffffff"
            tunnelColor="#5227FF"
            tunnelOpacity={0}
            speed={0.15}
            flowDirection="outward"
            pulseSpeed={1.5}
            cableCount={16}
            mouseInteraction
            mouseStrength={0.08}
          />

          <ClickSpark sparkColor="#ffffff" sparkCount={10} sparkRadius={20} duration={500}>
            <div className="relative py-4">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of students who trust SafeMeds for their healthcare
                needs. Get professional medical advice in a safe, anonymous
                environment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
                >
                  Create Your Account
                </Link>
                <Link
                  href="/auth"
                  className="px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-400 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </ClickSpark>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
