// frontend/src/apis/api.js
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
const API_BASE = process.env.REACT_APP_API_BASE || "/api";

const api = axios.create({
  baseURL: process.env.NODE_ENV === "development" ? `${BACKEND_URL}${API_BASE}` : API_BASE,
  timeout: 60000, 
});


api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === "ECONNABORTED") {
     
      return Promise.reject(new Error("Request timed out — server took too long to respond"));
    }
    return Promise.reject(err);
  }
);

export { BACKEND_URL };
export default api;