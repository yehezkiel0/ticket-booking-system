import axios from "axios";

const API_URL = "http://localhost:3000/api/payments";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const paymentService = {
  processPayment: async (bookingId, amount) => {
    const response = await axios.post(
      API_URL,
      {
        bookingId,
        amount,
      },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  getPaymentStatus: async (paymentId) => {
    const response = await axios.get(`${API_URL}/${paymentId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getAllPayments: async () => {
    const response = await axios.get(API_URL, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
