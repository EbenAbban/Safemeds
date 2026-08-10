import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { savePushSubscription, isPushConfigured } from "@/services/push";

// web-push relies on Node crypto and cannot run on the Edge runtime.
export const runtime = "nodejs";

const SubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
  // Present when an anonymous consultation wants reply notifications without
  // an account.
  anonymousSessionId: z.string().min(1).max(128).optional(),
});

export async function POST(request: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push notifications are not configured" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`push-subscribe:${ip}`, 20, 60_000).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  let anonymousSessionId: string | null = null;
  if (!userId) {
    const candidate = parsed.data.anonymousSessionId;
    if (!candidate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The id arrives from the client, so it is verified against a live,
    // unexpired session rather than trusted — otherwise anyone could attach a
    // push endpoint to someone else's consultation and receive their alerts.
    const anonymousSession = await prisma.anonymousSession.findUnique({
      where: { sessionId: candidate },
      select: { sessionId: true, expiresAt: true },
    });

    if (!anonymousSession || anonymousSession.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    anonymousSessionId = anonymousSession.sessionId;
  }

  try {
    await savePushSubscription({
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userId,
      anonymousSessionId,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save subscription" }, { status: 500 });
  }
}
