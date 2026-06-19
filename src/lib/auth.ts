import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "pharmacy";
  organization?: string;
  pharmacyName?: string;
  licenseNumber?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: Date;
  isVerified: boolean;
  permissions: string[];
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "client" | "pharmacy";
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

// Sign up with email and password
export const signUp = async (data: SignUpData): Promise<UserCredential> => {
  try {
    const { email, password } = data;

    // Create user with Firebase Auth (normalize email to lowercase)
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.toLowerCase(),
      password
    );
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, {
      displayName: `${data.firstName} ${data.lastName}`,
    });

    // Send email verification
    await sendEmailVerification(user);

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      organization: data.organization,
      pharmacyName: data.pharmacyName,
      licenseNumber: data.licenseNumber,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      createdAt: new Date(),
      isVerified: false,
      permissions:
        data.role === "client"
          ? ["view_consultations", "manage_users", "view_analytics"]
          : ["view_consultations", "manage_medications", "process_orders"],
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    return userCredential;
  } catch (error: unknown) {
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "unknown";
    throw new Error(getAuthErrorMessage(errorCode));
  }
};

// Sign in with email and password
export const signIn = async (data: SignInData): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    return userCredential;
  } catch (error: unknown) {
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "unknown";
    throw new Error(getAuthErrorMessage(errorCode));
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (_error: unknown) {
    throw new Error("Failed to sign out");
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Get user profile from Firestore
export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (_error: unknown) {
    console.error("Error getting user profile:", _error);

    // Handle specific offline/network errors
    if (
      _error &&
      typeof _error === "object" &&
      "code" in _error &&
      (_error.code === "failed-precondition" ||
        _error.code === "unavailable" ||
        ("message" in _error &&
          typeof _error.message === "string" &&
          (_error.message.includes("offline") ||
            _error.message.includes("network"))))
    ) {
      console.warn(
        "User profile fetch failed due to network issues, retrying..."
      );

      // Retry once after a short delay
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retryDoc = await getDoc(doc(db, "users", uid));
        if (retryDoc.exists()) {
          return retryDoc.data() as UserProfile;
        }
        return null;
      } catch (retryError: unknown) {
        console.error("Retry failed for user profile:", retryError);
        // Return null but don't throw - let the app continue
        return null;
      }
    }

    // For other errors, return null but don't throw
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    await updateDoc(doc(db, "users", uid), updates);
  } catch (_error: unknown) {
    throw new Error("Failed to update user profile");
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "unknown";
    throw new Error(getAuthErrorMessage(errorCode));
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/invalid-email":
      return "Please enter a valid email address";
    case "auth/operation-not-allowed":
      return "Email/password accounts are not enabled";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/user-disabled":
      return "This account has been disabled";
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again";
    case "auth/internal-error":
      return "Internal error. Please try again later";
    case "auth/invalid-credential":
      return "Invalid credentials. Please check your email and password";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with the same email but different sign-in credentials";
    case "auth/requires-recent-login":
      return "This operation requires recent authentication. Please log in again";
    case "auth/operation-not-supported-in-this-environment":
      return "This operation is not supported in your current environment";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing the operation";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by the browser";
    case "auth/cancelled-popup-request":
      return "Sign-in popup request was cancelled";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for sign-in";
    case "auth/app-not-authorized":
      return "This app is not authorized to use Firebase Authentication";
    case "auth/invalid-app-credential":
      return "Invalid app credential";
    case "auth/invalid-verification-code":
      return "Invalid verification code";
    case "auth/invalid-verification-id":
      return "Invalid verification ID";
    case "auth/missing-verification-code":
      return "Missing verification code";
    case "auth/missing-verification-id":
      return "Missing verification ID";
    case "auth/quota-exceeded":
      return "Quota exceeded. Please try again later";
    case "auth/retry-phone-auth":
      return "Phone authentication failed. Please try again";
    case "auth/session-expired":
      return "Session expired. Please log in again";
    case "auth/unsupported-persistence-type":
      return "Unsupported persistence type";
    case "auth/user-token-expired":
      return "User token expired. Please log in again";
    case "auth/web-storage-unsupported":
      return "Web storage is not supported in this browser";
    case "auth/invalid-tenant-id":
      return "Invalid tenant ID";
    case "auth/tenant-id-mismatch":
      return "Tenant ID mismatch";
    case "auth/unsupported-tenant-operation":
      return "Unsupported tenant operation";
    case "auth/invalid-recaptcha-token":
      return "Invalid reCAPTCHA token";
    case "auth/missing-recaptcha-token":
      return "Missing reCAPTCHA token";
    case "auth/invalid-recaptcha-action":
      return "Invalid reCAPTCHA action";
    case "auth/missing-client-type":
      return "Missing client type";
    case "auth/missing-recaptcha-version":
      return "Missing reCAPTCHA version";
    case "auth/invalid-recaptcha-version":
      return "Invalid reCAPTCHA version";
    case "auth/invalid-req-type":
      return "Invalid request type";
    default:
      return "An error occurred. Please try again";
  }
};
