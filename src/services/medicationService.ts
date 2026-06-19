import axios from "axios";

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  description?: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  isPrescription: boolean;
  isControlled: boolean;
  requiresLicense: boolean;
  sideEffects?: string;
  interactions?: string;
  contraindications?: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  inventoryItems?: InventoryItem[];
  _count?: {
    prescriptions: number;
  };
}

export interface InventoryItem {
  id: string;
  medicationId: string;
  pharmacyId: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  lotNumber?: string;
  expirationDate?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  medication?: Medication;
}

export interface Prescription {
  id: string;
  consultationId?: string;
  userId?: string;
  anonymousId?: string;
  medicationId: string;
  prescribedBy: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  instructions?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DISPENSED" | "EXPIRED";
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  medication?: Medication;
  consultation?: {
    id: string;
    type: string;
    status: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    assignedPharmacist?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  orders?: Order[];
}

export interface Order {
  id: string;
  prescriptionId?: string;
  userId?: string;
  anonymousId?: string;
  orderNumber: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "READY_FOR_PICKUP"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  totalAmount: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod?: string;
  isAnonymous: boolean;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  prescription?: Prescription;
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
    estimatedDelivery?: string;
    actualDelivery?: string;
  };
}

export interface CreateMedicationData {
  name: string;
  genericName?: string;
  description?: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  isPrescription?: boolean;
  isControlled?: boolean;
  requiresLicense?: boolean;
  sideEffects?: string;
  interactions?: string;
  contraindications?: string;
  price: number;
}

export interface CreatePrescriptionData {
  consultationId?: string;
  userId?: string;
  anonymousId?: string;
  medicationId: string;
  prescribedBy: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills?: number;
  instructions?: string;
  isAnonymous?: boolean;
}

export interface CreateOrderData {
  prescriptionId: string;
  userId?: string;
  anonymousId?: string;
  paymentMethod?: string;
  specialInstructions?: string;
  isAnonymous?: boolean;
}

export interface MedicationFilters {
  search?: string;
  category?: string;
  isPrescription?: boolean;
  page?: number;
  limit?: number;
}

export interface PrescriptionFilters {
  status?: string;
  consultationId?: string;
  page?: number;
  limit?: number;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

export interface MedicationResponse {
  medications: Medication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Medication APIs
export const getMedications = async (
  filters?: MedicationFilters
): Promise<MedicationResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.isPrescription) params.append("isPrescription", filters.isPrescription.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await axios.get(`/api/medications?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching medications:", error);
    return {
      medications: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    };
  }
};

export const getMedication = async (
  id: string
): Promise<Medication | null> => {
  try {
    const response = await axios.get(`/api/medications/${id}`);
    return response.data.medication;
  } catch (error) {
    console.error("Error fetching medication:", error);
    return null;
  }
};

export const createMedication = async (
  data: CreateMedicationData
): Promise<Medication | null> => {
  try {
    const response = await axios.post("/api/medications", data);
    return response.data.medication;
  } catch (error) {
    console.error("Error creating medication:", error);
    return null;
  }
};

export const updateMedication = async (
  id: string,
  data: Partial<CreateMedicationData>
): Promise<Medication | null> => {
  try {
    const response = await axios.put(`/api/medications/${id}`, data);
    return response.data.medication;
  } catch (error) {
    console.error("Error updating medication:", error);
    return null;
  }
};

export const deleteMedication = async (
  id: string
): Promise<boolean> => {
  try {
    await axios.delete(`/api/medications/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting medication:", error);
    return false;
  }
};

// Inventory APIs
export const getInventory = async (
  filters?: {
    search?: string;
    lowStock?: boolean;
    expiring?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<{
  inventoryItems: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    totalItems: number;
    totalQuantity: number;
    lowStockItems: number;
    expiringItems: number;
  };
}> => {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.lowStock)
      params.append("lowStock", filters.lowStock.toString());
    if (filters?.expiring)
      params.append("expiring", filters.expiring.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await axios.get(`/api/inventory?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return {
      inventoryItems: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      stats: {
        totalItems: 0,
        totalQuantity: 0,
        lowStockItems: 0,
        expiringItems: 0,
      },
    };
  }
};

export const addToInventory = async (
  data: {
    medicationId: string;
    quantity: number;
    minQuantity?: number;
    maxQuantity?: number;
    lotNumber?: string;
    expirationDate?: string;
    location?: string;
  }
): Promise<InventoryItem | null> => {
  try {
    const response = await axios.post("/api/inventory", data);
    return response.data.inventoryItem;
  } catch (error) {
    console.error("Error adding to inventory:", error);
    return null;
  }
};

export const updateInventoryItem = async (
  id: string,
  data: Partial<{
    quantity: number;
    minQuantity: number;
    maxQuantity: number;
    lotNumber: string;
    expirationDate: string;
    location: string;
  }>
): Promise<InventoryItem | null> => {
  try {
    const response = await axios.put(`/api/inventory/${id}`, data);
    return response.data.inventoryItem;
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return null;
  }
};

// Prescription APIs
export const getPrescriptions = async (filters?: PrescriptionFilters) => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.consultationId)
      params.append("consultationId", filters.consultationId);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await axios.get(`/api/prescriptions?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return {
      prescriptions: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    };
  }
};

export const createPrescription = async (
  data: CreatePrescriptionData
): Promise<Prescription | null> => {
  try {
    const response = await axios.post("/api/prescriptions", data);
    return response.data.prescription;
  } catch (error) {
    console.error("Error creating prescription:", error);
    return null;
  }
};

export const updatePrescriptionStatus = async (
  id: string,
  status: string
): Promise<Prescription | null> => {
  try {
    const response = await axios.put(`/api/prescriptions/${id}`, { status });
    return response.data.prescription;
  } catch (error) {
    console.error("Error updating prescription status:", error);
    return null;
  }
};

// Order APIs
export const getOrders = async (filters?: OrderFilters) => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.paymentStatus)
      params.append("paymentStatus", filters.paymentStatus);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await axios.get(`/api/orders?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      orders: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      stats: {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        processingOrders: 0,
      },
    };
  }
};

export const createOrder = async (
  data: CreateOrderData
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
