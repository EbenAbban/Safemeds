"use client";

import { SlideUp } from "@/components/animations";
import { Lock, ShieldCheck, Smartphone } from "lucide-react";
import SiteHeader from "@/components/Common/SiteHeader";
import Footer from "@/components/Common/Footer";
import { ButtonLink, Card, Container, Section } from "@/components/ui";

const VALUES = [
  {
    Icon: Lock,
    title: "Privacy",
    description:
      "Every consultation is anonymous. No personal health data is ever linked to your identity without your explicit consent.",
  },
  {
    Icon: ShieldCheck,
    title: "Trust",
    description:
      "Every pharmacist on the platform is license-verified. We enforce strict professional standards.",
  },
  {
    Icon: Smartphone,
    title: "Access",
    description:
      "Designed for students. Mobile-first, works on any device, available 24/7 wherever you are.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark">
      <SiteHeader />

      <Section className="pb-0">
        <Container className="max-w-4xl">
          <SlideUp className="mb-16 text-center">
            <h1 className="text-hero text-on-surface">About SafeMeds</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-on-surface-variant">
              SafeMeds is a secure telepharmacy platform built for university
              students in Ghana. We connect students with licensed pharmacists
              for anonymous medical consultations, prescription management,
              and medication delivery.
            </p>
          </SlideUp>

          <SlideUp delay={0.1}>
            <Card radius="xl" className="mb-8">
              <h2 className="text-headline-md text-on-surface">Our Mission</h2>
              <p className="mt-4 leading-relaxed text-on-surface-variant">
                To make quality healthcare accessible to every student —
                privately, affordably, and without judgment. We believe that
                no student should skip medical care because of cost,
                inconvenience, or fear of stigma.
              </p>
            </Card>
          </SlideUp>

          <SlideUp delay={0.2}>
            <Card radius="xl" className="mb-8">
              <h2 className="text-headline-md text-on-surface">Our Story</h2>
              <p className="mt-4 leading-relaxed text-on-surface-variant">
                SafeMeds was born from a simple observation: university
                students often avoid seeking medical help due to long queues,
                limited campus clinic hours, or privacy concerns. At the same
                time, licensed pharmacists have the expertise to handle many
                common health concerns but lack a direct channel to reach
                students.
              </p>
              <p className="mt-4 leading-relaxed text-on-surface-variant">
                We built SafeMeds to bridge that gap — combining anonymous
                text-based consultations, e-prescriptions, and on-demand
                delivery into one seamless platform.
              </p>
            </Card>
          </SlideUp>

          <SlideUp className="mb-8 grid gap-6 md:grid-cols-3" delay={0.3}>
            {VALUES.map(({ Icon, title, description }) => (
              <Card key={title} radius="lg">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-fixed text-primary dark:bg-primary-container dark:text-on-primary-container">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {description}
                </p>
              </Card>
            ))}
          </SlideUp>

          <SlideUp className="pb-20 text-center" delay={0.4}>
            <ButtonLink href="/signup" size="lg">
              Join SafeMeds
            </ButtonLink>
          </SlideUp>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
