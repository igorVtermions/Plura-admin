import { invokeFunction } from "./api";

export interface LiveChatRoom {
  id: string;
  title: string;
  instructor: {
    name: string;
    role?: string | null;
  };
  participants_count: number;
  startAt?: string | null;
  endAt?: string | null;
  topics?: string[];
  description?: string | null;
  liveUsers?: Array<{
    id?: string | number;
    name?: string;
    photoUrl?: string;
  }>;
}

export type LiveRoomStatus = "live" | "soon" | "all";

export type LiveChatParticipant = {
  id: string;
  name: string;
  avatarUrl: string;
  role?: string;
};

export type LiveChatMessage = {
  id: string;
  senderName: string;
  content: string;
  time: string;
  type: "incoming" | "outgoing";
  isTutor?: boolean;
  isAdmin?: boolean;
};

type LiveChatRoomApiResponse = {
  id: string | number;
  title?: string;
  name?: string;
  tutor?: {
    name?: string;
    role?: string;
  };
  participants_count?: number;
  description?: string;
  startAt?: string;
  endAt?: string;
  topics?: unknown;
  liveUsers?: Array<unknown>;
};

export interface FetchLiveChatRoomsOptions {
  status?: LiveRoomStatus;
  topics?: string;
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["items", "data", "list", "rows", "messages", "participants"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function toTimeLabel(value?: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
  try {
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getCurrentAuthUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = window.localStorage.getItem("token");
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    const sub = payload?.sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

export const fetchLiveChatRooms = async (
  options: FetchLiveChatRoomsOptions = {},
): Promise<LiveChatRoom[]> => {
  const params = new URLSearchParams();
  const status = options.status ?? "live";
  params.set("status", status);
  if (options.topics) {
    params.set("topics", options.topics);
  }

  const functionName =
    params.size > 0 ? `users-live-chat-rooms?${params.toString()}` : "users-live-chat-rooms";

  const data = await invokeFunction<LiveChatRoomApiResponse[]>(functionName, {
    method: "GET",
  });

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((room) => {
      const id = room?.id != null ? String(room.id) : "";
      const title = room?.title ?? room?.name ?? "";
      if (!id || !title) return null;
      const liveUsers = Array.isArray(room?.liveUsers)
        ? room.liveUsers
            .map((user) => {
              if (!user || typeof user !== "object") return null;
              const u = user as Record<string, unknown>;
              return {
                id: u.id ?? u.userId ?? u.uid ?? undefined,
                name: typeof u.name === "string" ? u.name : undefined,
                photoUrl: typeof u.photoUrl === "string" ? u.photoUrl : undefined,
              };
            })
            .filter((user): user is { id?: string | number; name?: string; photoUrl?: string } => !!user)
        : [];
      return {
        id,
        title,
        instructor: {
          name: room?.tutor?.name ?? "Instrutor",
          role: room?.tutor?.role ?? null,
        },
        participants_count:
          typeof room?.participants_count === "number"
            ? room.participants_count
            : liveUsers.length,
        startAt: room?.startAt ?? null,
        endAt: room?.endAt ?? null,
        topics: Array.isArray(room?.topics)
          ? room.topics.filter((topic): topic is string => typeof topic === "string")
          : undefined,
        description: room?.description ?? null,
        liveUsers,
      };
    })
    .filter((room): room is LiveChatRoom => room !== null);
};

export const fetchLiveChatRoomParticipants = async (
  roomId: string,
): Promise<LiveChatParticipant[]> => {
  if (!roomId) return [];
  const payload = await invokeFunction<unknown>(
    `users-live-chat-rooms-participants?roomId=${encodeURIComponent(roomId)}`,
    { method: "GET" },
  );
  return extractArray(payload)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;
      const idValue = entry.id ?? entry.userId ?? entry.uid ?? entry.userUid;
      const id = idValue != null ? String(idValue) : null;
      if (!id) return null;
      const name =
        typeof entry.nome === "string"
          ? entry.nome
          : typeof entry.name === "string"
          ? entry.name
          : typeof entry.codinome === "string"
          ? entry.codinome
          : "Usuario";
      const avatarUrl =
        typeof entry.photoUrl === "string" && entry.photoUrl.length > 0
          ? entry.photoUrl
          : "/UserCircle.svg";
      const roleValue = typeof entry.role === "string" ? entry.role.toLowerCase() : "";
      const isTutor = Boolean(entry.isTutorParticipant) || Boolean(entry.tutorId);
      const isAdmin = Boolean(entry.isAdmin) || Boolean(entry.adminId);
      const role = isAdmin ? "admin" : isTutor ? "tutor" : roleValue || "user";
      return { id, name, avatarUrl, role };
    })
    .filter((item): item is LiveChatParticipant => item !== null);
};

export const fetchLiveChatRoomMessages = async (
  roomId: string,
): Promise<LiveChatMessage[]> => {
  if (!roomId) return [];
  const currentUserUid = getCurrentAuthUserId();
  const payload = await invokeFunction<unknown>(
    `user-live-chat-messages?roomId=${encodeURIComponent(roomId)}`,
    { method: "GET" },
  );
  return extractArray(payload)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;
      const idValue = entry.id ?? entry.messageId ?? entry.uuid ?? entry.createdAt;
      const id = idValue != null ? String(idValue) : null;
      if (!id) return null;
      const senderName =
        typeof entry.senderName === "string"
          ? entry.senderName
          : typeof entry.userName === "string"
          ? entry.userName
          : typeof entry.nome === "string"
          ? entry.nome
          : "Usuario";
      const content =
        typeof entry.content === "string"
          ? entry.content
          : typeof entry.message === "string"
          ? entry.message
          : typeof entry.text === "string"
          ? entry.text
          : "";
      const time = toTimeLabel(
        typeof entry.createdAt === "string"
          ? entry.createdAt
          : typeof entry.sentAt === "string"
          ? entry.sentAt
          : typeof entry.time === "string"
          ? entry.time
          : null,
      );
      const entryUserUid =
        typeof entry.userUid === "string"
          ? entry.userUid
          : typeof entry.userUid === "number"
          ? String(entry.userUid)
          : null;
      const isOutgoingByUid =
        Boolean(currentUserUid) && Boolean(entryUserUid) && entryUserUid === currentUserUid;
      const type =
        entry.type === "outgoing" || entry.type === "incoming"
          ? (entry.type as "outgoing" | "incoming")
          : isOutgoingByUid
          ? "outgoing"
          : "incoming";
      const roleValue =
        typeof entry.role === "string"
          ? entry.role
          : typeof entry.senderRole === "string"
          ? entry.senderRole
          : typeof entry.userRole === "string"
          ? entry.userRole
          : null;
      const isTutor =
        Boolean(entry.isTutor) ||
        Boolean(entry.tutorId) ||
        (typeof roleValue === "string" && roleValue.toLowerCase() === "tutor");
      const isAdmin =
        Boolean(entry.isAdmin) ||
        Boolean(entry.adminId) ||
        (typeof roleValue === "string" && roleValue.toLowerCase() === "admin");
      return { id, senderName, content, time, type, isTutor, isAdmin };
    })
    .filter((item): item is LiveChatMessage => item !== null);
};

export const sendLiveChatRoomMessage = async (
  roomId: string,
  message: string,
): Promise<void> => {
  if (!roomId || !message.trim()) return;
  await invokeFunction(`user-live-chat-messages?roomId=${encodeURIComponent(roomId)}`, {
    method: "POST",
    body: { roomId, message, content: message, text: message },
  });
};

export const joinLiveChatRoom = async (roomId: string): Promise<void> => {
  if (!roomId) return;
  await invokeFunction(`user-live-chat-membership?action=join&roomId=${encodeURIComponent(roomId)}`, {
    method: "POST",
  });
};

export const leaveLiveChatRoom = async (roomId: string): Promise<void> => {
  if (!roomId) return;
  await invokeFunction(`user-live-chat-membership?action=leave&roomId=${encodeURIComponent(roomId)}`, {
    method: "POST",
  });
};

export const deleteLiveChatRoom = async (roomId: string): Promise<void> => {
  if (!roomId) return;

  const candidates: Array<() => Promise<unknown>> = [
    () =>
      invokeFunction("admin-room-action", {
        method: "POST",
        body: { action: "delete", roomId },
      }),
    () =>
      invokeFunction(`user-live-chat-membership?action=admin-delete&roomId=${encodeURIComponent(roomId)}`, {
        method: "POST",
        body: { action: "admin-delete", roomId },
      }),
    () =>
      invokeFunction(`users-live-chat-rooms?roomId=${encodeURIComponent(roomId)}`, {
        method: "DELETE",
      }),
    () =>
      invokeFunction("users-live-chat-rooms", {
        method: "DELETE",
        body: { roomId },
      }),
    () =>
      invokeFunction("users-live-chat-rooms", {
        method: "POST",
        body: { action: "delete", roomId },
      }),
  ];

  let lastError: unknown = null;
  for (const call of candidates) {
    try {
      await call();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("DELETE_ROOM_FAILED");
};
