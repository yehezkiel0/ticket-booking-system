import axios from "axios";

const API_URL = "http://localhost:3000/api/products";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const productService = {
  getPopularConcerts: async (page, limit) => {
    const response = await axios.get(`${API_URL}/popular`, {
      params: { page, limit },
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
