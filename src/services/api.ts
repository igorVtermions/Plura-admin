import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const API_BASE =
  import.meta.env.VITE_API_URL ??
  "https://p1tct9i4re.execute-api.sa-east-1.amazonaws.com/api";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing from .env files. Supabase client will not be initialized.");
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : undefined;

export async function invokeFunction<T = unknown>(
  functionName: string,
  options: {
    method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
    body?: Record<string, unknown> | BodyInit;
    headers?: Record<string, string>;
  } = {}
) {
  if (!supabase) {
    throw new Error("Supabase client is not initialized. Check your .env configuration.");
  }
  const { data, error } = await supabase.functions.invoke<T>(functionName, {
    ...options,
    body: options.body && typeof options.body === 'object' ? JSON.stringify(options.body) : options.body,
  });

  if (error) {
    console.error(`Error invoking function '${functionName}':`, error);
    throw error;
  }

  return data;
}

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
    // ignora
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      location.assign("/");
    }
    return Promise.reject(error);
  }
);

export function setClientToken(token?: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export default api;
