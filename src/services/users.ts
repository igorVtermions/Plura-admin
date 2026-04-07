import api, { invokeFunction } from "@/services/api";
import type {
  BanUserPayload,
  BanUserResponse,
  UnbanUserPayload,
  UserCardUser,
  UserListParams,
  UserListResponse,
  UserProfileResponse,
  UserStatus,
} from "@/types/users";

const DEFAULT_BAN_PAYLOAD: BanUserPayload = {
  reason: "outro",
  description: "Banimento confirmado pelo administrador.",
};

const DEFAULT_UNBAN_PAYLOAD: UnbanUserPayload = {
  description: "Reativação confirmada pelo administrador.",
  status: "active",
};

const FOLLOW_DEFAULT_PAGE_SIZE = 20;
const USER_FUNCTION_NAME = "users-users";

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

function buildUsersFunctionPath(params: {
  search?: string;
  status?: string;
  page?: number;
  perPage?: number;
}): string {
  const searchParams = new URLSearchParams();
  const append = (key: string, value?: string | number | null) => {
    if (value === undefined || value === null) return;
    if (typeof value === "number") {
      if (Number.isNaN(value)) return;
      searchParams.append(key, String(value));
      return;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    searchParams.append(key, trimmed);
  };

  append("search", params.search);
  append("status", params.status);
  append("page", params.page);
  append("perPage", params.perPage);

  const query = searchParams.toString();
  return query ? `${USER_FUNCTION_NAME}?${query}` : USER_FUNCTION_NAME;
}

function resolveStatus(value: unknown): UserStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
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
    if (Array.isArray(nested.list)) return nested.list;
    if (Array.isArray(nested[key])) return nested[key];
  }

  if (Array.isArray(source.data)) return source.data;
  if (source.data && typeof source.data === "object") {
    const data = source.data as Record<string, unknown>;
    if (Array.isArray(data[key])) return data[key];
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.list)) return data.list;
  }
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(source.list)) return source.list;

  return [];
}

function normalizeFollowUser(raw: unknown): UserCardUser | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const base =
    data.user && typeof data.user === "object" ? (data.user as Record<string, unknown>) : data;

  const idValue = base.id ?? base.userId ?? base._id ?? data.followingId ?? data.followerId ?? null;

  if (typeof idValue !== "string" && typeof idValue !== "number") return null;

  const nameValue = base.name ?? base.fullName ?? base.displayName ?? base.username;

  const name =
    typeof nameValue === "string" && nameValue.trim().length > 0 ? nameValue.trim() : "Usuário";

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

  const role =
    typeof base.role === "string"
      ? base.role
      : typeof data.role === "string"
      ? data.role
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

  const loginAttempts = typeof base.loginAttempts === "number" ? base.loginAttempts : 0;
  const lockedUntil = typeof base.lockedUntil === "string" ? base.lockedUntil : null;

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
    role,
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
  const data = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

  const rawItems = extractArray(data, key);
  const items = rawItems
    .map(normalizeFollowUser)
    .filter((user): user is UserCardUser => user !== null);

  const meta =
    data.meta && typeof data.meta === "object" ? (data.meta as Record<string, unknown>) : undefined;

  const total = extractNumber(
    data.count,
    data.total,
    data.totalCount,
    data[`${key}Count`],
    meta?.total,
  );

  const pageSize =
    extractNumber(meta?.perPage, data.perPage, params?.perPage) ?? FOLLOW_DEFAULT_PAGE_SIZE;

  const resolvedPageSize = pageSize && pageSize > 0 ? pageSize : FOLLOW_DEFAULT_PAGE_SIZE;

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

function buildFollowQuery(
  base: string,
  params: Record<string, string | number | undefined | null>,
) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

function extractArrayByKeys(
  source: Record<string, unknown>,
  keys: string[],
): unknown[] {
  for (const key of keys) {
    const items = extractArray(source, key);
    if (items.length > 0) return items;
  }
  return [];
}

function normalizeListPayload(
  payload: unknown,
  params?: FollowParams,
  keys: string[] = ["items", "data"],
): FollowListResult {
  const data = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const rawItems = extractArrayByKeys(data, keys);
  const items = rawItems
    .map(normalizeFollowUser)
    .filter((user): user is UserCardUser => user !== null);

  const meta =
    data.meta && typeof data.meta === "object" ? (data.meta as Record<string, unknown>) : undefined;

  const total = extractNumber(
    data.count,
    data.total,
    data.totalCount,
    meta?.total,
    meta?.count,
  );

  const pageSize =
    extractNumber(meta?.perPage, data.perPage, params?.perPage) ?? FOLLOW_DEFAULT_PAGE_SIZE;

  const resolvedPageSize = pageSize && pageSize > 0 ? pageSize : FOLLOW_DEFAULT_PAGE_SIZE;

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

export async function fetchUsers(params: UserListParams = {}): Promise<UserListResponse> {
  const functionPath = buildUsersFunctionPath({
    search: params.search,
    status: params.status,
    page: params.page,
    perPage: params.perPage,
  });

  const response = await invokeFunction<unknown>(functionPath, {
    method: "GET",
  });
  return normalizeListResponse(response);
}

export async function banUser(userId: string, payload?: BanUserPayload): Promise<BanUserResponse> {
  const body = payload ?? DEFAULT_BAN_PAYLOAD;

  const response = await invokeFunction<BanUserResponse>("admin-user-ban", {
    method: "POST",
    body: {
      userId,
      status: "banned",
      reason: body.reason,
      description: body.description,
    },
  });
  return (response ?? {}) as BanUserResponse;
}

export async function unbanUser(
  userId: string,
  payload?: UnbanUserPayload,
): Promise<BanUserResponse> {
  const body = payload ?? DEFAULT_UNBAN_PAYLOAD;

  const response = await invokeFunction<BanUserResponse>("admin-user-ban", {
    method: "POST",
    body: {
      userId,
      status: body.status ?? "active",
      description: body.description,
    },
  });
  return (response ?? {}) as BanUserResponse;
}

export async function fetchUserProfile(userId: string): Promise<UserProfileResponse> {
  const params = new URLSearchParams({ userId: String(userId) });
  const response = await invokeFunction<UserProfileResponse>(`user-profile?${params}`, {
    method: "GET",
  });
  return (response ?? {}) as UserProfileResponse;
}

export async function fetchUserReports(userId: string) {
  const params = new URLSearchParams({ userId: String(userId) });
  const response = await invokeFunction<unknown>(`user-reports?${params}`, {
    method: "GET",
  });
  return response as { items?: unknown[]; total?: number };
}

export async function fetchUserBanStatus(userId: string): Promise<UserStatus | null> {
  const params = new URLSearchParams({ userId: String(userId) });
  const response = await invokeFunction<unknown>(`admin-user-ban?${params}`, {
    method: "GET",
  });
  const data = response && typeof response === "object" ? (response as Record<string, unknown>) : {};
  const raw = typeof data.status === "string" ? data.status : "";
  const normalized = raw.trim().toLowerCase();
  if (normalized === "active" || normalized === "banned") return normalized;
  return null;
}

export async function fetchUserSessionsAdmin(userId: string): Promise<any> {
  const params = new URLSearchParams({ userId: String(userId) });
  const response = await invokeFunction<unknown>(`user-room-history?${params}`, {
    method: "GET",
  });
  return response ?? null;
}

export async function fetchFollowers(
  userId: string,
  params?: FollowParams,
): Promise<FollowListResult> {
  const functionPath = buildFollowQuery("admin-user-follow", {
    userId,
    action: "get-followers",
    page: params?.page,
    perPage: params?.perPage,
  });

  try {
    const response = await invokeFunction<unknown>(functionPath, {
      method: "GET",
    });
    return mapFollowResponse(response, "followers", params);
  } catch (error) {
    console.warn("admin-user-follow (followers) failed, trying legacy user-follow endpoint", error);
    try {
      const legacyFnPath = buildFollowQuery("user-follow", {
        userId,
        action: "get-followers",
        page: params?.page,
        perPage: params?.perPage,
      });
      const legacyResponse = await invokeFunction<unknown>(legacyFnPath, { method: "GET" });
      return mapFollowResponse(legacyResponse, "followers", params);
    } catch {
      // continue to REST fallback
    }

    try {
      const response = await api.get(`/users/${encodeURIComponent(String(userId))}/followers`, {
        params: {
          page: params?.page,
          perPage: params?.perPage,
        },
      });
      return normalizeListPayload(response?.data, params, ["followers", "items", "data"]);
    } catch (legacyError) {
      console.warn("legacy followers endpoint failed", legacyError);
      return {
        items: [],
        total: 0,
        pageSize: params?.perPage ?? FOLLOW_DEFAULT_PAGE_SIZE,
        hasMore: false,
      };
    }
  }
}

export async function fetchFollowing(
  userId: string,
  params?: FollowParams,
): Promise<FollowListResult> {
  const functionPath = buildFollowQuery("admin-user-follow", {
    userId,
    action: "get-following",
    page: params?.page,
    perPage: params?.perPage,
  });
  try {
    const response = await invokeFunction<unknown>(functionPath, {
      method: "GET",
    });
    const primary = mapFollowResponse(response, "following", params);
    if (primary.items.length > 0) return primary;
    const fallback = mapFollowResponse(response, "followers", params);
    return fallback.items.length > 0 ? fallback : primary;
  } catch (error) {
    console.warn("admin-user-follow (following) failed, trying legacy user-follow endpoint", error);
    try {
      const legacyFnPath = buildFollowQuery("user-follow", {
        userId,
        action: "get-following",
        page: params?.page,
        perPage: params?.perPage,
      });
      const legacyResponse = await invokeFunction<unknown>(legacyFnPath, { method: "GET" });
      const primary = mapFollowResponse(legacyResponse, "following", params);
      if (primary.items.length > 0) return primary;
      const fallback = mapFollowResponse(legacyResponse, "followers", params);
      if (fallback.items.length > 0) return fallback;
    } catch {
      // continue to REST fallback
    }

    try {
      const response = await api.get(`/users/${encodeURIComponent(String(userId))}/following`, {
        params: {
          page: params?.page,
          perPage: params?.perPage,
        },
      });
      return normalizeListPayload(response?.data, params, ["following", "items", "data"]);
    } catch (legacyError) {
      console.warn("legacy following endpoint failed", legacyError);
      return {
        items: [],
        total: 0,
        pageSize: params?.perPage ?? FOLLOW_DEFAULT_PAGE_SIZE,
        hasMore: false,
      };
    }
  }
}

export async function fetchTutorFollowing(
  userId: string,
  params?: FollowParams,
): Promise<FollowListResult> {
  const functionPath = buildFollowQuery("admin-user-tutor-follow", {
    userId,
    page: params?.page,
    perPage: params?.perPage,
  });
  try {
    const response = await invokeFunction<unknown>(functionPath, { method: "GET" });
    return normalizeListPayload(response, params, ["following", "items", "data"]);
  } catch (error) {
    console.warn("admin-user-tutor-follow failed, trying legacy user-tutor-follow", error);
    try {
      const legacyPath = buildFollowQuery("user-tutor-follow", {
        action: "get-following",
        userId,
        page: params?.page,
        perPage: params?.perPage,
      });
      const response = await invokeFunction<unknown>(legacyPath, { method: "GET" });
      return normalizeListPayload(response, params, ["following", "items", "data"]);
    } catch (legacyError) {
      console.warn("user-tutor-follow failed", legacyError);
      return {
        items: [],
        total: 0,
        pageSize: params?.perPage ?? FOLLOW_DEFAULT_PAGE_SIZE,
        hasMore: false,
      };
    }
  }
}

export type FollowStatsResult = {
  followers: number;
  following: number;
  followersUsers?: number | null;
  followersTutors?: number | null;
  followingUsers?: number | null;
  followingTutors?: number | null;
};

export async function fetchFollowStats(userId: string): Promise<FollowStatsResult> {
  const functionPath = buildFollowQuery("get-follow-stats", {
    userId,
    includeTutor: "true",
  });
  const response = await invokeFunction<unknown>(functionPath, { method: "GET" });
  const data = response && typeof response === "object" ? (response as Record<string, unknown>) : {};

  const followersUsers = extractNumber(
    data.followersCount,
    data.followers,
    data.followersTotal,
    data.totalFollowers,
    (data.followers as Record<string, unknown> | undefined)?.count,
    (data.followers as Record<string, unknown> | undefined)?.total,
  );
  const followingUsers = extractNumber(
    data.followingCount,
    data.following,
    data.followingTotal,
    data.totalFollowing,
    (data.following as Record<string, unknown> | undefined)?.count,
    (data.following as Record<string, unknown> | undefined)?.total,
  );
  const followersTutors = extractNumber(
    data.followersTutorsCount,
    data.followersTutorCount,
    data.tutorFollowersCount,
    data.tutorFollowers,
  );
  const followingTutors = extractNumber(
    data.followingTutorsCount,
    data.followingTutorCount,
    data.tutorFollowingCount,
    data.tutorFollowing,
  );

  const followers =
    extractNumber(data.totalFollowers, data.total_followers, data.followersTotal) ??
    (followersUsers ?? 0) + (followersTutors ?? 0);
  const following =
    extractNumber(data.totalFollowing, data.total_following, data.followingTotal) ??
    (followingUsers ?? 0) + (followingTutors ?? 0);

  return {
    followers,
    following,
    followersUsers: followersUsers ?? null,
    followersTutors: followersTutors ?? null,
    followingUsers: followingUsers ?? null,
    followingTutors: followingTutors ?? null,
  };
}
