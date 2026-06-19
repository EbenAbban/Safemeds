import { prisma } from "./prisma";
import { DeliveryStatus } from "./prisma-client";

export interface CreateDeliveryData {
  userId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  estimatedDelivery?: Date;
}

export interface Delivery {
  id: string;
  userId: string | null;
  status: DeliveryStatus;
  trackingNumber: string;
  estimatedDelivery?: Date | null;
  actualDelivery?: Date | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
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

// Generate tracking number
function generateTrackingNumber(): string {
  const prefix = "TRK";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Create a new delivery
export const createDelivery = async (
  data: CreateDeliveryData
): Promise<Delivery> => {
  try {
    const trackingNumber = generateTrackingNumber();

    const delivery = await prisma.delivery.create({
      data: {
        userId: data.userId,
        status: "ORDER_CONFIRMED",
        trackingNumber,
        estimatedDelivery: data.estimatedDelivery,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
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

    return delivery;
  } catch (_error: unknown) {
    throw new Error("Failed to create delivery");
  }
};

// Get delivery by ID
export const getDelivery = async (
  deliveryId: string
): Promise<Delivery | null> => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
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

    return delivery;
  } catch (error: unknown) {
    console.error("Error getting delivery:", error);
    return null;
  }
};

// Get delivery by tracking number
export const getDeliveryByTrackingNumber = async (
  trackingNumber: string
): Promise<Delivery | null> => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { trackingNumber },
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

    return delivery;
  } catch (error: unknown) {
    console.error("Error getting delivery by tracking number:", error);
    return null;
  }
};

// Get deliveries by user ID
export const getDeliveriesByUser = async (
  userId: string
): Promise<Delivery[]> => {
  try {
    const deliveries = await prisma.delivery.findMany({
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

    return deliveries;
  } catch (_error: unknown) {
    throw new Error("Failed to get user deliveries");
  }
};

// Get all deliveries (for admin purposes)
export const getAllDeliveries = async (): Promise<Delivery[]> => {
  try {
    const deliveries = await prisma.delivery.findMany({
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

    return deliveries;
  } catch (_error: unknown) {
    throw new Error("Failed to get deliveries");
  }
};

// Update delivery status
export const updateDeliveryStatus = async (
  deliveryId: string,
  status: DeliveryStatus
): Promise<Delivery> => {
  try {
    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status,
        ...(status === "DELIVERED" && { actualDelivery: new Date() }),
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

    return delivery;
  } catch (_error: unknown) {
    throw new Error("Failed to update delivery status");
  }
};

// Update delivery
export const updateDelivery = async (
  deliveryId: string,
  updates: Partial<
    Omit<
      Delivery,
      "id" | "userId" | "trackingNumber" | "createdAt" | "updatedAt" | "user"
    >
  >
): Promise<Delivery> => {
  try {
    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
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

    return delivery;
  } catch (_error: unknown) {
    throw new Error("Failed to update delivery");
  }
};

// Delete delivery
export const deleteDelivery = async (deliveryId: string): Promise<void> => {
  try {
    await prisma.delivery.delete({
      where: { id: deliveryId },
    });
  } catch (_error: unknown) {
    throw new Error("Failed to delete delivery");
  }
};

// Get deliveries by status
export const getDeliveriesByStatus = async (
  status: DeliveryStatus
): Promise<Delivery[]> => {
  try {
    const deliveries = await prisma.delivery.findMany({
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

    return deliveries;
  } catch (_error: unknown) {
    throw new Error("Failed to get deliveries by status");
  }
};

// Get delivery statistics
export const getDeliveryStats = async () => {
  try {
    const stats = await prisma.delivery.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    return stats;
  } catch (_error: unknown) {
    throw new Error("Failed to get delivery statistics");
  }
};

// Get pending deliveries (for processing)
export const getPendingDeliveries = async (): Promise<Delivery[]> => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        status: {
          in: ["ORDER_CONFIRMED", "PROCESSING", "PACKAGED"],
        },
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
      orderBy: { createdAt: "asc" },
    });

    return deliveries;
  } catch (_error: unknown) {
    throw new Error("Failed to get pending deliveries");
  }
};
