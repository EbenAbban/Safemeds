import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Create anonymous consultation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, description, symptoms, medications, allergies, age, gender } =
      body;

    // Validate required fields
    if (!type || !description) {
      return NextResponse.json(
        { error: "Type and description are required" },
        { status: 400 }
      );
    }

    // Generate anonymous ID and session ID
    const { randomUUID } = await import("crypto");
    const anonymousId = `anon_${Date.now()}_${randomUUID().slice(0, 9)}`;
    const sessionId = `session_${Date.now()}_${randomUUID().slice(0, 9)}`;

    // Create consultation
    const consultation = await prisma.consultation.create({
      data: {
        type,
        description,
        symptoms,
        medications,
        allergies,
        age: age ? parseInt(age) : null,
        gender,
        isAnonymous: true,
        anonymousId,
        status: "PENDING",
      },
    });

    // Create anonymous session
    const session = await prisma.anonymousSession.create({
      data: {
        sessionId,
        consultationId: consultation.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return NextResponse.json({
      consultation,
      sessionId: session.sessionId,
      anonymousId,
      message: "Anonymous consultation created successfully",
    });
  } catch (error) {
    console.error("Error creating anonymous consultation:", error);
    return NextResponse.json(
      { error: "Failed to create anonymous consultation" },
      { status: 500 }
    );
  }
}

// GET - Track anonymous consultation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Find session
    const session = await prisma.anonymousSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 410 });
    }

    // Fetch consultation with details separately
    const consultation = await prisma.consultation.findUnique({
      where: { id: session.consultationId! },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        prescriptions: {
          include: {
            medication: true,
            orders: {
              include: {
                delivery: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        consultation,
      },
    });
  } catch (error) {
    console.error("Error fetching anonymous consultation status:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultation status" },
      { status: 500 }
    );
  }
}
