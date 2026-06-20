import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import {
  StaffService,
  CreateStaffData,
} from "@/services/staffService";

// GET endpoint to retrieve all staff members
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
    const includeInactive = searchParams.get("includeInactive") === "true";

    const staff = await StaffService.getAllStaff(includeInactive);

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new staff member
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "PHARMACY"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateStaffData = await request.json();

    // Validate required fields
    if (!body.userId || !body.employeeId || !body.position || !body.department || !body.hireDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const staff = await StaffService.createStaff(body);

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
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