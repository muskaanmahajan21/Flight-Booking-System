import axios from "axios";

const api = axios.create({
  baseURL: "https://flight-booking-system-gfzh.onrender.com/api",
  timeout: 60000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === "ECONNABORTED") {
      return Promise.reject(
        new Error("Request timed out — server took too long to respond")
      );
    }
    return Promise.reject(err);
  }
);

export default api;
