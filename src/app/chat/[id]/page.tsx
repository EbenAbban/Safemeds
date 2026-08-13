"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navigation from "@/components/Common/Navigation";
import ConsultationChat from "@/components/Chat/ConsultationChat";
import { useAuth } from "@/hooks/useAuth";
import { SlideUp } from "@/components/animations";

/**
 * A specific consultation thread, opened from /inbox, /track or a notification.
 *
 * The route param is a consultation id. It used to be a Firestore room id, which
 * is why a pharmacist opening a thread here saw a different conversation from
 * the one in their own inbox — both now read the same Postgres consultation.
 */
export default function ChatByIdPage() {
  const params = useParams();
  const consultationId = String(params?.id ?? "");
  const { user } = useAuth();
  const [anonymousId, setAnonymousId] = useState<string | null>(null);

  // Anonymous students reach their own thread with the credential this browser
  // stored at consultation time; signed-in users authorise by session instead.
  useEffect(() => {
    setAnonymousId(localStorage.getItem("anonymousId"));
  }, []);

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark">
      <Navigation
        title="Consultation"
        userRole={(user?.role?.toLowerCase() as "client" | "pharmacy" | "admin") || "client"}
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <SlideUp className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-soft dark:bg-surface-container">
          <ConsultationChat
            consultationId={consultationId}
            anonymousId={anonymousId}
            viewerIsPharmacist={user?.role === "PHARMACY"}
          />
        </SlideUp>
      </main>
    </div>
  );
}
