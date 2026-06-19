import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

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

    if (!session?.user && !anonymousId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find consultation
    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        OR: [
          { userId: session?.user?.id },
          { anonymousId: anonymousId || undefined },
        ],
      },
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

    if (!session?.user && !anonymousId) {
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
      where: {
        id: consultationId,
        OR: [
          { userId: session?.user?.id },
          { anonymousId: anonymousId || undefined },
        ],
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
