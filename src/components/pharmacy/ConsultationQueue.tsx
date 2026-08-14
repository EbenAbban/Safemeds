"use client";

import { MessageSquare, Search } from "lucide-react";
import { Badge } from "@/components/ui";
import {
  ConsultationSummary,
  STATUS_LABEL,
  patientLabel,
  timeAgo,
} from "./consultationShared";

/**
 * The pharmacist's consultation queue.
 *
 * This used to be a narrow fixed sidebar pinned beside the open conversation,
 * which left both cramped. It is now the whole screen until a consultation is
 * opened, so the cards can breathe and show a usable preview of the last
 * message.
 */
export default function ConsultationQueue({
  consultations,
  loading,
  search,
  onSearchChange,
  onOpen,
}: {
  consultations: ConsultationSummary[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onOpen: (id: string) => void;
}) {
  const filtered = consultations.filter((c) => {
    if (!search.trim()) return true;
    const label = patientLabel(c).toLowerCase();
    return (
      label.includes(search.toLowerCase()) ||
      c.messages[0]?.content.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-headline-md text-on-surface">Active Consultations</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Open a consultation to read its thread and issue a prescription.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            aria-label="Search consultations"
            className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-low py-2 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-soft-aqua"
          />
        </div>
      </div>

      {loading && (
        <p className="p-8 text-center text-sm text-on-surface-variant">Loading queue…</p>
      )}
      {!loading && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-outline-variant/60 p-10 text-center text-sm text-on-surface-variant">
          {consultations.length === 0
            ? "No consultations yet."
            : "No consultations match that search."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const status = STATUS_LABEL[c.status];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpen(c.id)}
              className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card motion-reduce:transform-none dark:bg-surface-container"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-medical-teal dark:text-primary-fixed-dim">
                  {patientLabel(c)}
                </span>
                <span className="shrink-0 text-xs text-outline">
                  {c.messages[0] ? timeAgo(c.messages[0].createdAt) : timeAgo(c.createdAt)}
                </span>
              </div>
              <p className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm text-on-surface-variant">
                {c.messages[0]?.content ?? "No messages yet"}
              </p>
              <div className="flex items-center justify-between gap-2">
                <Badge tone={status.tone}>{status.label}</Badge>
                {/* Optional-chained on purpose: the message count is
                    decorative, and this is the first screen to read _count at
                    all. A malformed row should drop the badge, not take down
                    the pharmacist's whole queue. */}
                {(c._count?.messages ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-outline">
                    <MessageSquare className="h-3 w-3" aria-hidden="true" />
                    {c._count.messages}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
