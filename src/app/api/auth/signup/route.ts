import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/utils/password";
import { prisma } from "@/lib/prisma";
import { LEGAL_VERSION } from "@/lib/legal";
import { rateLimit } from "@/lib/rateLimit";

// Import the license verification function from the dedicated API
async function verifyPharmacistLicense(
  licenseNumber: string,
  state: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/auth/verify-license`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ licenseNumber, state }),
      }
    );

    const data = await response.json();
    return data.isValid || false;
  } catch (error) {
    console.error("License verification error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = rateLimit(`signup:${ip}`, 5, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      licenseNumber,
      pharmacyName,
      address,
      city,
      state,
      zipCode,
      termsAccepted,
      termsVersion,
    } = body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Legal consent is mandatory — record acceptance server-side, never trust UI alone
    if (!termsAccepted) {
      return NextResponse.json(
        {
          error:
            "You must accept the Terms of Service, Privacy Policy, and HIPAA Statement to create an account",
        },
        { status: 400 }
      );
    }

    // Additional validation for pharmacists
    if (role === "PHARMACY") {
      if (!licenseNumber || !pharmacyName || !phone) {
        return NextResponse.json(
          {
            error:
              "License number, pharmacy name, and phone are required for pharmacists",
          },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    // Verify pharmacist license if applicable
    let isVerified = true;
    if (role === "PHARMACY" && licenseNumber) {
      try {
        isVerified = await verifyPharmacistLicense(
          licenseNumber,
          state || "NY"
        );
        if (!isVerified) {
          return NextResponse.json(
            {
              error:
                "Invalid pharmacist license number. Please verify your license information.",
            },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("License verification error:", error);
        return NextResponse.json(
          {
            error:
              "Unable to verify pharmacist license. Please try again later.",
          },
          { status: 500 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: role.toUpperCase(),
        phone: phone || null,
        licenseNumber: licenseNumber || null,
        pharmacyName: pharmacyName || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        isVerified,
        termsAcceptedAt: new Date(),
        termsVersion: termsVersion || LEGAL_VERSION,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        licenseNumber: true,
        pharmacyName: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        isVerified: true,
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          ...user,
          name: `${user.firstName} ${user.lastName}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET method to check if email exists (for real-time validation)
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<{ exists: boolean; available: boolean } | { error: string }>
> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Email validation helper
    function isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user exists using Prisma
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    return NextResponse.json({
      exists: !!existingUser,
      available: !existingUser,
    });
  } catch (error: unknown) {
    console.error("Email check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
