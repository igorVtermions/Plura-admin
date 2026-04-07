import { invokeFunction } from "@/services/api";

export type AdminNotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  severity: "info" | "warning" | "critical";
  payload: Record<string, unknown>;
  createdAt: string | null;
  readAt: string | null;
  read: boolean;
};

export async function fetchAdminNotifications(params?: {
  page?: number;
  perPage?: number;
  unreadOnly?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.perPage) searchParams.set("perPage", String(params.perPage));
  if (typeof params?.unreadOnly === "boolean") {
    searchParams.set("unreadOnly", String(params.unreadOnly));
  }

  const fn = searchParams.size
    ? `admin-notifications?${searchParams.toString()}`
    : "admin-notifications";

  const payload = await invokeFunction<unknown>(fn, { method: "GET" });
  const data = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

  const items = Array.isArray(data.items)
    ? data.items
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const row = item as Record<string, unknown>;
          const id = row.id != null ? String(row.id) : "";
          if (!id) return null;
          const readAt = typeof row.readAt === "string" ? row.readAt : null;
          return {
            id,
            type: typeof row.type === "string" ? row.type : "generic",
            title: typeof row.title === "string" ? row.title : "Atualizacao",
            body: typeof row.body === "string" ? row.body : null,
            entityType: typeof row.entityType === "string" ? row.entityType : null,
            entityId: typeof row.entityId === "string" ? row.entityId : null,
            severity:
              row.severity === "warning" || row.severity === "critical" ? row.severity : "info",
            payload:
              row.payload && typeof row.payload === "object"
                ? (row.payload as Record<string, unknown>)
                : {},
            createdAt: typeof row.createdAt === "string" ? row.createdAt : null,
            readAt,
            read: typeof row.read === "boolean" ? row.read : Boolean(readAt),
          } as AdminNotificationItem;
        })
        .filter((item): item is AdminNotificationItem => item !== null)
    : [];

  return {
    items,
    page: typeof data.page === "number" ? data.page : params?.page ?? 1,
    perPage: typeof data.perPage === "number" ? data.perPage : params?.perPage ?? 20,
  };
}

export async function fetchAdminUnreadCount() {
  const payload = await invokeFunction<unknown>("admin-notifications-count", { method: "GET" });
  if (!payload || typeof payload !== "object") return 0;
  const unread = (payload as Record<string, unknown>).unread;
  return typeof unread === "number" && Number.isFinite(unread) ? unread : 0;
}

export async function syncAdminNotifications(limit = 50, since?: string) {
  await invokeFunction("admin-notifications-sync", {
    method: "POST",
    body: {
      limit,
      ...(since ? { since } : {}),
    },
  });
}

export async function markAdminNotificationsRead(ids: string[]) {
  if (!ids.length) return;
  await invokeFunction("admin-notifications-read", {
    method: "POST",
    body: { ids },
  });
}

export async function markAllAdminNotificationsRead() {
  await invokeFunction("admin-notifications-read-all", {
    method: "POST",
    body: {},
  });
}

export async function clearAllAdminNotifications() {
  await invokeFunction("admin-notifications-clear-all", {
    method: "POST",
    body: {},
  });
}

export async function fetchAdminRoomReminders() {
  const payload = await invokeFunction<unknown>("admin-room-reminders", { method: "GET" });
  if (!payload || typeof payload !== "object") return [] as string[];
  const items = Array.isArray((payload as Record<string, unknown>).items)
    ? ((payload as Record<string, unknown>).items as unknown[])
    : [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const roomId = (item as Record<string, unknown>).roomId;
      return roomId != null ? String(roomId) : null;
    })
    .filter((id): id is string => id !== null);
}

export async function toggleAdminRoomReminder(roomId: string, enabled: boolean) {
  await invokeFunction("admin-room-reminders", {
    method: "POST",
    body: {
      roomId: Number(roomId),
      enabled,
      remindBeforeMinutes: 10,
    },
  });
}
