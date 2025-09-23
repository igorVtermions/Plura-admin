import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://p1tct9i4re.execute-api.sa-east-1.amazonaws.com/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  try {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const url = String(config.url ?? "");
      const isAuthFree = /\/(admin|users)\/login\b/.test(url);
      if (!isAuthFree && token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      location.assign("/");
    }
    return Promise.reject(err);
  }
);

export function setClientToken(token?: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export default api;
