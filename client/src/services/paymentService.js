import axios from "axios";

const API_URL = "http://localhost:3000/api/payments";

export const paymentService = {
  processPayment: async (bookingId, amount) => {
    const response = await axios.post(API_URL, {
      bookingId,
      amount,
    });
    return response.data;
  },
};
