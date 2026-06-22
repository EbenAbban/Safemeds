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

    // Normalize inputs up front so validation, duplicate checks, and storage
    // all operate on the same canonical values.
    const usernameNorm = typeof username === "string" ? username.trim() : "";
    const emailNorm = typeof email === "string" ? email.trim().toLowerCase() : "";
    const roleNorm = typeof role === "string" ? role.trim().toUpperCase() : "";

    // Validate required fields
    if (!usernameNorm || !emailNorm || !password || !firstName || !lastName || !roleNorm) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Only clients and pharmacists may self-register. Admin accounts must never
    // be creatable through the public signup endpoint (privilege-escalation guard).
    const ALLOWED_SIGNUP_ROLES = ["CLIENT", "PHARMACY"];
    if (!ALLOWED_SIGNUP_ROLES.includes(roleNorm)) {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 }
      );
    }

    // Username & password policy — kept in sync with the login checks in
    // src/app/auth.ts so every account that can be created can also log in.
    if (usernameNorm.length < 3 || usernameNorm.length > 50) {
      return NextResponse.json(
        { error: "Username must be between 3 and 50 characters" },
        { status: 400 }
      );
    }
    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 6 and 128 characters" },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
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
    if (roleNorm === "PHARMACY") {
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
        OR: [{ username: usernameNorm }, { email: emailNorm }],
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
    if (roleNorm === "PHARMACY" && licenseNumber) {
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
        username: usernameNorm,
        email: emailNorm,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        // Safe: roleNorm is validated against ALLOWED_SIGNUP_ROLES above.
        role: roleNorm as "CLIENT" | "PHARMACY",
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
    // TEMPORARY DEBUG: surface the real error to diagnose the production 500.
    // Remove the `detail` field once the root cause is fixed.
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      },
      { status: 500 }
    );
  }
}

// GET method to check if email exists (for real-time validation)
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<
    { exists: boolean; available: boolean } | { error: string; detail?: string }
  >
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

    // Check if user exists using Prisma (emails are stored lowercased)
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    return NextResponse.json({
      exists: !!existingUser,
      available: !existingUser,
    });
  } catch (error: unknown) {
    console.error("Email check error:", error);
    // TEMPORARY DEBUG: surface the real error to diagnose the production 500.
    // Remove the `detail` field once the root cause is fixed.
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      },
      { status: 500 }
    );
  }
}
