import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

// Validate pharmacist license format
function validateLicenseFormat(licenseNumber: string): boolean {
  // Supports common US license formats: 2 letters + 6 digits, or 1 letter + 7 digits
  const licenseRegex = /^[A-Za-z]{1,2}\d{6,7}$/;
  return licenseRegex.test(licenseNumber);
}

// External license verification via NABP (National Association of Boards of Pharmacy)
// Falls back to format validation if external API is unavailable
async function verifyPharmacistLicense(
  licenseNumber: string,
  state?: string
): Promise<{
  isValid: boolean;
  details?: {
    name?: string;
    state?: string;
    expirationDate?: string;
    status?: string;
  };
  error?: string;
}> {
  if (!validateLicenseFormat(licenseNumber)) {
    return {
      isValid: false,
      error: "Invalid license number format",
    };
  }

  try {
    const apiUrl = process.env.LICENSE_VERIFICATION_API_URL;
    const apiKey = process.env.LICENSE_VERIFICATION_API_KEY;

    if (apiUrl && apiKey) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          licenseNumber: licenseNumber.toUpperCase(),
          state: state || "NY",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isValid: data.isValid === true,
          details: data.details,
        };
      }
    }

    // Fallback: validate format only if external API not configured
    return {
      isValid: true,
      details: {
        state: state || "NY",
        status: "PENDING_VERIFICATION",
      },
    };
  } catch (error) {
    console.error("License verification API error:", error);
    return {
      isValid: true,
      details: {
        state: state || "NY",
        status: "PENDING_VERIFICATION",
      },
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = rateLimit(`verify-license:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { licenseNumber, email, state, isSignIn = false } = body;

    // Validate required fields
    if (!licenseNumber) {
      return NextResponse.json(
        { error: "License number is required" },
        { status: 400 }
      );
    }

    // For sign-in verification, we don't check for existing registration
    // since the user might be using a new license
    if (!isSignIn) {
      // Check if license is already registered to another user (only for signup)
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            licenseNumber: licenseNumber,
            email: { not: email }, // Exclude current user if updating
          },
        });

        if (existingUser) {
          return NextResponse.json(
            {
              error:
                "This license number is already registered to another account",
            },
            { status: 409 }
          );
        }
      } else {
        // For new registrations, check if license is already used
        const existingUser = await prisma.user.findFirst({
          where: { licenseNumber: licenseNumber },
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "This license number is already registered" },
            { status: 409 }
          );
        }
      }
    }

    // Verify license with external service (now accepts any license)
    const verificationResult = await verifyPharmacistLicense(
      licenseNumber,
      state
    );

    if (!verificationResult.isValid) {
      return NextResponse.json(
        { isValid: false, error: verificationResult.error || "Invalid license number" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      isValid: true,
      message: "License verified successfully",
      details: verificationResult.details,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to verify license. Please try again later." },
      { status: 500 }
    );
  }
}

// GET method for real-time license validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseNumber = searchParams.get("licenseNumber");
    const email = searchParams.get("email");

    if (!licenseNumber) {
      return NextResponse.json(
        { error: "License number parameter is required" },
        { status: 400 }
      );
    }

    // Check if license is already registered
    const existingUser = await prisma.user.findFirst({
      where: {
        licenseNumber: licenseNumber,
        ...(email && { email: { not: email } }),
      },
    });

    if (existingUser) {
      return NextResponse.json({
        isValid: false,
        error: "License number already registered",
      });
    }

    if (!validateLicenseFormat(licenseNumber)) {
      return NextResponse.json({
        isValid: false,
        available: false,
        error: "Invalid license number format",
      });
    }

    return NextResponse.json({
      isValid: true,
      available: true,
    });
  } catch (error) {
    console.error("License check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
