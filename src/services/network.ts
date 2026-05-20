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
  isDeleted?: boolean;
  senderUid?: string | null;
  userId?: string | null;
  userPhotoUrl?: string | null;
  userStatus?: string | null;
  attachments?: LiveChatAttachment[];
};

export type LiveChatAttachment = {
  url: string;
  name: string;
  mimeType?: string | null;
  type: "image" | "pdf" | "file";
};

export type TopicChat = {
  id: string;
  roomId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
};

export type TopicChatUserProfile = {
  id: string;
  authId?: string | null;
  name?: string | null;
  codinome?: string | null;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  status?: string | null;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function inferAttachmentType(url: string, mimeType?: string | null): LiveChatAttachment["type"] {
  const mime = (mimeType ?? "").toLowerCase();
  const cleanUrl = url.split("?")[0]?.toLowerCase() ?? "";
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(cleanUrl)) {
    return "image";
  }
  if (mime === "application/pdf" || cleanUrl.endsWith(".pdf")) {
    return "pdf";
  }
  return "file";
}

function normalizeAttachment(raw: unknown): LiveChatAttachment | null {
  if (typeof raw === "string") {
    const url = raw.trim();
    if (!url) return null;
    const fallbackName = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "Arquivo");
    return {
      url,
      name: fallbackName,
      type: inferAttachmentType(url),
    };
  }

  const data = asRecord(raw);
  if (!data) return null;
  const url = pickString(data, [
    "url",
    "uri",
    "href",
    "src",
    "fileUrl",
    "file_url",
    "mediaUrl",
    "media_url",
    "attachmentUrl",
    "attachment_url",
    "imageUrl",
    "image_url",
    "pdfUrl",
    "pdf_url",
    "downloadUrl",
    "download_url",
  ]);
  if (!url) return null;

  const mimeType = pickString(data, ["mimeType", "mime_type", "contentType", "content_type", "type"]);
  const name =
    pickString(data, ["name", "fileName", "file_name", "filename", "title"]) ??
    decodeURIComponent(url.split("/").pop()?.split("?")[0] || "Arquivo");

  return {
    url,
    name,
    mimeType,
    type: inferAttachmentType(url, mimeType),
  };
}

function normalizeAttachments(entry: Record<string, unknown>): LiveChatAttachment[] {
  const meta = asRecord(entry.meta) ?? asRecord(entry.metadata) ?? {};
  if (entry.deleted === true || meta.deleted === true) return [];
  const candidates: unknown[] = [
    entry.attachments,
    entry.attachment,
    entry.files,
    entry.file,
    entry.media,
    meta.attachments,
    meta.attachment,
    meta.files,
    meta.file,
    meta.media,
  ];

  const directUrl = pickString(entry, [
    "fileUrl",
    "file_url",
    "mediaUrl",
    "media_url",
    "attachmentUrl",
    "attachment_url",
    "imageUrl",
    "image_url",
    "pdfUrl",
    "pdf_url",
  ]);
  const metaUrl = pickString(meta, [
    "fileUrl",
    "file_url",
    "mediaUrl",
    "media_url",
    "attachmentUrl",
    "attachment_url",
    "imageUrl",
    "image_url",
    "pdfUrl",
    "pdf_url",
  ]);

  if (directUrl) {
    candidates.push({
      url: directUrl,
      name: pickString(entry, ["fileName", "file_name", "filename", "name", "title"]),
      mimeType: pickString(entry, ["mimeType", "mime_type", "contentType", "content_type"]),
    });
  }
  if (metaUrl) {
    candidates.push({
      url: metaUrl,
      name: pickString(meta, ["fileName", "file_name", "filename", "name", "title"]),
      mimeType: pickString(meta, ["mimeType", "mime_type", "contentType", "content_type"]),
    });
  }

  const flat = candidates.flatMap((candidate) =>
    Array.isArray(candidate) ? candidate : candidate ? [candidate] : [],
  );

  const seen = new Set<string>();
  return flat
    .map(normalizeAttachment)
    .filter((attachment): attachment is LiveChatAttachment => {
      if (!attachment || seen.has(attachment.url)) return false;
      seen.add(attachment.url);
      return true;
    });
}

function normalizeTopicChat(raw: unknown): TopicChat | null {
  const data = asRecord(raw);
  if (!data) return null;
  const id = data.id != null ? String(data.id) : "";
  const roomId = data.roomId != null ? String(data.roomId) : data.room_id != null ? String(data.room_id) : id;
  const name = pickString(data, ["name", "title", "label", "slug"]) ?? "";
  if (!id || !roomId || !name) return null;
  return {
    id,
    roomId,
    name,
    slug: pickString(data, ["slug"]),
    description: pickString(data, ["description"]),
  };
}

function normalizeTopicMessage(item: unknown): LiveChatMessage | null {
  const entry = asRecord(item);
  if (!entry) return null;
  const idValue = entry.id ?? entry.messageId ?? entry.createdAt;
  const id = idValue != null ? String(idValue) : null;
  if (!id) return null;

  const deleted = entry.deleted === true || entry.isDeleted === true;
  const content =
    typeof entry.content === "string"
      ? entry.content
      : typeof entry.message === "string"
      ? entry.message
      : typeof entry.text === "string"
      ? entry.text
      : "";
  const createdAt =
    typeof entry.createdAt === "string"
      ? entry.createdAt
      : typeof entry.created_at === "string"
      ? entry.created_at
      : null;
  const senderName =
    pickString(entry, ["senderName", "sender_name", "userName", "userCodinome", "name"]) ?? "Usuario";

  return {
    id,
    senderName,
    content: deleted ? "Mensagem apagada pelo administrador da sala" : content,
    time: toTimeLabel(createdAt),
    type: "incoming",
    isDeleted: deleted,
    senderUid: pickString(entry, ["senderUid", "sender_uid"]),
    userId: pickString(entry, ["userId", "user_id"]),
    userPhotoUrl: pickString(entry, ["userPhotoUrl", "photoUrl", "avatarUrl"]),
    userStatus: pickString(entry, ["userStatus", "status"]),
    attachments: deleted ? [] : normalizeAttachments(entry),
  };
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

  const rooms: LiveChatRoom[] = [];
  for (const room of data) {
    const id = room?.id != null ? String(room.id) : "";
    const title = room?.title ?? room?.name ?? "";
    if (!id || !title) continue;

    const liveUsers = Array.isArray(room?.liveUsers)
      ? room.liveUsers.flatMap((user) => {
          if (!user || typeof user !== "object") return [];
          const u = user as Record<string, unknown>;
          const userId = u.id ?? u.userId ?? u.uid;
          return [
            {
              id:
                typeof userId === "string" || typeof userId === "number"
                  ? userId
                  : undefined,
              name: typeof u.name === "string" ? u.name : undefined,
              photoUrl: typeof u.photoUrl === "string" ? u.photoUrl : undefined,
            },
          ];
        })
      : [];

    rooms.push({
      id,
      title,
      instructor: {
        name: room?.tutor?.name ?? "Instrutor",
        role: room?.tutor?.role ?? null,
      },
      participants_count:
        typeof room?.participants_count === "number" ? room.participants_count : liveUsers.length,
      startAt: room?.startAt ?? null,
      endAt: room?.endAt ?? null,
      topics: Array.isArray(room?.topics)
        ? room.topics.filter((topic): topic is string => typeof topic === "string")
        : undefined,
      description: room?.description ?? null,
      liveUsers,
    });
  }

  return rooms;
};

export const fetchLiveChatRoomParticipants = async (
  roomId: string,
): Promise<LiveChatParticipant[]> => {
  if (!roomId) return [];
  const payload = await invokeFunction<unknown>(
    `users-live-chat-rooms-participants?roomId=${encodeURIComponent(roomId)}`,
    { method: "GET" },
  );
  const participants: LiveChatParticipant[] = [];
  for (const item of extractArray(payload)) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const idValue = entry.id ?? entry.userId ?? entry.uid ?? entry.userUid;
    const id = idValue != null ? String(idValue) : null;
    if (!id) continue;
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
    participants.push({ id, name, avatarUrl, role });
  }

  return participants;
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
  const messages: LiveChatMessage[] = [];
  for (const item of extractArray(payload)) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const idValue = entry.id ?? entry.messageId ?? entry.uuid ?? entry.createdAt;
    const id = idValue != null ? String(idValue) : null;
    if (!id) continue;
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
    const meta = asRecord(entry.meta) ?? asRecord(entry.metadata);
    const isDeleted = entry.deleted === true || meta?.deleted === true;
    const attachments = normalizeAttachments(entry);
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
    messages.push({
      id,
      senderName,
      content: isDeleted ? "Mensagem apagada pelo administrador da sala" : content,
      time,
      type,
      isTutor,
      isAdmin,
      isDeleted,
      attachments,
    });
  }

  return messages;
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

export const deleteLiveChatRoomMessage = async (
  roomId: string,
  messageId: string,
): Promise<void> => {
  if (!roomId || !messageId) return;
  await invokeFunction(
    `user-live-chat-messages?roomId=${encodeURIComponent(roomId)}&messageId=${encodeURIComponent(messageId)}`,
    {
      method: "DELETE",
      body: { roomId, messageId },
    },
  );
};

export const deleteLiveChatRoomMessageViaAdminAction = async (
  roomId: string,
  messageId: string,
): Promise<void> => {
  if (!roomId || !messageId) return;
  await invokeFunction("admin-room-action", {
    method: "POST",
    body: {
      action: "delete-message",
      roomId,
      messageId,
    },
  });
};

export async function fetchTopicChats(): Promise<TopicChat[]> {
  const payload = await invokeFunction<unknown>("admin-topic-chat?action=list-topics", {
    method: "GET",
  });
  return extractArray(payload)
    .map(normalizeTopicChat)
    .filter((item): item is TopicChat => item !== null);
}

export async function fetchTopicChatMessages(roomId: string): Promise<LiveChatMessage[]> {
  if (!roomId) return [];
  const payload = await invokeFunction<unknown>(
    `admin-topic-chat?action=messages&roomId=${encodeURIComponent(roomId)}`,
    { method: "GET" },
  );
  return extractArray(payload)
    .map(normalizeTopicMessage)
    .filter((item): item is LiveChatMessage => item !== null);
}

export async function deleteTopicChatMessage(roomId: string, messageId: string): Promise<void> {
  if (!roomId || !messageId) return;
  await invokeFunction(
    `admin-topic-chat?action=delete-message&roomId=${encodeURIComponent(roomId)}&messageId=${encodeURIComponent(messageId)}`,
    { method: "DELETE" },
  );
}

export async function fetchTopicChatUserProfile(senderUid: string): Promise<TopicChatUserProfile | null> {
  if (!senderUid) return null;
  const payload = await invokeFunction<unknown>(
    `admin-topic-chat?action=user-profile&senderUid=${encodeURIComponent(senderUid)}`,
    { method: "GET" },
  );
  const data = asRecord(payload);
  const user = asRecord(data?.user);
  if (!user || user.id == null) return null;
  return {
    id: String(user.id),
    authId: pickString(user, ["authId"]),
    name: pickString(user, ["name"]),
    codinome: pickString(user, ["codinome"]),
    email: pickString(user, ["email"]),
    phone: pickString(user, ["phone"]),
    photoUrl: pickString(user, ["photoUrl"]),
    status: pickString(user, ["status"]),
  };
}

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
