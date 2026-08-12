import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/prisma-client";
import type { Session } from "next-auth";
import { auth } from "@/app/auth";
import { notifyConsultationReply } from "@/services/push";

// web-push (reached via notifyConsultationReply) needs Node crypto.
export const runtime = "nodejs";

/**
 * Builds the ownership/access filter for a consultation lookup.
 *
 * CRITICAL: never write `{ userId: session?.user?.id }` or
 * `{ anonymousId: anonymousId || undefined }` directly into a `where` clause.
 * Prisma treats an `undefined` field value as "omit this filter", not "match
 * nothing" — so `{ userId: undefined }` silently becomes `{}`, an
 * unconditional match. The code this replaced did exactly that inside an OR,
 * which meant an unauthenticated request with no query params matched
 * `OR: [{}, {}]` and returned ANY consultation's full private message
 * history to anyone who could guess or obtain its id — a full auth bypass on
 * the one thing this product exists to protect. Returns `null` when no
 * legitimate identity was presented at all, which callers must treat as a
 * hard deny rather than fall through to an unfiltered lookup.
 */
function buildConsultationAccessWhere(
  session: Session | null,
  anonymousId: string | null
): Prisma.ConsultationWhereInput | null {
  if (session?.user?.role === "PHARMACY") {
    return { OR: [{ assignedPharmacistId: session.user.id }, { assignedPharmacistId: null }] };
  }
  if (session?.user?.id) {
    return { userId: session.user.id };
  }
  if (anonymousId) {
    return { anonymousId };
  }
  return null;
}

// GET - Fetch consultation chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> }
) {
  try {
    const { consultationId } = await params;
    const { searchParams } = new URL(request.url);
    const anonymousId = searchParams.get("anonymousId");
    const session = await auth();

    const accessWhere = buildConsultationAccessWhere(session, anonymousId);
    if (!accessWhere) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find consultation
    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, ...accessWhere },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedPharmacist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Check access permissions for pharmacists
    if (session?.user?.role === "PHARMACY") {
      if (
        consultation.assignedPharmacistId !== session.user.id &&
        !consultation.assignedPharmacistId
      ) {
        // Auto-assign pharmacist if not assigned
        await prisma.consultation.update({
          where: { id: consultation.id },
          data: { assignedPharmacistId: session.user.id },
        });
        consultation.assignedPharmacistId = session.user.id;
        const pharmacistUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, firstName: true, lastName: true },
        });
        if (pharmacistUser) {
          consultation.assignedPharmacist = pharmacistUser;
        }
      } else if (consultation.assignedPharmacistId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: {
        chatId: consultationId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      consultation,
      messages,
    });
  } catch (error) {
    console.error("Error fetching consultation messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send message in consultation chat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> }
) {
  try {
    const { consultationId } = await params;
    const { searchParams } = new URL(request.url);
    const anonymousId = searchParams.get("anonymousId");
    const session = await auth();

    const accessWhere = buildConsultationAccessWhere(session, anonymousId);
    if (!accessWhere) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, type = "TEXT" } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Find consultation
    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, ...accessWhere },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Check access permissions for pharmacists
    if (session?.user?.role === "PHARMACY") {
      if (
        consultation.assignedPharmacistId !== session.user.id &&
        !consultation.assignedPharmacistId
      ) {
        // Auto-assign pharmacist if not assigned
        await prisma.consultation.update({
          where: { id: consultation.id },
          data: {
            assignedPharmacistId: session.user.id,
            status: "IN_PROGRESS",
          },
        });
      } else if (consultation.assignedPharmacistId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId: consultationId,
        userId: session?.user?.id,
        anonymousId: anonymousId || undefined,
        content: content.trim(),
        type,
        isFromPharmacist: session?.user?.role === "PHARMACY",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Update consultation status if it's the first message from pharmacist
    if (
      session?.user?.role === "PHARMACY" &&
      consultation.status === "PENDING"
    ) {
      await prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Only a pharmacist's reply is worth interrupting someone's day for. Awaited
    // rather than fire-and-forget because serverless functions can be frozen
    // the moment the response is returned, dropping the in-flight send.
    if (session?.user?.role === "PHARMACY") {
      await notifyConsultationReply(consultation.id);
    }

    return NextResponse.json({
      message,
      consultation: {
        id: consultation.id,
        status:
          session?.user?.role === "PHARMACY"
            ? "IN_PROGRESS"
            : consultation.status,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
