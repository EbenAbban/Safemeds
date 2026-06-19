import axios from "axios";

export interface AnalyticsFilters {
  period?: string;
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsData {
  period: {
    start: string;
    end: string;
    days: number;
  };
  sales: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    dailySales: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
  };
  consultations: {
    total: number;
    statusBreakdown: Array<{
      status: string;
      count: number;
    }>;
  };
  prescriptions: {
    total: number;
    statusBreakdown: Array<{
      status: string;
      count: number;
    }>;
  };
  inventory: {
    totalItems: number;
    totalQuantity: number;
    lowStockItems: number;
    expiringItems: number;
  };
  topMedications: Array<{
    medicationId: string;
    _count: {
      id: number;
    };
    medication: {
      id: string;
      name: string;
      genericName?: string;
      dosageForm: string;
      strength: string;
    };
  }>;
  userTypes: {
    anonymous: number;
    authenticated: number;
    total: number;
  };
}

export const getAnalytics = async (
  filters?: AnalyticsFilters
): Promise<AnalyticsData> => {
  try {
    const params = new URLSearchParams();
    if (filters?.period) params.append("period", filters.period);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const response = await axios.get(`/api/analytics?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return {
      period: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        days: 0,
      },
      sales: {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        dailySales: [],
      },
      consultations: {
        total: 0,
        statusBreakdown: [],
      },
      prescriptions: {
        total: 0,
        statusBreakdown: [],
      },
      inventory: {
        totalItems: 0,
        totalQuantity: 0,
        lowStockItems: 0,
        expiringItems: 0,
      },
      topMedications: [],
      userTypes: {
        anonymous: 0,
        authenticated: 0,
        total: 0,
      },
    };
  }
};

export const getDashboardStats = async (): Promise<{
  totalConsultations: number;
  pendingConsultations: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  expiringItems: number;
}> => {
  try {
    const response = await axios.get("/api/analytics/dashboard-stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalConsultations: 0,
      pendingConsultations: 0,
      totalOrders: 0,
      totalRevenue: 0,
      lowStockItems: 0,
      expiringItems: 0,
    };
  }
};

export const getRevenueChart = async (
  period: string = "30"
): Promise<Array<{
  date: string;
  revenue: number;
  orders: number;
}>> => {
  try {
    const response = await axios.get(`/api/analytics/revenue-chart?period=${period}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue chart:", error);
    return [];
  }
};

export const getConsultationStats = async (
  period: string = "30"
): Promise<{
  total: number;
  byType: Array<{
    type: string;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}> => {
  try {
    const response = await axios.get(`/api/analytics/consultation-stats?period=${period}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching consultation stats:", error);
    return {
      total: 0,
      byType: [],
      byStatus: [],
    };
  }
};

export const getInventoryAlerts = async (): Promise<{
  lowStockItems: Array<{
    id: string;
    medication: {
      name: string;
      strength: string;
    };
    quantity: number;
    minQuantity: number;
  }>;
  expiringItems: Array<{
    id: string;
    medication: {
      name: string;
      strength: string;
    };
    expirationDate: string;
    quantity: number;
  }>;
}> => {
  try {
    const response = await axios.get("/api/analytics/inventory-alerts");
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory alerts:", error);
    return {
      lowStockItems: [],
      expiringItems: [],
    };
  }
};
