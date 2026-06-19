import axios from "axios";

export const getDeliveryStatus = async (anonId) => {
  try {
    const response = await axios.get(`/api/delivery/status/${anonId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery status:", error);
    throw error;
  }
};

export const getDeliveryLocation = async (anonId) => {
  try {
    const response = await axios.get(`/api/delivery/location/${anonId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery location:", error);
    throw error;
  }
};

export const updateDeliveryStatus = async (anonId, status) => {
  try {
    const response = await axios.put(`/api/delivery/status/${anonId}`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating delivery status:", error);
    throw error;
  }
};

export const getDeliveryHistory = async (anonId) => {
  try {
    const response = await axios.get(`/api/delivery/history/${anonId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery history:", error);
    throw error;
  }
};

export const createDeliveryOrder = async (orderData) => {
  try {
    const response = await axios.post("/api/delivery/orders", orderData);
    return response.data;
  } catch (error) {
    console.error("Error creating delivery order:", error);
    throw error;
  }
};
