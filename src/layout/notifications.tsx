"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bell, Clock3, Radio, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/ui/Modal";
import {
  clearAllAdminNotifications,
  fetchAdminNotifications,
  fetchAdminUnreadCount,
  markAdminNotificationsRead,
  markAllAdminNotificationsRead,
  syncAdminNotifications,
  type AdminNotificationItem,
} from "@/services/admin-notifications";

type NotificationFilter = "all" | "unread" | "important";

function formatRelativeDate(value?: string | null) {
  if (!value) return "Agora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin <= 0) return "Agora";
  if (diffMin < 60) return `Há ${diffMin} min`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Há ${diffHour}h`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) {
    return `Ontem, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function groupLabelByDate(value?: string | null) {
  if (!value) return "Agora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((today - target) / 86400000);

  if (diffDays <= 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return "Anteriores";
}

function getNotificationIcon(type: string, severity: "info" | "warning" | "critical") {
  if (type.includes("ticket")) return Ticket;
  if (type.includes("live_room") || type.includes("room")) return Radio;
  if (type.includes("reminder")) return Clock3;
  if (severity === "critical") return AlertTriangle;
  return Bell;
}

export function Notifications() {
  const SYNC_CURSOR_KEY = "admin:notifications:lastSyncAt:v1";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [loading, setLoading] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const syncCursorRef = useRef<string | null>(null);

  const updateSyncCursor = useCallback((value: string) => {
    syncCursorRef.current = value;
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SYNC_CURSOR_KEY, value);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const saved = sessionStorage.getItem(SYNC_CURSOR_KEY);
      if (saved && !Number.isNaN(new Date(saved).getTime())) {
        syncCursorRef.current = saved;
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const loadNotifications = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setLoading(true);
      try {
        const response = await fetchAdminNotifications({ page: 1, perPage: 20 });
        setNotifications(response.items);
      } catch {
        if (!silent) setNotifications([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  const loadUnreadCount = useCallback(async () => {
    try {
      const total = await fetchAdminUnreadCount();
      setUnreadCount(total);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const syncNewNotifications = useCallback(async () => {
    const since =
      syncCursorRef.current ??
      new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await syncAdminNotifications(50, since);
    updateSyncCursor(new Date().toISOString());
  }, [updateSyncCursor]);

  async function handleNotificationClick(notification: AdminNotificationItem) {
    try {
      if (!notification.read) {
        await markAdminNotificationsRead([notification.id]);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }
              : item,
          ),
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch {
      // ignore mark-read errors on click
    }

    if (notification.entityType === "support_chat" && notification.entityId) {
      navigate(`/support/chat/${notification.entityId}`);
      setOpen(false);
      return;
    }

    if (notification.entityType === "support_ticket") {
      navigate("/support");
      setOpen(false);
      return;
    }

    if (notification.entityType === "live_room" && notification.entityId) {
      navigate(`/network?roomId=${encodeURIComponent(notification.entityId)}`);
      setOpen(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void loadNotifications();

    const refreshId = window.setInterval(() => {
      void loadNotifications({ silent: true });
    }, 15000);

    return () => window.clearInterval(refreshId);
  }, [open, loadNotifications]);

  useEffect(() => {
    const refreshUnread = () => {
      void syncNewNotifications()
        .catch(() => undefined)
        .finally(() => {
          void loadUnreadCount();
        });
    };

    refreshUnread();

    const id = window.setInterval(() => {
      refreshUnread();
    }, 15000);

    const handleForegroundRefresh = () => {
      refreshUnread();
      if (open) {
        void loadNotifications({ silent: true });
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleForegroundRefresh();
      }
    };

    window.addEventListener("focus", handleForegroundRefresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", handleForegroundRefresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [open, loadUnreadCount, loadNotifications, syncNewNotifications]);

  useEffect(() => {
    if (!open) setFilter("all");
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    if (open) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
    }

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((item) => !item.read);
    if (filter === "important") {
      return notifications.filter((item) => item.severity === "warning" || item.severity === "critical");
    }
    return notifications;
  }, [filter, notifications]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, AdminNotificationItem[]> = {
      Hoje: [],
      Ontem: [],
      Anteriores: [],
    };

    filteredNotifications.forEach((item) => {
      const label = groupLabelByDate(item.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return ["Hoje", "Ontem", "Anteriores"]
      .map((label) => ({ label, items: groups[label] || [] }))
      .filter((group) => group.items.length > 0);
  }, [filteredNotifications]);

  const unread = unreadCount > 0;

  const filterPills: Array<{ key: NotificationFilter; label: string }> = [
    { key: "all", label: "Todas" },
    { key: "unread", label: "Não lidas" },
    { key: "important", label: "Importantes" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="notifications-panel"
        className="relative flex w-10 h-10 p-2 items-center justify-center rounded-lg cursor-pointer"
        style={{ border: "1px solid #D0D9F1", background: "#FFFFFF", color: "#191F33" }}
        aria-label="Notificações"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M7.5 17.5H12.5" stroke="#191F33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M4.37515 8.125C4.37515 6.63316 4.96778 5.20242 6.02267 4.14752C7.07756 3.09263 8.5083 2.5 10.0001 2.5C11.492 2.5 12.9227 3.09263 13.9776 4.14752C15.0325 5.20242 15.6251 6.63316 15.6251 8.125C15.6251 10.9234 16.2736 13.1719 16.7892 14.0625C16.844 14.1574 16.8728 14.2649 16.8729 14.3745C16.873 14.484 16.8444 14.5916 16.7898 14.6865C16.7352 14.7815 16.6566 14.8604 16.5619 14.9154C16.4672 14.9705 16.3597 14.9996 16.2501 15H3.75015C3.64076 14.9993 3.53345 14.97 3.43896 14.9149C3.34448 14.8597 3.26611 14.7808 3.2117 14.6859C3.15729 14.591 3.12874 14.4835 3.12891 14.3741C3.12907 14.2647 3.15795 14.1572 3.21265 14.0625C3.72749 13.1719 4.37515 10.9227 4.37515 8.125Z"
            stroke="#191F33"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {unread ? (
          <span className="absolute right-1 top-1 block h-2 w-2 rounded-full" style={{ background: "#FF4D4F" }} />
        ) : (
          <span className="absolute right-1 top-1 block h-2 w-2 rounded-full" style={{ background: "#FFFFFF" }} aria-hidden />
        )}
      </button>

      {open && (
        <div
          id="notifications-panel"
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 mt-2 w-[380px] bg-white rounded-xl shadow-lg border overflow-hidden"
          style={{ borderColor: "#E6EEF8", zIndex: 60 }}
        >
          <div className="p-4 border-b" style={{ borderColor: "#EEF3FC" }}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold text-[#191F33]">Notificações</div>
              <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-medium text-[#6B4DB8]">
                {unreadCount} não lidas
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              {filterPills.map((pill) => {
                const active = filter === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setFilter(pill.key)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: active ? "#ECE8FF" : "#F6F8FF",
                      color: active ? "#6B4DB8" : "#667085",
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto notifications-panel-scroll">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-lg animate-pulse" style={{ background: "#F4F7FF" }} />
                ))}
              </div>
            ) : groupedNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-sm font-medium text-[#191F33]">Tudo em dia</div>
                <div className="text-xs mt-1 text-[#667085]">Nenhuma notificação para este filtro.</div>
              </div>
            ) : (
              groupedNotifications.map((group) => (
                <div key={group.label} className="px-3 pb-2">
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-1 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8A94AB]">
                    {group.label}
                  </div>

                  <div className="space-y-2">
                    {group.items.map((notification) => {
                      const Icon = getNotificationIcon(notification.type, notification.severity);
                      const isUnread = !notification.read;

                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left rounded-lg border px-3 py-2.5 transition-colors"
                          style={{
                            borderColor: isUnread ? "#D7CCFF" : "#E7EDF9",
                            background: isUnread ? "#F7F3FF" : "#FFFFFF",
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 rounded-md p-1.5" style={{ background: isUnread ? "#ECE4FF" : "#F2F4FA" }}>
                              <Icon className="h-4 w-4 text-[#6B4DB8]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-[#191F33] leading-5">{notification.title}</div>
                                {isUnread && <span className="h-2 w-2 rounded-full bg-[#7A5CE3]" />}
                              </div>

                              {notification.body && (
                                <div
                                  className="text-xs mt-0.5 text-[#5A6480] leading-4"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {notification.body}
                                </div>
                              )}

                              <div className="text-[11px] mt-1.5 text-[#8A94AB]">{formatRelativeDate(notification.createdAt)}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t" style={{ borderColor: "#EEF3FC" }}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={unreadCount === 0}
                onClick={async () => {
                  try {
                    await markAllAdminNotificationsRead();
                    setNotifications((cur) =>
                      cur.map((x) => ({
                        ...x,
                        read: true,
                        readAt: x.readAt ?? new Date().toISOString(),
                      })),
                    );
                    setUnreadCount(0);
                  } catch {
                    // ignore mark-all errors
                  }
                }}
                className="w-full rounded-md py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ color: "#6B4DB8", background: "#F8F5FF" }}
              >
                Marcar lidas
              </button>

              <button
                type="button"
                disabled={notifications.length === 0}
                onClick={() => setConfirmClearOpen(true)}
                className="w-full rounded-md py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ color: "#C53030", background: "#FFF4F4" }}
              >
                Limpar caixa
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={confirmClearOpen}
        onClose={() => {
          if (!clearLoading) setConfirmClearOpen(false);
        }}
        title="Limpar caixa de notificações"
        subtitle="Confirme para apagar tudo"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmClearOpen(false)}
              disabled={clearLoading}
              className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: "#D0D9F1", color: "#344054", background: "#FFFFFF" }}
            >
              Não
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  setClearLoading(true);
                  await clearAllAdminNotifications();
                  setNotifications([]);
                  setUnreadCount(0);
                  updateSyncCursor(new Date().toISOString());
                  setConfirmClearOpen(false);
                } catch {
                  // ignore clear-all errors
                } finally {
                  setClearLoading(false);
                }
              }}
              disabled={clearLoading}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "#C53030" }}
            >
              {clearLoading ? "Apagando..." : "Sim, apagar"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[#344054]">
            Tem certeza que deseja apagar todas as notificações da sua caixa?
          </p>
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: "#FECACA", background: "#FFF1F2", color: "#9F1239" }}
          >
            Atenção: após apagar, não é possível recuperar as notificações.
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Notifications;
