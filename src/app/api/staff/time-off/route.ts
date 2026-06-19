import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import {
  StaffService,
  CreateTimeOffRequestData,
} from "@/services/staffService";

// GET endpoint to retrieve time off requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "PHARMACY"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const status = searchParams.get("status");

    const timeOffRequests = await StaffService.getTimeOffRequests(
      staffId || undefined,
      status || undefined
    );

    return NextResponse.json(timeOffRequests);
  } catch (error) {
    console.error("Error fetching time off requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a time off request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "PHARMACY"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateTimeOffRequestData = await request.json();

    // Validate required fields
    if (!body.staffId || !body.startDate || !body.endDate || !body.reason || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    
    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 }
      );
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { error: "Start date cannot be in the past" },
        { status: 400 }
      );
    }

    const timeOffRequest = await StaffService.createTimeOffRequest(body);

    return NextResponse.json(timeOffRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating time off request:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 