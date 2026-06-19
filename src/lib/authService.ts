import bcrypt from "bcrypt";
import { prisma } from "./prisma";
import { UserRole } from "./prisma-client";

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "CLIENT" | "PHARMACY";
  organization?: string;
  pharmacyName?: string;
  licenseNumber?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organization: string | null;
  pharmacyName: string | null;
  licenseNumber: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Password validation helper
function isValidPassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sign up with email and password
export const signUp = async (data: SignUpData): Promise<UserProfile> => {
  try {
    const { email, password, ...profileData } = data;

    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error("Please provide a valid email address");
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      throw new Error(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error("Unable to create account. Please check your information and try again.");
    }

    // Validate required fields based on role
    if (data.role === "CLIENT") {
      if (!data.organization?.trim()) {
        throw new Error("Organization name is required for client accounts");
      }
    } else if (data.role === "PHARMACY") {
      if (
        !data.pharmacyName?.trim() ||
        !data.licenseNumber?.trim() ||
        !data.address?.trim() ||
        !data.city?.trim() ||
        !data.state?.trim() ||
        !data.zipCode?.trim()
      ) {
        throw new Error(
          "All pharmacy information (name, license number, address, city, state, zip code) is required"
        );
      }

      // Validate license number format (basic validation)
      if (data.licenseNumber && data.licenseNumber.length < 5) {
        throw new Error("Please provide a valid license number");
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        username: email.toLowerCase().split("@")[0],
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        role: profileData.role,
        organization: profileData.organization?.trim(),
        pharmacyName: profileData.pharmacyName?.trim(),
        licenseNumber: profileData.licenseNumber?.trim(),
        phone: profileData.phone?.trim(),
        address: profileData.address?.trim(),
        city: profileData.city?.trim(),
        state: profileData.state?.trim(),
        zipCode: profileData.zipCode?.trim(),
        isVerified: false, // Should require email verification
      },
    });

    // Return user profile without password
    const { passwordHash: _, ...userProfile } = user;
    return userProfile;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create account");
  }
};

// Sign in with email and password
export const signIn = async (data: SignInData): Promise<UserProfile> => {
  try {
    const { email, password } = data;

    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error("Please provide a valid email address");
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isVerified) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Return user profile without password
    const { passwordHash: _, ...userProfile } = user;
    return userProfile;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to sign in");
  }
};

// Get user profile by ID
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Return user profile without password
    const { passwordHash: _, ...userProfile } = user;
    return userProfile;
  } catch (error: unknown) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Get user profile by email
export const getUserProfileByEmail = async (
  email: string
): Promise<UserProfile | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    // Return user profile without password
    const { passwordHash: _, ...userProfile } = user;
    return userProfile;
  } catch (error: unknown) {
    console.error("Error getting user profile by email:", error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<
    Omit<UserProfile, "id" | "email" | "createdAt" | "updatedAt">
  >
): Promise<UserProfile> => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // Return user profile without password
    const { passwordHash: _, ...userProfile } = user;
    return userProfile;
  } catch (_error: unknown) {
    throw new Error("Failed to update user profile");
  }
};

// Change password
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password
    if (!isValidPassword(newPassword)) {
      throw new Error(
        "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to change password");
  }
};

// Verify email
export const verifyEmail = async (userId: string): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  } catch (_error: unknown) {
    throw new Error("Failed to verify email");
  }
};

// Delete user account
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (_error: unknown) {
    throw new Error("Failed to delete user account");
  }
};

// Get all users (for admin purposes)
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Return user profiles without passwords
    return users.map(({ passwordHash: _, ...user }) => user);
  } catch (_error: unknown) {
    throw new Error("Failed to get users");
  }
};
