// src/features/instructors/api.ts
import api, { invokeFunction } from "@/services/api";
import type {
  InstructorCardData,
  InstructorFollower,
  InstructorFollowersParams,
  InstructorFollowersResult,
  InstructorListParams,
  InstructorListResponse,
  InstructorListMeta,
  InstructorProfile,
  InstructorProfileActivity,
  InstructorProfileReport,
  InstructorStatus,
} from "@/types/tutor";

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    const str = toString(value);
    if (str) return str;
  }
  return null;
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const num = toNumber(value);
    if (typeof num === "number") return num;
  }
  return null;
}

function normalizeTopics(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : null))
      .filter((item): item is string => !!item && item.length > 0);
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return normalizeTopics(obj.items ?? obj.data ?? obj.list ?? obj.results);
  }
  return [];
}

function normalizeStatus(value: unknown): InstructorStatus {
  const status = toString(value);
  switch (status) {
    case "pending":
      return "pending";
    case "banned":
      return "banned";
    case "inactive":
      return "inactive";
    default:
      return "active";
  }
}

function extractArray(payload: unknown): unknown[] {
  const visited = new Set<unknown>();
  const stack: unknown[] = [payload];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;

    if (Array.isArray(current)) {
      return current.filter((item) => item !== null && item !== undefined);
    }

    if (typeof current === "object") {
      visited.add(current);
      for (const value of Object.values(current as Record<string, unknown>)) {
        stack.push(value);
      }
    }
  }

  return [];
}

function extractMeta(payload: unknown): InstructorListMeta {
  const visited = new Set<unknown>();
  const stack: unknown[] = [payload];
  const totalKeys = ["total", "count", "totalCount"];
  const pageKeys = ["page", "currentPage"];
  const perPageKeys = ["perPage", "pageSize", "limit"];
  const totalPagesKeys = ["totalPages", "pages"];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current) || Array.isArray(current)) continue;

    if (typeof current === "object") {
      visited.add(current);
      const source = current as Record<string, unknown>;

      const total = totalKeys.reduce<number | undefined>(
        (acc, key) => acc ?? toNumber(source[key]),
        undefined,
      );
      const page = pageKeys.reduce<number | undefined>(
        (acc, key) => acc ?? toNumber(source[key]),
        undefined,
      );
      const perPage = perPageKeys.reduce<number | undefined>(
        (acc, key) => acc ?? toNumber(source[key]),
        undefined,
      );
      const totalPages = totalPagesKeys.reduce<number | undefined>(
        (acc, key) => acc ?? toNumber(source[key]),
        undefined,
      );

      if (
        total !== undefined ||
        page !== undefined ||
        perPage !== undefined ||
        totalPages !== undefined
      ) {
        return { total, page, perPage, totalPages };
      }

      for (const value of Object.values(source)) {
        stack.push(value);
      }
    }
  }

  return {};
}

function normalizeListResponse(payload: unknown): InstructorListResponse {
  return {
    data: extractArray(payload),
    meta: extractMeta(payload),
  };
}

const DEFAULT_FOLLOWERS_PAGE_SIZE = 20;

export function adaptInstructor(raw: unknown): InstructorCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const base =
    data.tutor && typeof data.tutor === "object"
      ? (data.tutor as Record<string, unknown>)
      : data.profile && typeof data.profile === "object"
      ? (data.profile as Record<string, unknown>)
      : data;

  // id in API may be number or string; accept numeric ids by converting to string
  const rawId = pickString(base.id, base.tutorId, base._id, data.id, data.tutorId, data._id);
  const numericId = pickNumber(base.id, base.tutorId, base._id, data.id, data.tutorId, data._id);
  const id = rawId ?? (typeof numericId === "number" ? String(numericId) : null);
  if (!id) return null;

  const name =
    pickString(
      base.name,
      base.fullName,
      base.displayName,
      data.name,
      data.fullName,
      data.displayName,
    ) ?? "Instrutor sem nome";

  const codename = pickString(
    base.codename,
    base.codinome,
    base.username,
    data.codename,
    data.codinome,
    data.username,
  );

  const email = pickString(base.email, data.email);
  const phone = pickString(base.phone, data.phone);
  const bio = pickString(base.about, base.bio, data.about, data.bio);
  const avatarUrl = pickString(
    base.avatarUrl,
    base.photoUrl,
    base.picture,
    base.imageUrl,
    data.avatarUrl,
    data.photoUrl,
  );
  const topics = normalizeTopics(base.topics ?? data.topics ?? data.tags);
  const role = pickString(base.role, base.jobTitle, data.role, data.jobTitle);
  const status = normalizeStatus(base.status ?? data.status);

  return {
    id,
    name,
    codename,
    email,
    phone,
    bio,
    avatarUrl,
    topics,
    role,
    status,
  };
}

const SESSION_KEYS = [
  "liveSessions",
  "sessions",
  "liveHistory",
  "activity",
  "rooms",
  "history",
  "liveChatHistory",
];

const FOLLOWERS_KEYS = ["followers", "items", "data", "list", "results"];
const REPORTS_KEYS = ["reports", "complaints", "denuncias"];

function findFirstArrayByKeys(
  payload: unknown,
  keys: string[],
  visited = new Set<unknown>(),
): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object" || visited.has(payload)) return null;
  visited.add(payload);
  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    if (key in record) {
      const value = record[key];
      if (Array.isArray(value)) return value;
      const nested = findFirstArrayByKeys(value, keys, visited);
      if (nested) return nested;
    }
  }

  for (const value of Object.values(record)) {
    const nested = findFirstArrayByKeys(value, keys, visited);
    if (nested) return nested;
  }

  return null;
}

function deepSearchNumber(
  payload: unknown,
  keys: string[],
  visited = new Set<unknown>(),
): number | null {
  const direct = toNumber(payload);
  if (direct !== undefined) return direct;

  if (!payload || typeof payload !== "object" || visited.has(payload)) return null;
  visited.add(payload);

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const result = deepSearchNumber(item, keys, visited);
      if (typeof result === "number") return result;
    }
    return null;
  }

  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    if (key in record) {
      const result = deepSearchNumber(record[key], keys, visited);
      if (typeof result === "number") return result;
    }
  }

  for (const value of Object.values(record)) {
    const result = deepSearchNumber(value, keys, visited);
    if (typeof result === "number") return result;
  }

  return null;
}

function normalizeInstructorSessionEntry(raw: unknown): InstructorProfileActivity | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const id = pickString(item.id, item.sessionId, item.roomId, item._id, item.uuid, item.code);
  if (!id) return null;

  const title =
    pickString(item.title, item.sessionTitle, item.roomTitle, item.topic, item.name) ??
    "Sessão sem título";

  const start = pickString(
    item.startTime,
    item.startAt,
    item.beginAt,
    item.dateStart,
    item.start_date,
    item.start,
  );
  const end = pickString(
    item.endTime,
    item.endAt,
    item.finishAt,
    item.dateEnd,
    item.end_date,
    item.end,
  );

  const duration =
    pickNumber(item.durationMinutes, item.duration, item.lengthMinutes, item.timeMinutes) ?? null;

  const participants =
    pickNumber(
      item.participantsCount,
      item.participants,
      item.totalParticipants,
      item.viewers,
      item.audience,
      item.onlineCount,
    ) ?? null;

  const status = pickString(item.status, item.state, item.situation, item.progress);

  const liveInput = item.isLive ?? item.live ?? item.inProgress ?? item.active;
  const isLive =
    typeof liveInput === "boolean"
      ? liveInput
      : typeof liveInput === "string"
      ? ["live", "ao vivo", "inprogress", "true", "sim", "ativo"].includes(
          liveInput.trim().toLowerCase(),
        )
      : false;

  const roomId = pickString(item.roomId, item.roomCode, item.sessionCode, item.slug);

  return {
    id,
    title,
    startTime: start ?? null,
    endTime: end ?? null,
    durationMinutes: duration,
    participantsCount: participants,
    isLive,
    status: status ?? null,
    roomId: roomId ?? null,
  };
}

function normalizeInstructorSessions(payload: unknown): InstructorProfileActivity[] {
  const array = findFirstArrayByKeys(payload, SESSION_KEYS);
  if (!array) return [];
  return array
    .map((item) => normalizeInstructorSessionEntry(item))
    .filter((item): item is InstructorProfileActivity => item !== null);
}

function collectFollowersArray(payload: unknown): unknown[] {
  const array = findFirstArrayByKeys(payload, FOLLOWERS_KEYS);
  return Array.isArray(array) ? array : [];
}

function collectReportsArray(payload: unknown): unknown[] {
  const array = findFirstArrayByKeys(payload, REPORTS_KEYS);
  return Array.isArray(array) ? array : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getValue(record: Record<string, unknown> | null, key: string): unknown {
  return record ? record[key] : undefined;
}

function pickNumberFromRecord(
  record: Record<string, unknown> | null,
  keys: string[],
): number | null {
  if (!record) return null;
  return pickNumber(...keys.map((key) => record[key]));
}

function findStatsBlock(
  payload: unknown,
  visited = new Set<unknown>(),
): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || visited.has(payload)) return null;
  visited.add(payload);

  const record = asRecord(payload);
  if (record) {
    const statsCandidate = asRecord(getValue(record, "stats"));
    if (statsCandidate) return statsCandidate;

    const keysOfInterest = [
      "followersCount",
      "followers_total",
      "followersTotal",
      "totalFollowers",
      "countFollowers",
      "reportsTotal",
      "reportsCount",
      "totalReports",
      "complaintsCount",
      "denunciasCount",
      "liveSessionsTotal",
      "sessionsTotal",
      "liveHistoryTotal",
      "activityTotal",
      "roomsTotal",
    ];

    if (keysOfInterest.some((key) => key in record)) {
      return record;
    }
  }

  const values = Array.isArray(payload)
    ? (payload as unknown[])
    : Object.values(payload as Record<string, unknown>);

  for (const value of values) {
    const found = findStatsBlock(value, visited);
    if (found) return found;
  }

  return null;
}

function normalizeInstructorFollowerEntry(raw: unknown): InstructorFollower | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const base = asRecord(data.user) ?? asRecord(data.profile) ?? data;

  const id = pickString(
    base?.id,
    base?.userId,
    base?._id,
    data.id,
    data.userId,
    data._id,
    data.followerId,
    data.followId,
  );
  if (!id) return null;

  const name =
    pickString(base?.name, base?.fullName, base?.displayName, base?.username) ?? "Usuário";
  const codename = pickString(base?.codename, base?.codinome, base?.username, data.codename);
  const email = pickString(base?.email, data.email);
  const phone = pickString(base?.phone, data.phone);
  const avatarUrl = pickString(
    base?.avatarUrl,
    base?.photoUrl,
    base?.picture,
    base?.imageUrl,
    data.avatarUrl,
    data.photoUrl,
  );
  const followedAt = pickString(
    data.followedAt,
    data.createdAt,
    data.updatedAt,
    data.joinedAt,
    data.date,
  );

  return {
    id,
    name,
    codename,
    email,
    phone,
    avatarUrl,
    followedAt,
  };
}

function normalizeInstructorReportEntry(raw: unknown): InstructorProfileReport | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const id = pickString(data.id, data.reportId, data._id, data.uuid, data.code);
  if (!id) return null;

  const authorName = pickString(
    data.authorName,
    data.author,
    data.reporterName,
    data.createdBy,
    data.moderator,
  );

  const reason = pickString(data.reason, data.type, data.title, data.category, data.subject);

  const description = pickString(
    data.description,
    data.details,
    data.message,
    data.content,
    data.body,
  );

  const createdAt = pickString(
    data.createdAt,
    data.created_at,
    data.reportedAt,
    data.date,
    data.timestamp,
  );

  return {
    id,
    authorName,
    reason,
    description,
    createdAt,
  };
}

function extractInstructorProfileExtras(payload: unknown): {
  followersCount: number;
  reportsTotal: number;
  reports: InstructorProfileReport[];
  liveSessions: InstructorProfileActivity[];
  liveSessionsTotal: number;
} {
  const statsRecord = findStatsBlock(payload);

  const followersNode = asRecord(getValue(statsRecord, "followers"));
  const reportsNode = asRecord(getValue(statsRecord, "reports"));
  const complaintsNode = asRecord(getValue(statsRecord, "complaints"));
  const denunciasNode = asRecord(getValue(statsRecord, "denuncias"));

  const followersCount =
    pickNumberFromRecord(statsRecord, [
      "followersCount",
      "followers_total",
      "followersTotal",
      "totalFollowers",
      "countFollowers",
    ]) ??
    pickNumber(getValue(statsRecord, "followers")) ??
    pickNumberFromRecord(followersNode, ["total", "count", "followersCount"]) ??
    0;

  const reportsTotal =
    pickNumberFromRecord(statsRecord, [
      "reportsTotal",
      "reportsCount",
      "totalReports",
      "complaintsCount",
      "denunciasCount",
    ]) ??
    pickNumberFromRecord(reportsNode, ["total", "count"]) ??
    pickNumberFromRecord(complaintsNode, ["total", "count"]) ??
    pickNumberFromRecord(denunciasNode, ["total", "count"]) ??
    pickNumber(getValue(statsRecord, "reports")) ??
    0;

  const liveSessions = normalizeInstructorSessions(payload);

  const liveSessionsTotal =
    pickNumberFromRecord(statsRecord, [
      "liveSessionsTotal",
      "sessionsTotal",
      "liveHistoryTotal",
      "activityTotal",
      "roomsTotal",
    ]) ??
    deepSearchNumber(payload, [
      "liveSessionsTotal",
      "sessionsTotal",
      "liveHistoryTotal",
      "activityTotal",
      "roomsTotal",
    ]) ??
    liveSessions.length;

  const reports = collectReportsArray(payload)
    .map(normalizeInstructorReportEntry)
    .filter((item): item is InstructorProfileReport => item !== null);

  return { followersCount, reportsTotal, reports, liveSessions, liveSessionsTotal };
}

function adaptInstructorProfilePayload(payload: unknown): InstructorProfile | null {
  let base: InstructorCardData | null = null;

  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    const candidates = [source.profile, source.tutor, source.data, source.result, payload];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const adapted = adaptInstructor(candidate);
      if (adapted) {
        base = adapted;
        break;
      }
    }
  } else {
    base = adaptInstructor(payload);
  }

  if (!base) return null;

  const extras = extractInstructorProfileExtras(payload);

  return {
    ...base,
    followersCount: extras.followersCount,
    reportsTotal: extras.reportsTotal,
    reports: extras.reports,
    liveSessions: extras.liveSessions,
    liveSessionsTotal: extras.liveSessionsTotal,
  };
}

function extractNumberByKeys(payload: unknown, keys: string[]): number | null {
  const visited = new Set<unknown>();
  const stack: unknown[] = [payload];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;

    if (Array.isArray(current)) {
      for (const value of current) stack.push(value);
      continue;
    }

    if (typeof current === "object") {
      visited.add(current);
      const record = current as Record<string, unknown>;
      for (const key of keys) {
        if (key in record) {
          const num = toNumber(record[key]);
          if (typeof num === "number") return num;
        }
      }
      for (const value of Object.values(record)) {
        stack.push(value);
      }
    }
  }

  return null;
}

const FOLLOWERS_TOTAL_KEYS = [
  "followersCount",
  "followers_total",
  "followersTotal",
  "totalFollowers",
  "countFollowers",
  "total",
  "count",
  "totalCount",
];

const PAGE_SIZE_KEYS = ["perPage", "pageSize", "limit"];

export type UpdateInstructorPayload = {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string | null;
  about?: string | null;
};

type UpdateInstructorOptions = {
  photoFile?: File | Blob | null;
};

export async function fetchInstructors(
  params: InstructorListParams = {},
): Promise<InstructorListResponse> {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 12;
  const query: Record<string, unknown> = {
    page,
    perPage,
    limit: perPage,
    search: params.search,
    status: params.status,
  };
  Object.keys(query).forEach((key) => query[key] === undefined && delete query[key]);
  const response = await api({
    url: "user-tutor-list?action=list",
    method: "GET",
    params: query,
  });
  return normalizeListResponse(response.data);
}

export async function fetchInstructorProfile(id: string): Promise<InstructorProfile | null> {
  if (!id) return null;
  const response = await invokeFunction<unknown>("tutor", {
    method: "GET",
    body: { tutorId: id },
  });
  return adaptInstructorProfilePayload(response);
}

export async function fetchTutorSessionsAdmin(tutorId: string): Promise<{
  tutor?: unknown;
  live: unknown[];
  upcoming: unknown[];
  finished: unknown[];
} | null> {
  if (!tutorId) return null;
  try {
    const payload = await invokeFunction<{
      tutor?: unknown;
      live?: unknown[];
      upcoming?: unknown[];
      finished?: unknown[];
    }>("list-live-chat-room-by-tutor", {
      method: "GET",
      body: { tutorId },
    });
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    const live = Array.isArray(p.live) ? p.live : [];
    const upcoming = Array.isArray(p.upcoming) ? p.upcoming : [];
    const finished = Array.isArray(p.finished) ? p.finished : [];
    return { tutor: p.tutor, live, upcoming, finished };
  } catch (e) {
    return null;
  }
}

export async function fetchInstructorFollowers(
  tutorId: string,
  params: InstructorFollowersParams = {},
): Promise<InstructorFollowersResult> {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? DEFAULT_FOLLOWERS_PAGE_SIZE;
  const query: Record<string, unknown> = { page, perPage, limit: perPage };
  const payload = await invokeFunction<unknown>("tutor-follow", {
    method: "GET",
    body: { tutorId, ...query },
  });
  const items = collectFollowersArray(payload)
    .map(normalizeInstructorFollowerEntry)
    .filter((item): item is InstructorFollower => item !== null);
  const total = extractNumberByKeys(payload, FOLLOWERS_TOTAL_KEYS);
  const perPageFromResponse = extractNumberByKeys(payload, PAGE_SIZE_KEYS);
  const pageSize =
    typeof perPageFromResponse === "number" && perPageFromResponse > 0
      ? perPageFromResponse
      : perPage;
  const hasMore = typeof total === "number" ? page * pageSize < total : items.length === pageSize;
  return {
    items,
    total: typeof total === "number" ? total : null,
    pageSize,
    hasMore,
  };
}

export async function updateInstructor(
  tutorId: string,
  payload: UpdateInstructorPayload,
  options: UpdateInstructorOptions = {},
): Promise<InstructorProfile | null> {
  if (!tutorId) throw new Error("Missing tutorId");
  const responses: unknown[] = [];
  const bodyEntries = Object.entries(payload).filter(([, value]) => value !== undefined);
  if (bodyEntries.length > 0) {
    const body = Object.fromEntries(bodyEntries);
    const res = await invokeFunction<unknown>("tutor", {
      method: "PUT",
      body: { tutorId, ...body },
    });
    responses.push(res);
  }
  if (options.photoFile) {
    const fd = new FormData();
    fd.append("photo", options.photoFile);
    fd.append("tutorId", tutorId);
    const res = await invokeFunction<unknown>("tutor-photo", {
      method: "POST",
      body: fd,
    });
    responses.push(res);
  }
  for (let i = responses.length - 1; i >= 0; i -= 1) {
    const adapted = adaptInstructorProfilePayload(responses[i]);
    if (adapted) return adapted;
  }
  return null;
}

export async function deleteInstructor(id: string): Promise<void> {
  if (!id) return;
  await invokeFunction("tutor", { method: "DELETE", body: { tutorId: id } });
}
