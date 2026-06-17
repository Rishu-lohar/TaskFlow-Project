import axios from "axios";

const normalizeBaseUrl = (url) => (url || "").trim().replace(/\/+$/, "");

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL),
});

export default api;
