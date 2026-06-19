import axios from "axios";

export interface Consultation {
  id: string;
  userId?: string;
  anonymousId?: string;
  type: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  description?: string;
  symptoms?: string;
  medications?: string;
  allergies?: string;
  age?: number;
  gender?: string;
  isAnonymous: boolean;
  assignedPharmacistId?: string;
  createdAt: string;
  updatedAt: string;
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
  messages?: Message[];
  prescriptions?: Prescription[];
  _count?: {
    messages: number;
    prescriptions: number;
  };
}

export interface Message {
  id: string;
  chatId: string;
  userId?: string;
  anonymousId?: string;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  isFromPharmacist: boolean;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
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
  medication?: {
    id: string;
    name: string;
    genericName?: string;
    dosageForm: string;
    strength: string;
    manufacturer: string;
    price: number;
    isControlled: boolean;
  };
}

export interface CreateConsultationData {
  type: string;
  description: string;
  symptoms?: string;
  medications?: string;
  allergies?: string;
  age?: number;
  gender?: string;
  isAnonymous?: boolean;
  anonymousId?: string;
}

export interface ConsultationFilters {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface ConsultationResponse {
  consultations: Consultation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getConsultations = async (
  filters?: ConsultationFilters
): Promise<ConsultationResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await axios.get(`/api/consultations?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return {
      consultations: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    };
  }
};

export const getConsultation = async (
  id: string
): Promise<Consultation | null> => {
  try {
    const response = await axios.get(`/api/consultations/${id}`);
    return response.data.consultation;
  } catch (error) {
    console.error("Error fetching consultation:", error);
    return null;
  }
};

export const createConsultation = async (
  data: CreateConsultationData
): Promise<Consultation | null> => {
  try {
    const response = await axios.post("/api/consultations", data);
    return response.data.consultation;
  } catch (error) {
    console.error("Error creating consultation:", error);
    return null;
  }
};

export const createAnonymousConsultation = async (
  data: CreateConsultationData
): Promise<{ consultation: Consultation; sessionId: string } | null> => {
  try {
    const response = await axios.post("/api/consultations/anonymous", data);
    return response.data;
  } catch (error) {
    console.error("Error creating anonymous consultation:", error);
    return null;
  }
};

export const updateConsultation = async (
  id: string,
  data: Partial<CreateConsultationData> & {
    status?: string;
    assignedPharmacistId?: string;
  }
): Promise<Consultation | null> => {
  try {
    const response = await axios.put(`/api/consultations/${id}`, data);
    return response.data.consultation;
  } catch (error) {
    console.error("Error updating consultation:", error);
    return null;
  }
};

export const deleteConsultation = async (id: string): Promise<boolean> => {
  try {
    await axios.delete(`/api/consultations/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting consultation:", error);
    return false;
  }
};

// Chat functionality
export const getConsultationMessages = async (
  consultationId: string,
  anonymousId?: string
): Promise<{ messages: Message[]; consultation: Consultation } | null> => {
  try {
    const params = anonymousId ? `?anonymousId=${anonymousId}` : "";
    const response = await axios.get(
      `/api/chat/consultation/${consultationId}${params}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching consultation messages:", error);
    return null;
  }
};

export const sendConsultationMessage = async (
  consultationId: string,
  content: string,
  type: string = "TEXT",
  anonymousId?: string
): Promise<Message | null> => {
  try {
    const response = await axios.post(
      `/api/chat/consultation/${consultationId}`,
      {
        content,
        type,
        anonymousId,
      }
    );
    return response.data.message;
  } catch (error) {
    console.error("Error sending consultation message:", error);
    return null;
  }
};

// Anonymous consultation tracking
export const getAnonymousConsultationStatus = async (
  sessionId: string
): Promise<Record<string, unknown> | null> => {
  try {
    const response = await axios.get(
      `/api/consultations/anonymous?sessionId=${sessionId}`
    );
    return response.data.session;
  } catch (error) {
    console.error("Error fetching anonymous consultation status:", error);
    return null;
  }
};
