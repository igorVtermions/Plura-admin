import axios from "axios";
import api from "@/services/api";
import type {
  BanUserPayload,
  BanUserResponse,
  UnbanUserPayload,
  UserCardUser,
  UserListParams,
  UserListResponse,
  UserProfileResponse,
  UserStatus,
} from "./types";

const DEFAULT_BAN_PAYLOAD: BanUserPayload = {
  reason: "outro",
  description: "Banimento confirmado pelo administrador.",
};

const DEFAULT_UNBAN_PAYLOAD: UnbanUserPayload = {
  description: "Reativação confirmada pelo administrador.",
  status: "active",
};

const FOLLOW_DEFAULT_PAGE_SIZE = 20;

type FollowParams = { page?: number; perPage?: number };
export type FollowListResult = {
  items: UserCardUser[];
  total: number | null;
  pageSize: number;
  hasMore: boolean;
};

function normalizeListResponse(payload: unknown): UserListResponse {
  if (!payload || typeof payload !== "object") return { data: [], meta: {} };
  const cast = payload as Partial<UserListResponse>;
  return {
    data: Array.isArray(cast.data) ? cast.data : [],
    meta: cast.meta ?? {},
  };
}

function resolveStatus(value: unknown): UserStatus {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "active" || normalized === "banned") return normalized;
  return "pending";
}

function extractNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function extractArray(source: Record<string, unknown>, key: string): unknown[] {
  const direct = source[key];
  if (Array.isArray(direct)) return direct;

  if (direct && typeof direct === "object") {
    const nested = direct as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.items)) return nested.items;
  }

  if (Array.isArray(source.data)) return source.data;
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(source.list)) return source.list;

  return [];
}

function normalizeFollowUser(raw: unknown): UserCardUser | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const base =
    data.user && typeof data.user === "object"
      ? (data.user as Record<string, unknown>)
      : data;

  const idValue =
    base.id ??
    base.userId ??
    base._id ??
    data.followingId ??
    data.followerId ??
    null;

  if (typeof idValue !== "string" && typeof idValue !== "number") return null;

  const nameValue =
    base.name ?? base.fullName ?? base.displayName ?? base.username;

  const name =
    typeof nameValue === "string" && nameValue.trim().length > 0
      ? nameValue.trim()
      : "Usuário";

  const codenameValue =
    typeof base.codename === "string"
      ? base.codename
      : typeof base.codinome === "string"
      ? base.codinome
      : typeof base.username === "string"
      ? base.username
      : undefined;

  const avatarRaw =
    typeof base.avatarUrl === "string"
      ? base.avatarUrl
      : typeof base.photoUrl === "string"
      ? base.photoUrl
      : typeof base.picture === "string"
      ? base.picture
      : typeof base.imageUrl === "string"
      ? base.imageUrl
      : null;

  const email = typeof base.email === "string" ? base.email : null;
  const phone = typeof base.phone === "string" ? base.phone : null;
  const bio = typeof base.bio === "string" ? base.bio : null;

  const createdAt =
    typeof data.followedAt === "string"
      ? data.followedAt
      : typeof base.createdAt === "string"
      ? base.createdAt
      : null;

  const loginAttempts =
    typeof base.loginAttempts === "number" ? base.loginAttempts : 0;
  const lockedUntil =
    typeof base.lockedUntil === "string" ? base.lockedUntil : null;

  const isVerified =
    typeof base.isVerified === "boolean"
      ? base.isVerified
      : typeof base.verified === "boolean"
      ? base.verified
      : false;

  return {
    id: String(idValue),
    name,
    codename: codenameValue ?? null,
    email,
    phone,
    bio,
    avatarUrl: typeof avatarRaw === "string" ? avatarRaw : null,
    status: resolveStatus(base.status),
    isVerified,
    createdAt,
    loginAttempts,
    lockedUntil,
  };
}

function mapFollowResponse(
  payload: unknown,
  key: "followers" | "following",
  params?: FollowParams,
): FollowListResult {
  const data =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const rawItems = extractArray(data, key);
  const items = rawItems
    .map(normalizeFollowUser)
    .filter((user): user is UserCardUser => user !== null);

  const meta =
    data.meta && typeof data.meta === "object"
      ? (data.meta as Record<string, unknown>)
      : undefined;

  const total = extractNumber(
    data.count,
    data.total,
    data.totalCount,
    data[`${key}Count`],
    meta?.total,
  );

  const pageSize =
    extractNumber(meta?.perPage, data.perPage, params?.perPage) ??
    FOLLOW_DEFAULT_PAGE_SIZE;

  const resolvedPageSize =
    pageSize && pageSize > 0 ? pageSize : FOLLOW_DEFAULT_PAGE_SIZE;

  const hasMore =
    typeof data.hasMore === "boolean"
      ? data.hasMore
      : total != null
      ? Math.max(1, params?.page ?? 1) * resolvedPageSize < total
      : items.length >= resolvedPageSize;

  return {
    items,
    total,
    pageSize: resolvedPageSize,
    hasMore,
  };
}

export async function fetchUsers(
  params: UserListParams,
): Promise<UserListResponse> {
  const response = await api.get("/admin/users", { params });
  return normalizeListResponse(response?.data);
}

export async function banUser(
  userId: string,
  payload?: BanUserPayload,
): Promise<BanUserResponse> {
  const body = payload ?? DEFAULT_BAN_PAYLOAD;

  try {
    const response = await api.post(`/admin/users/${userId}/ban`, body);
    return (response?.data ?? {}) as BanUserResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const fallbackResponse = await api.patch(`/admin/users/${userId}`, {
        status: "banned",
        reason: body.reason,
        description: body.description,
      });
      return (fallbackResponse?.data ?? {}) as BanUserResponse;
    }
    throw error;
  }
}

export async function unbanUser(
  userId: string,
  payload?: UnbanUserPayload,
): Promise<BanUserResponse> {
  const body = payload ?? DEFAULT_UNBAN_PAYLOAD;

  try {
    const response = await api.post(`/admin/users/${userId}/unban`, body);
    return (response?.data ?? {}) as BanUserResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const fallbackResponse = await api.patch(`/admin/users/${userId}`, {
        status: body.status ?? "active",
        description: body.description,
      });
      return (fallbackResponse?.data ?? {}) as BanUserResponse;
    }
    throw error;
  }
}

export async function fetchUserProfile(
  userId: string,
): Promise<UserProfileResponse> {
  const response = await api.get(`/admin/users/${userId}`);
  return (response?.data ?? {}) as UserProfileResponse;
}

export async function fetchFollowers(
  userId: string,
  params?: FollowParams,
): Promise<FollowListResult> {
  const response = await api.get(`/users/${userId}/followers`, { params });
  return mapFollowResponse(response?.data, "followers", params);
}

export async function fetchFollowing(
  userId: string,
  params?: FollowParams,
): Promise<FollowListResult> {
  const response = await api.get(`/users/${userId}/following`, { params });
  return mapFollowResponse(response?.data, "following", params);
}