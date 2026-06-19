import { prisma } from "./prisma";
import { ConsultationStatus } from "./prisma-client";

export interface CreateConsultationData {
  userId: string;
  type: string;
  description?: string;
}

export interface Consultation {
  id: string;
  userId: string | null;
  type: string;
  status: ConsultationStatus;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
}

// Create a new consultation
export const createConsultation = async (
  data: CreateConsultationData
): Promise<Consultation> => {
  try {
    const consultation = await prisma.consultation.create({
      data: {
        userId: data.userId,
        type: data.type,
        description: data.description,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return consultation;
  } catch (_error: unknown) {
    throw new Error("Failed to create consultation");
  }
};

// Get consultation by ID
export const getConsultation = async (
  consultationId: string
): Promise<Consultation | null> => {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return consultation;
  } catch (error: unknown) {
    console.error("Error getting consultation:", error);
    return null;
  }
};

// Get consultations by user ID
export const getConsultationsByUser = async (
  userId: string
): Promise<Consultation[]> => {
  try {
    const consultations = await prisma.consultation.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return consultations;
  } catch (_error: unknown) {
    throw new Error("Failed to get consultations");
  }
};

// Get all consultations (for admin/pharmacy purposes)
export const getAllConsultations = async (): Promise<Consultation[]> => {
  try {
    const consultations = await prisma.consultation.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return consultations;
  } catch (_error: unknown) {
    throw new Error("Failed to get consultations");
  }
};

// Update consultation status
export const updateConsultationStatus = async (
  consultationId: string,
  status: ConsultationStatus
): Promise<Consultation> => {
  try {
    const consultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return consultation;
  } catch (_error: unknown) {
    throw new Error("Failed to update consultation status");
  }
};

// Update consultation
export const updateConsultation = async (
  consultationId: string,
  updates: Partial<
    Omit<Consultation, "id" | "userId" | "createdAt" | "updatedAt" | "user">
  >
): Promise<Consultation> => {
  try {
    const consultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: updates,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return consultation;
  } catch (_error: unknown) {
    throw new Error("Failed to update consultation");
  }
};

// Delete consultation
export const deleteConsultation = async (
  consultationId: string
): Promise<void> => {
  try {
    await prisma.consultation.delete({
      where: { id: consultationId },
    });
  } catch (_error: unknown) {
    throw new Error("Failed to delete consultation");
  }
};

// Get consultations by status
export const getConsultationsByStatus = async (
  status: ConsultationStatus
): Promise<Consultation[]> => {
  try {
    const consultations = await prisma.consultation.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return consultations;
  } catch (_error: unknown) {
    throw new Error("Failed to get consultations by status");
  }
};

// Get consultation statistics
export const getConsultationStats = async () => {
  try {
    const stats = await prisma.consultation.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    return stats;
  } catch (_error: unknown) {
    throw new Error("Failed to get consultation statistics");
  }
};
