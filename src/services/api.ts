import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const apiBase = import.meta.env.VITE_API_URL;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or Anon Key is missing from .env files. Supabase client will not be initialized.",
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : undefined;

type InvokeHeaders = Record<string, string>;

function handleUnauthorizedRedirect() {
  try {
    setClientToken(null);
  } catch {}
  if (typeof window !== "undefined") {
    try {
      if (window.location.pathname === "/login") return;
      window.location.assign("/login");
    } catch {}
  }
}

function shouldSerializeBody(body: unknown): body is Record<string, unknown> | unknown[] {
  if (!body || typeof body !== "object") return false;
  if (body instanceof FormData) return false;
  if (body instanceof Blob) return false;
  if (body instanceof ArrayBuffer) return false;
  if (ArrayBuffer.isView(body)) return false;
  if (body instanceof URLSearchParams) return false;
  return true;
}

function withAuthHeader(headers: InvokeHeaders = {}): InvokeHeaders {
  const next = { ...headers };
  try {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && !next.Authorization) {
        next.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore storage errors
  }
  return next;
}

export async function invokeFunction<T = unknown>(
  functionName: string,
  options: {
    method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
    body?: Record<string, unknown> | BodyInit;
    headers?: InvokeHeaders;
  } = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  },
) {
  if (!supabase) {
    throw new Error("Supabase client is not initialized. Check your .env configuration.");
  }

  const headers = withAuthHeader(options.headers);
  let preparedBody = options.body;

  if (shouldSerializeBody(options.body)) {
    preparedBody = JSON.stringify(options.body);
    if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
  }

  const { data, error } = await supabase.functions.invoke<T>(functionName, {
    ...options,
    headers,
    body: preparedBody,
  });

  if (error) {
    if (typeof error === "object" && error && "status" in error && (error as any).status === 401) {
      handleUnauthorizedRedirect();
    }
    console.error(`Error invoking function '${functionName}':`, error);
    throw error;
  }

  return data;
}

const api = axios.create({
  baseURL: apiBase,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
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
  },
);

export function setClientToken(token?: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function getClientToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export default api;
