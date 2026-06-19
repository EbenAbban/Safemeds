import axios from "axios";

export interface Order {
  id: string;
  prescriptionId?: string;
  userId?: string;
  anonymousId?: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "READY_FOR_PICKUP" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod?: string;
  isAnonymous: boolean;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  prescription?: {
    id: string;
    medication: {
      id: string;
      name: string;
      genericName?: string;
      dosageForm: string;
      strength: string;
      manufacturer: string;
      price: number;
    };
    dosage: string;
    frequency: string;
    quantity: number;
    instructions?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  delivery?: {
    id: string;
    status: string;
    trackingNumber: string;
  };
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

export interface OrderResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

export const getOrders = async (
  filters?: OrderFilters
): Promise<OrderResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await axios.get(`/api/orders?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      orders: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      statistics: { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
    };
  }
};

export const getOrder = async (
  id: string
): Promise<Order | null> => {
  try {
    const response = await axios.get(`/api/orders/${id}`);
    return response.data.order;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
};

export const createOrder = async (
  data: {
    prescriptionId: string;
    paymentMethod?: string;
    specialInstructions?: string;
  }
): Promise<Order | null> => {
  try {
    const response = await axios.post("/api/orders", data);
    return response.data.order;
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
};

export const updateOrderStatus = async (
  id: string,
  status: string
): Promise<Order | null> => {
  try {
    const response = await axios.put(`/api/orders/${id}`, { status });
    return response.data.order;
  } catch (error) {
    console.error("Error updating order status:", error);
    return null;
  }
}; 