"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Footer from "@/components/Common/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            SafeMeds
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About SafeMeds
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            SafeMeds is a secure telepharmacy platform built for university
            students in Ghana. We connect students with licensed pharmacists for
            anonymous medical consultations, prescription management, and
            medication delivery.
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            To make quality healthcare accessible to every student — privately,
            affordably, and without judgment. We believe that no student should
            skip medical care because of cost, inconvenience, or fear of
            stigma.
          </p>
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Our Story
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            SafeMeds was born from a simple observation: university students
            often avoid seeking medical help due to long queues, limited campus
            clinic hours, or privacy concerns. At the same time, licensed
            pharmacists have the expertise to handle many common health
            concerns but lack a direct channel to reach students.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We built SafeMeds to bridge that gap — combining anonymous
            text-based consultations, e-prescriptions, and on-demand delivery
            into one seamless platform.
          </p>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          {[
            {
              icon: "🔒",
              title: "Privacy",
              description: "Every consultation is anonymous. No personal health data is ever linked to your identity without your explicit consent."
            },
            {
              icon: "✅",
              title: "Trust",
              description: "Every pharmacist on the platform is license-verified. We enforce strict professional standards."
            },
            {
              icon: "🌍",
              title: "Access",
              description: "Designed for students. Mobile-first, works on any device, available 24/7 wherever you are."
            }
          ].map((value, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="text-3xl mb-3">{value.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {value.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all hover:shadow-lg"
          >
            Join SafeMeds
          </Link>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
