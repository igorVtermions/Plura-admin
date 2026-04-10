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
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : undefined;

type InvokeHeaders = Record<string, string>;
let refreshSessionPromise: Promise<string | null> | null = null;

function isUnauthorizedError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in (error as Record<string, unknown>) &&
    Number((error as { status?: unknown }).status) === 401
  );
}

function getLegacyToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

function setLegacyToken(token?: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export async function getClientAccessToken() {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session?.access_token) {
        setLegacyToken(data.session.access_token);
        return data.session.access_token;
      }
    } catch {
      // ignore session read errors
    }
  }

  return getLegacyToken();
}

async function refreshClientSession() {
  if (!supabase) return null;

  if (!refreshSessionPromise) {
    refreshSessionPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data?.session?.access_token) return null;
        setLegacyToken(data.session.access_token);
        return data.session.access_token;
      } catch {
        return null;
      } finally {
        refreshSessionPromise = null;
      }
    })();
  }

  return refreshSessionPromise;
}

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

async function withAuthHeader(headers: InvokeHeaders = {}): Promise<InvokeHeaders> {
  const next = { ...headers };
  try {
    const token = await getClientAccessToken();
    if (token && !next.Authorization) {
      next.Authorization = `Bearer ${token}`;
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

  const buildRequestPayload = async (tokenOverride?: string) => {
    const headers = await withAuthHeader(options.headers);
    if (tokenOverride) headers.Authorization = `Bearer ${tokenOverride}`;

    let preparedBody = options.body;
    if (shouldSerializeBody(options.body)) {
      preparedBody = JSON.stringify(options.body);
      if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
    }

    return {
      ...options,
      headers,
      body: preparedBody,
    };
  };

  let payload = await buildRequestPayload();
  let { data, error } = await supabase.functions.invoke<T>(functionName, payload);

  if (error) {
    if (isUnauthorizedError(error)) {
      const refreshedToken = await refreshClientSession();
      if (refreshedToken) {
        payload = await buildRequestPayload(refreshedToken);
        const retry = await supabase.functions.invoke<T>(functionName, payload);
        if (!retry.error) return retry.data;
        if (isUnauthorizedError(retry.error)) {
          handleUnauthorizedRedirect();
        }
        console.error(`Error invoking function '${functionName}' after refresh:`, retry.error);
        throw retry.error;
      }
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
  return (async () => {
    try {
      const token = await getClientAccessToken();
      const url = String(config.url ?? "");
      const isAuthFree = /\/(admin|users)\/login\b/.test(url);
      if (!isAuthFree && token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignora
    }
    return config;
  })();
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      const originalRequest = (error?.config || {}) as Record<string, unknown>;
      if (!originalRequest.__sessionRetried) {
        originalRequest.__sessionRetried = true;
        const refreshedToken = await refreshClientSession();
        if (refreshedToken) {
          originalRequest.headers = {
            ...((originalRequest.headers as Record<string, string> | undefined) || {}),
            Authorization: `Bearer ${refreshedToken}`,
          };
          return api.request(originalRequest as any);
        }
      }

      handleUnauthorizedRedirect();
    }

    return Promise.reject(error);
  },
);

export function setClientToken(token?: string | null) {
  setLegacyToken(token);

  if (!supabase) return;

  if (!token) {
    void supabase.auth.signOut({ scope: "local" });
  }
}

export function getClientToken() {
  return getLegacyToken();
}

export async function setClientSession(params: { accessToken: string; refreshToken?: string | null }) {
  const accessToken = params.accessToken?.trim();
  if (!accessToken) {
    setClientToken(null);
    return false;
  }

  if (supabase && params.refreshToken) {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: params.refreshToken,
      });
      if (!error) {
        setLegacyToken(accessToken);
        return true;
      }
    } catch {
      // fallback below
    }
  }

  setLegacyToken(accessToken);
  return true;
}

export default api;
