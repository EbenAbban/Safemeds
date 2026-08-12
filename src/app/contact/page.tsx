"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, MapPin, Phone, CheckCircle2 } from "lucide-react";
import SiteHeader from "@/components/Common/SiteHeader";
import Footer from "@/components/Common/Footer";
import { Button, Card, Container, Input, Section } from "@/components/ui";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark">
      <SiteHeader />

      <Section className="pb-0">
        <Container className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h1 className="text-hero text-on-surface">Contact Us</h1>
            <p className="mt-4 text-lg text-on-surface-variant">
              Have a question, concern, or feedback? We&apos;d love to hear from you.
            </p>
          </motion.div>

          <div className="mb-20 grid gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <Card>
                <h2 className="text-lg font-semibold text-on-surface">Get in touch</h2>
                <ul className="mt-4 space-y-4">
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-on-surface">Email</p>
                      <p className="text-sm text-on-surface-variant">support@safemeds.com</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-on-surface">Phone</p>
                      <p className="text-sm text-on-surface-variant">+233 50 123 4567</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-on-surface">Location</p>
                      <p className="text-sm text-on-surface-variant">KNUST, Kumasi, Ghana</p>
                    </div>
                  </li>
                </ul>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-on-surface">Need help now?</h2>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  For urgent medical concerns, please visit your nearest health
                  facility or call emergency services. SafeMeds is not a
                  replacement for emergency care.
                </p>
                <Link
                  href="/consult"
                  className="mt-4 inline-block text-sm font-medium text-medical-teal hover:underline dark:text-primary-fixed-dim"
                >
                  Start an anonymous consultation →
                </Link>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {sent ? (
                <Card className="text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-secondary" aria-hidden="true" />
                  <h2 className="mt-4 text-xl font-bold text-on-surface">Message sent!</h2>
                  <p className="mt-2 text-on-surface-variant">
                    We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="mt-6 text-sm font-medium text-medical-teal hover:underline dark:text-primary-fixed-dim"
                  >
                    Send another message
                  </button>
                </Card>
              ) : (
                <Card as="form" onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <Input
                    label="Subject"
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-base text-on-surface placeholder:text-on-surface-variant/60 focus:border-soft-aqua focus:outline-none focus:ring-2 focus:ring-soft-aqua dark:bg-surface-container"
                    />
                  </div>
                  {error && <p className="text-sm text-error">{error}</p>}
                  <Button type="submit" fullWidth>
                    Send Message
                  </Button>
                </Card>
              )}
            </motion.div>
          </div>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
