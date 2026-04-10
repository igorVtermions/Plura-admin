import { invokeFunction } from "@/services/api";

export type SupportTicketType =
  | "user_report"
  | "tutor_user_report"
  | "problem_report"
  | "tutor_problem_report";

export type SupportTicket = {
  id: string;
  type: SupportTicketType;
  createdAt: string | null;
  status: string;
  reporterId: string | null;
  reporterName: string | null;
  reportedId: string | null;
  reportedName: string | null;
  reportedCodinome: string | null;
  reason: string | null;
  reasonDescription: string | null;
  description: string | null;
  problemType: string | null;
  problemDescription: string | null;
  completedByAdminId: string | null;
  completedByAdminName: string | null;
  replyMessage: string | null;
  repliedAt: string | null;
  repliedByAdminId: string | null;
  repliedByAdminName: string | null;
  tutorId: string | null;
  tutorName: string | null;
};

export type SupportTicketsTotals = {
  all: number;
  user_report: number;
  tutor_user_report: number;
  problem_report: number;
  tutor_problem_report: number;
};

export type SupportRoom = {
  id: string;
  title: string;
  userName: string;
  nickname: string | null;
  photoUrl: string | null;
  isTutor: boolean;
  createdAt: string | null;
  status: string;
  priority: string | null;
  reason: string | null;
  description: string | null;
  requesterRole: string | null;
  requesterId: string | null;
  requesterName: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  connectedAt: string | null;
  closedAt: string | null;
  type: "chat";
};

export type SupportChatMessage = {
  id: string;
  chatId: string;
  content: string;
  createdAt: string | null;
  senderRole: string | null;
  senderName: string | null;
  isSystem: boolean;
};

export type SupportChatDetail = {
  room: SupportRoom | null;
  messages: SupportChatMessage[];
};

export type FetchSupportTicketsParams = {
  type?: SupportTicketType | "all";
  page?: number;
  perPage?: number;
  withCounts?: boolean;
};

export type FetchSupportTicketsResult = {
  items: SupportTicket[];
  page: number;
  perPage: number;
  totals?: SupportTicketsTotals;
};

export type FetchSupportRoomsParams = {
  page?: number;
  perPage?: number;
};

export type FetchSupportRoomsResult = {
  items: SupportRoom[];
  page: number;
  perPage: number;
};

function normalizeTicket(raw: unknown): SupportTicket | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = data.id;
  const type = typeof data.type === "string" ? data.type : "";
  if (id === null || id === undefined || type.length === 0) return null;
  return {
    id: String(id),
    type: type as SupportTicketType,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
    status: typeof data.status === "string" ? data.status : "in_progress",
    reporterId: typeof data.reporterId === "string" ? data.reporterId : null,
    reporterName: typeof data.reporterName === "string" ? data.reporterName : null,
    reportedId: typeof data.reportedId === "string" ? data.reportedId : null,
    reportedName: typeof data.reportedName === "string" ? data.reportedName : null,
    reportedCodinome: typeof data.reportedCodinome === "string" ? data.reportedCodinome : null,
    reason: typeof data.reason === "string" ? data.reason : null,
    reasonDescription:
      typeof data.reasonDescription === "string" ? data.reasonDescription : null,
    description: typeof data.description === "string" ? data.description : null,
    problemType: typeof data.problemType === "string" ? data.problemType : null,
    problemDescription:
      typeof data.problemDescription === "string" ? data.problemDescription : null,
    completedByAdminId:
      typeof data.completedByAdminId === "string" ? data.completedByAdminId : null,
    completedByAdminName:
      typeof data.completedByAdminName === "string" ? data.completedByAdminName : null,
    replyMessage: typeof data.replyMessage === "string" ? data.replyMessage : null,
    repliedAt: typeof data.repliedAt === "string" ? data.repliedAt : null,
    repliedByAdminId:
      typeof data.repliedByAdminId === "string" ? data.repliedByAdminId : null,
    repliedByAdminName:
      typeof data.repliedByAdminName === "string" ? data.repliedByAdminName : null,
    tutorId: typeof data.tutorId === "string" ? data.tutorId : null,
    tutorName: typeof data.tutorName === "string" ? data.tutorName : null,
  };
}

function normalizeTotals(raw: unknown): SupportTicketsTotals | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const data = raw as Record<string, unknown>;
  const toNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
  return {
    all: toNumber(data.all),
    user_report: toNumber(data.user_report),
    tutor_user_report: toNumber(data.tutor_user_report),
    problem_report: toNumber(data.problem_report),
    tutor_problem_report: toNumber(data.tutor_problem_report),
  };
}

export async function fetchSupportTickets(
  params: FetchSupportTicketsParams = {},
): Promise<FetchSupportTicketsResult> {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set("type", params.type);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.perPage) searchParams.set("perPage", String(params.perPage));
  if (params.withCounts === false) searchParams.set("withCounts", "false");

  const query = searchParams.toString();
  const functionName = query ? `support-tickets?${query}` : "support-tickets";
  const payload = await invokeFunction<unknown>(functionName, { method: "GET" });

  if (!payload || typeof payload !== "object") {
    return { items: [], page: 1, perPage: params.perPage ?? 20 };
  }

  const data = payload as Record<string, unknown>;
  const items = Array.isArray(data.items) ? data.items.map(normalizeTicket).filter(Boolean) : [];
  const page = typeof data.page === "number" ? data.page : params.page ?? 1;
  const perPage = typeof data.perPage === "number" ? data.perPage : params.perPage ?? 20;
  const totals = normalizeTotals(data.totals);

  return {
    items: items as SupportTicket[],
    page,
    perPage,
    totals,
  };
}

export async function fetchSupportTicketsTotals(): Promise<SupportTicketsTotals | null> {
  const response = await fetchSupportTickets({
    page: 1,
    perPage: 1,
    withCounts: true,
    type: "all",
  });
  return response.totals ?? null;
}

function normalizeRoom(raw: unknown): SupportRoom | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = data.id;
  const title = typeof data.title === "string" ? data.title : "Sala de suporte";
  if (id === null || id === undefined) return null;
  return {
    id: String(id),
    title,
    userName: typeof data.userName === "string" ? data.userName : "Usuario",
    nickname: typeof data.nickname === "string" ? data.nickname : null,
    photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : null,
    isTutor: Boolean(data.isTutor),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
    status: typeof data.status === "string" ? data.status : "in_progress",
    priority: typeof data.priority === "string" ? data.priority : null,
    reason: typeof data.reason === "string" ? data.reason : null,
    description: typeof data.description === "string" ? data.description : null,
    requesterRole: typeof data.requesterRole === "string" ? data.requesterRole : null,
    requesterId: typeof data.requesterId === "string" ? data.requesterId : null,
    requesterName: typeof data.requesterName === "string" ? data.requesterName : null,
    assignedAdminId: typeof data.assignedAdminId === "string" ? data.assignedAdminId : null,
    assignedAdminName: typeof data.assignedAdminName === "string" ? data.assignedAdminName : null,
    connectedAt: typeof data.connectedAt === "string" ? data.connectedAt : null,
    closedAt: typeof data.closedAt === "string" ? data.closedAt : null,
    type: "chat",
  };
}

function normalizeChatMessage(raw: unknown): SupportChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = data.id ?? data.ID;
  const chatId = data.chatId ?? data.chatid;
  if (id === null || id === undefined || chatId === null || chatId === undefined) return null;
  return {
    id: String(id),
    chatId: String(chatId),
    content: typeof data.content === "string" ? data.content : "",
    createdAt: typeof data.createdAt === "string"
      ? data.createdAt
      : typeof data.createdat === "string"
        ? data.createdat
        : null,
    senderRole: typeof data.senderRole === "string"
      ? data.senderRole
      : typeof data.senderrole === "string"
        ? data.senderrole
        : null,
    senderName: typeof data.senderName === "string"
      ? data.senderName
      : typeof data.sendername === "string"
        ? data.sendername
        : null,
    isSystem: Boolean(
      typeof data.isSystem === "boolean"
        ? data.isSystem
        : typeof data.issystem === "boolean"
          ? data.issystem
          : data.isSystem,
    ),
  };
}

export async function updateSupportTicketStatus(params: {
  id: string;
  type: SupportTicketType;
  status: "completed" | "in_progress";
}) {
  return await invokeFunction("support-ticket-action", {
    method: "POST",
    body: { action: "update-status", ...params },
  });
}

export async function deleteSupportTicket(params: { id: string; type: SupportTicketType }) {
  return await invokeFunction("support-ticket-action", {
    method: "POST",
    body: { action: "delete", ...params },
  });
}

export async function updateSupportRoomStatus(params: {
  id: string;
  status: "completed" | "in_progress";
}) {
  return await invokeFunction("support-room-action", {
    method: "POST",
    body: { action: "update-status", ...params },
  });
}

export async function deleteSupportRoom(params: { id: string }) {
  return await invokeFunction("support-room-action", {
    method: "POST",
    body: { action: "delete", ...params },
  });
}

export async function connectSupportChat(params: { id: string }) {
  return await invokeFunction("support-chat-connect", {
    method: "POST",
    body: params,
  });
}

export async function fetchSupportRooms(
  params: FetchSupportRoomsParams = {},
): Promise<FetchSupportRoomsResult> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.perPage) searchParams.set("perPage", String(params.perPage));

  const query = searchParams.toString();
  const functionName = query ? `support-rooms?${query}` : "support-rooms";
  const payload = await invokeFunction<unknown>(functionName, { method: "GET" });

  if (!payload || typeof payload !== "object") {
    return { items: [], page: 1, perPage: params.perPage ?? 20 };
  }

  const data = payload as Record<string, unknown>;
  const items = Array.isArray(data.items) ? data.items.map(normalizeRoom).filter(Boolean) : [];
  const page = typeof data.page === "number" ? data.page : params.page ?? 1;
  const perPage = typeof data.perPage === "number" ? data.perPage : params.perPage ?? 20;

  return {
    items: items as SupportRoom[],
    page,
    perPage,
  };
}

export async function fetchSupportChatDetail(params: { id: string }): Promise<SupportChatDetail> {
  const searchParams = new URLSearchParams();
  searchParams.set("id", params.id);
  const payload = await invokeFunction<unknown>(
    `support-chat-detail?${searchParams.toString()}`,
    { method: "GET" },
  );

  if (!payload || typeof payload !== "object") {
    return { room: null, messages: [] };
  }

  const data = payload as Record<string, unknown>;
  const room = normalizeRoom(data.room);
  const messages = Array.isArray(data.messages)
    ? (data.messages.map(normalizeChatMessage).filter(Boolean) as SupportChatMessage[])
    : [];

  return {
    room,
    messages,
  };
}


export async function fetchSupportChatMessages(params: {
  id: string;
  since?: string | null;
  limit?: number;
}): Promise<{ items: SupportChatMessage[]; latestCreatedAt: string | null }> {
  const searchParams = new URLSearchParams();
  searchParams.set("id", params.id);
  if (params.since) searchParams.set("since", params.since);
  if (params.limit && Number.isFinite(params.limit)) {
    searchParams.set("limit", String(params.limit));
  }

  const payload = await invokeFunction<unknown>(
    `support-chat-messages?${searchParams.toString()}`,
    { method: "GET" },
  );

  if (!payload || typeof payload !== "object") {
    return { items: [], latestCreatedAt: params.since ?? null };
  }

  const data = payload as Record<string, unknown>;
  const items = Array.isArray(data.items)
    ? (data.items.map(normalizeChatMessage).filter(Boolean) as SupportChatMessage[])
    : [];

  const latestCreatedAt =
    typeof data.latestCreatedAt === "string"
      ? data.latestCreatedAt
      : items.length
        ? items[items.length - 1]?.createdAt ?? null
        : params.since ?? null;

  return { items, latestCreatedAt };
}
export async function sendSupportChatMessage(params: { chatId: string; message: string }) {
  const body = {
    chatId: params.chatId,
    message: params.message,
  };
  const payload = await invokeFunction<unknown>("support-chat-message", {
    method: "POST",
    body,
  });
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const messagePayload = "message" in data ? data.message : data;
  return normalizeChatMessage(messagePayload);
}

export async function fetchSupportTicketDetail(params: { id: string; type: SupportTicketType }) {
  const searchParams = new URLSearchParams();
  searchParams.set("id", params.id);
  searchParams.set("type", params.type);
  const functionName = `support-ticket-detail?${searchParams.toString()}`;
  const payload = await invokeFunction<unknown>(functionName, { method: "GET" });
  const ticket = normalizeTicket(payload);
  if (!ticket) return null;
  return ticket;
}

export async function sendSupportTicketReply(params: {
  id: string;
  type: SupportTicketType;
  message: string;
}) {
  return await invokeFunction("support-ticket-reply", {
    method: "POST",
    body: params,
  });
}

