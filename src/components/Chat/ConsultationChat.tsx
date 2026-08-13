"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, Send, ShieldCheck } from "lucide-react";
import { ChatSkeleton, EmptyState, cn } from "@/components/ui";
import { MessageCircleOff } from "lucide-react";

/**
 * The single consultation chat surface, shared by the student and pharmacist
 * sides so both are reading and writing the same thread.
 *
 * This replaces the Firestore-backed ChatWindow on the student side. The two
 * sides previously used different backends — students wrote to Firestore rooms
 * keyed by a random localStorage id, pharmacists read Postgres consultations —
 * so neither could ever see the other's messages. Postgres wins because it is
 * the system of record and carries the consultation status and prescription
 * linkage the pharmacist panel needs; Firestore rooms carry none of that.
 *
 * It also keeps medical conversation content out of Firebase, which
 * ARCHITECTURE.md states holds no medical data — the Firestore chat had
 * quietly made that untrue.
 *
 * Delivery is polling rather than push. A pharmacist reply lands within one
 * interval, which is the right trade for a consultation: no socket to keep
 * alive on a serverless host, and it works identically for anonymous users.
 */

const POLL_INTERVAL_MS = 4000;

export interface ChatMessage {
  id: string;
  content: string;
  isFromPharmacist: boolean;
  createdAt: string;
  user?: { firstName?: string; lastName?: string; role?: string } | null;
}

interface ConsultationSummary {
  id: string;
  status?: string;
  assignedPharmacist?: { firstName?: string; lastName?: string } | null;
}

export default function ConsultationChat({
  consultationId,
  anonymousId,
  viewerIsPharmacist = false,
  className,
}: {
  consultationId: string;
  /** Present for anonymous students; authorises access without a session. */
  anonymousId?: string | null;
  viewerIsPharmacist?: boolean;
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [consultation, setConsultation] = useState<ConsultationSummary | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  const endpoint = useCallback(() => {
    const qs = anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : "";
    return `/api/chat/consultation/${consultationId}${qs}`;
  }, [consultationId, anonymousId]);

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      try {
        const res = await fetch(endpoint());
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const data = await res.json();
        setMessages(data.messages ?? []);
        setConsultation(data.consultation ?? null);
        setError("");
      } catch (e) {
        // A failed background poll must not wipe the transcript already on
        // screen — only surface the error when there is nothing to show.
        if (!opts.silent) setError(e instanceof Error ? e.message : "Could not load messages");
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Poll only while the tab is visible. A backgrounded consultation should not
  // keep waking the database every few seconds.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => (document.hidden ? stop() : (load({ silent: true }), start()));

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  // Follow new messages only if the reader is already at the bottom, so an
  // incoming reply doesn't yank them away from scrollback they're reading.
  useEffect(() => {
    if (atBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");
    try {
      const res = await fetch(endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Message failed to send");
      }
      atBottomRef.current = true;
      await load({ silent: true });
    } catch (e) {
      setInput(content); // restore so the text isn't lost
      setError(e instanceof Error ? e.message : "Message failed to send");
    } finally {
      setSending(false);
    }
  };

  const pharmacist = consultation?.assignedPharmacist;
  const pharmacistName = pharmacist
    ? `${pharmacist.firstName ?? ""} ${pharmacist.lastName ?? ""}`.trim()
    : null;

  return (
    <div className={cn("flex h-[32rem] flex-col md:h-[36rem]", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-outline-variant/60 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-5 w-5 shrink-0 text-medical-teal dark:text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">
              {pharmacistName ? `${pharmacistName}` : "Awaiting a pharmacist"}
            </p>
            <p className="truncate text-xs text-on-surface-variant">
              {pharmacistName
                ? "Licensed pharmacist"
                : "Your message is queued for the next available pharmacist"}
            </p>
          </div>
        </div>
        {consultation?.status && (
          <span className="shrink-0 rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface-variant">
            {consultation.status.replace(/_/g, " ").toLowerCase()}
          </span>
        )}
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="Consultation messages"
      >
        {loading ? (
          <ChatSkeleton messages={4} />
        ) : messages.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={MessageCircleOff}
            title="No messages yet"
            description={
              viewerIsPharmacist
                ? "This consultation has no messages. Send the first reply to open the conversation."
                : "Send a message to start the conversation. A licensed pharmacist will reply here."
            }
          />
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => {
              const mine = m.isFromPharmacist === viewerIsPharmacist;
              // Group consecutive messages from the same side: only the first
              // of a run carries the author label.
              const startsRun = i === 0 || messages[i - 1].isFromPharmacist !== m.isFromPharmacist;
              return (
                <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%]", mine ? "items-end" : "items-start")}>
                    {startsRun && (
                      <p
                        className={cn(
                          "mb-1 flex items-center gap-1 text-xs text-on-surface-variant",
                          mine && "justify-end"
                        )}
                      >
                        {m.isFromPharmacist && (
                          <BadgeCheck className="h-3.5 w-3.5 text-medical-teal dark:text-primary" aria-hidden="true" />
                        )}
                        {m.isFromPharmacist ? "Pharmacist" : "You"}
                      </p>
                    )}
                    <div
                      className={cn(
                        "rounded-xl px-4 py-2.5 text-sm",
                        mine
                          ? "bg-medical-teal text-white dark:bg-primary dark:text-on-primary"
                          : "bg-surface-container-high text-on-surface"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                    <time
                      dateTime={m.createdAt}
                      className={cn(
                        "mt-1 block text-[11px] text-on-surface-variant",
                        mine && "text-right"
                      )}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="border-t border-outline-variant/60 px-4 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="border-t border-outline-variant/60 p-3">
        <div className="flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Type your message…"
            className="max-h-32 min-h-11 flex-1 resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface placeholder:text-on-surface-variant focus:border-transparent focus:ring-2 focus:ring-soft-aqua dark:bg-surface-container-high"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-medical-teal px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-primary dark:text-on-primary"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{sending ? "Sending…" : "Send"}</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Press Enter to send, Shift+Enter for a new line.
        </p>
      </div>
    </div>
  );
}
