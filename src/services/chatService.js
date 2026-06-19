import axios from "axios";

export const getChatMessages = async (chatId) => {
  try {
    const response = await axios.get(`/api/chat/${chatId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    throw error;
  }
};

export const sendChatMessage = async (chatId, message) => {
  try {
    const response = await axios.post(`/api/chat/${chatId}`, message);
    return response.data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};
