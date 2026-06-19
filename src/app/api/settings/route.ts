import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import {
  SettingsService,
  SettingsUpdateData,
} from "@/services/settingsService";

// Helper function to get user ID from session
async function getUserIdFromSession(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

// GET endpoint to retrieve user settings
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userSettings = await SettingsService.getUserSettings(userId);

    // Transform to API response format
    const settings = {
      theme: userSettings.theme,
      language: userSettings.language,
      timezone: userSettings.timezone,
      dateFormat: userSettings.dateFormat,
      privacy: userSettings.privacy,
      delivery: userSettings.delivery,
      notifications: userSettings.notifications,
      security: userSettings.security,
      consultation: userSettings.consultation,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update user settings
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SettingsUpdateData = await request.json();

    // Validate required fields
    if (!body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    // Validate settings data
    const validation = SettingsService.validateSettings(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid settings data", details: validation.errors },
        { status: 400 }
      );
    }

    const updatedSettings = await SettingsService.updateUserSettings(
      userId,
      body
    );

    // Transform to API response format
    const responseSettings = {
      theme: updatedSettings.theme,
      language: updatedSettings.language,
      timezone: updatedSettings.timezone,
      dateFormat: updatedSettings.dateFormat,
      privacy: updatedSettings.privacy,
      delivery: updatedSettings.delivery,
      notifications: updatedSettings.notifications,
      security: updatedSettings.security,
      consultation: updatedSettings.consultation,
    };

    return NextResponse.json(responseSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to reset settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete existing settings (will be recreated with defaults on next GET)
    await SettingsService.resetUserSettings(userId);

    return NextResponse.json({ message: "Settings reset to defaults" });
  } catch (error) {
    console.error("Error resetting settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
