"use client";

import { SlideUp } from "@/components/animations";
import { useRouter } from "next/navigation";
import { Construction, ArrowLeft } from "lucide-react";
import { Card, buttonClasses } from "@/components/ui";

// Placeholder for features that are scaffolded in navigation but not yet built.
// Keeps links functional (no 404) and tells the user the state honestly.
export default function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4 dark:bg-surface-dark">
      <SlideUp className="w-full max-w-md">
        <Card radius="xl" className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container/40 text-medical-teal dark:text-primary-fixed-dim">
            <Construction className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-headline-md text-on-surface">{title}</h1>
          <p className="mt-2 text-on-surface-variant">
            {description || "This feature is on the roadmap and not built yet."}
          </p>
          <button onClick={() => router.back()} className={buttonClasses({ className: "mt-6" })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go back
          </button>
        </Card>
      </SlideUp>
    </div>
  );
}
