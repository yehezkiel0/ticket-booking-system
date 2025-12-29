import axios from "axios";

const API_URL = "http://localhost:3000/api/bookings";

export const bookingService = {
  createBooking: async (eventId, seatCount) => {
    const response = await axios.post(API_URL, {
      eventId,
      seatCount,
    });
    return response.data;
  },
};
