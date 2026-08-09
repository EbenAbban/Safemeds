import webpush, { WebPushError } from "web-push";
import { prisma } from "@/lib/prisma";
import { buildPushPayload, type PushIntent } from "@/lib/pwa/push-payload";
import { createNotification } from "@/lib/notifications";

// NOTE: web-push depends on Node crypto and cannot run on the Edge runtime.
// Every route that reaches this module must declare:
//   export const runtime = "nodejs";

let configured: boolean | null = null;

/** Configures VAPID once. Returns false when keys are absent, so a deployment
 *  without push keys degrades to in-app notifications instead of erroring. */
function ensureConfigured(): boolean {
  if (configured !== null) return configured;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    configured = false;
    return configured;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return configured;
}

export function isPushConfigured(): boolean {
  return ensureConfigured();
}

export interface SubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userId?: string | null;
  anonymousSessionId?: string | null;
  userAgent?: string | null;
}

/** Upserts on endpoint — re-subscribing the same browser must not create
 *  duplicate rows, and a device that later signs in should re-key to the user. */
export async function savePushSubscription(input: SubscriptionInput) {
  const data = {
    p256dh: input.p256dh,
    auth: input.auth,
    userId: input.userId ?? null,
    anonymousSessionId: input.anonymousSessionId ?? null,
    userAgent: input.userAgent ?? null,
    failureCount: 0,
  };

  return prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: { endpoint: input.endpoint, ...data },
    update: data,
  });
}

export async function deletePushSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function dispatch(subscriptions: StoredSubscription[], intent: PushIntent) {
  if (!ensureConfigured() || subscriptions.length === 0) return { sent: 0, pruned: 0 };

  const body = JSON.stringify(buildPushPayload(intent));
  let sent = 0;
  const dead: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
        sent += 1;
      } catch (error) {
        // 404/410 mean the browser dropped the subscription for good. Anything
        // else (timeout, 5xx) is transient and the row is left alone.
        const status = error instanceof WebPushError ? error.statusCode : undefined;
        if (status === 404 || status === 410) {
          dead.push(sub.endpoint);
        }
      }
    })
  );

  if (dead.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: dead } } });
  }

  return { sent, pruned: dead.length };
}

export async function sendPushToUser(userId: string, intent: PushIntent) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  return dispatch(subscriptions, intent);
}

/** Anonymous consultations have no user row, so their notifications key off
 *  the AnonymousSession id instead. */
export async function sendPushToAnonymousSession(anonymousSessionId: string, intent: PushIntent) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { anonymousSessionId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  return dispatch(subscriptions, intent);
}

/**
 * Writes the in-app notification and fires the push together, so the bell icon
 * and the device notification never disagree.
 *
 * `title` and `message` are stored in the database for in-app display only —
 * they are deliberately NOT forwarded to the push payload.
 */
/**
 * Tells the student a pharmacist replied.
 *
 * Handles both recipient shapes: a registered user gets an in-app notification
 * plus a push, while an anonymous consultation is reached through its
 * AnonymousSession (the consultation's own `anonymousId` is a different value
 * from the session id that push subscriptions are keyed on).
 *
 * Never throws — a notification failure must not fail the message that
 * triggered it.
 */
export async function notifyConsultationReply(consultationId: string) {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { id: true, userId: true },
    });
    if (!consultation) return;

    if (consultation.userId) {
      await notifyUserWithPush({
        userId: consultation.userId,
        title: "New message",
        message: "A pharmacist replied to your consultation.",
        type: "CONSULTATION",
        link: "/consultations",
        push: { kind: "consultation_reply", link: "/consultations", tag: `consultation:${consultation.id}` },
      });
      return;
    }

    const anonymous = await prisma.anonymousSession.findFirst({
      where: { consultationId: consultation.id },
      select: { sessionId: true, expiresAt: true },
    });
    if (!anonymous || anonymous.expiresAt < new Date()) return;

    await sendPushToAnonymousSession(anonymous.sessionId, {
      kind: "consultation_reply",
      link: "/consult",
      tag: `consultation:${consultation.id}`,
    });
  } catch {
    // Swallowed on purpose — see the doc comment.
  }
}

export async function notifyUserWithPush(params: {
  userId: string;
  title: string;
  message: string;
  type: "ORDER" | "CONSULTATION" | "DELIVERY" | "SYSTEM";
  link?: string;
  push: PushIntent;
}) {
  await createNotification({
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    link: params.link,
  });

  return sendPushToUser(params.userId, params.push);
}
