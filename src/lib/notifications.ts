import { prisma } from "@/lib/prisma";

type NotificationType = "ORDER" | "CONSULTATION" | "DELIVERY" | "SYSTEM";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link ?? null,
    },
  });
}

export async function notifyOrderUpdate(userId: string, orderNumber: string, status: string) {
  return createNotification({
    userId,
    title: "Order Updated",
    message: `Order #${orderNumber} is now ${status.toLowerCase().replace(/_/g, " ")}.`,
    type: "ORDER",
    link: "/orders",
  });
}

export async function notifyConsultationUpdate(userId: string, consultationId: string, status: string) {
  return createNotification({
    userId,
    title: "Consultation Updated",
    message: `Your consultation is now ${status.toLowerCase().replace(/_/g, " ")}.`,
    type: "CONSULTATION",
    link: `/consultations`,
  });
}

export async function notifyDeliveryUpdate(userId: string, trackingNumber: string, status: string) {
  return createNotification({
    userId,
    title: "Delivery Update",
    message: `Delivery #${trackingNumber} is now ${status.toLowerCase().replace(/_/g, " ")}.`,
    type: "DELIVERY",
    link: "/delivery",
  });
}
