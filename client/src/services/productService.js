import axios from "axios";

const API_URL = "http://localhost:3000/api/products";

export const productService = {
  getPopularConcerts: async (page, limit) => {
    const response = await axios.get(`${API_URL}/popular`, {
      params: { page, limit },
    });
    return response.data;
  },
};
