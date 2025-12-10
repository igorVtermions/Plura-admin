"use client";

import React, { useEffect, useRef, useState } from "react";
import { invokeFunction } from "@/services/api";

type Notification = {
  id: string | number;
  title?: string;
  body?: string;
  read?: boolean;
  createdAt?: string;
};

export function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);

  async function loadNotifications() {
    try {
      const payload = await invokeFunction<Notification[] | { data?: Notification[] }>(
        "users-notifications",
      );
      const list = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object" && "data" in payload
        ? (payload as { data?: Notification[] }).data
        : null;
      setNotifications(Array.isArray(list) ? list : []);
    } catch {
      setNotifications([]);
    }
  }

  useEffect(() => {
    if (!open) return;
    loadNotifications();
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

  const unread = notifications.some((n) => !n.read);

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
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M7.5 17.5H12.5"
            stroke="#191F33"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.37515 8.125C4.37515 6.63316 4.96778 5.20242 6.02267 4.14752C7.07756 3.09263 8.5083 2.5 10.0001 2.5C11.492 2.5 12.9227 3.09263 13.9776 4.14752C15.0325 5.20242 15.6251 6.63316 15.6251 8.125C15.6251 10.9234 16.2736 13.1719 16.7892 14.0625C16.844 14.1574 16.8728 14.2649 16.8729 14.3745C16.873 14.484 16.8444 14.5916 16.7898 14.6865C16.7352 14.7815 16.6566 14.8604 16.5619 14.9154C16.4672 14.9705 16.3597 14.9996 16.2501 15H3.75015C3.64076 14.9993 3.53345 14.97 3.43896 14.9149C3.34448 14.8597 3.26611 14.7808 3.2117 14.6859C3.15729 14.591 3.12874 14.4835 3.12891 14.3741C3.12907 14.2647 3.15795 14.1572 3.21265 14.0625C3.72749 13.1719 4.37515 10.9227 4.37515 8.125Z"
            stroke="#191F33"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {unread ? (
          <span
            className="absolute right-1 top-1 block h-2 w-2 rounded-full"
            style={{ background: "#FF4D4F" }}
          />
        ) : (
          <span
            className="absolute right-1 top-1 block h-2 w-2 rounded-full"
            style={{ background: "#FFFFFF" }}
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div
          id="notifications-panel"
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border"
          style={{ borderColor: "#E6EEF8", zIndex: 60 }}
        >
          <div className="p-3 border-b" style={{ borderColor: "#F1F6FB" }}>
            <div className="font-medium">Notificações</div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Nenhuma notificação</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 hover:bg-slate-50 ${n.read ? "" : "bg-slate-50"}`}>
                  <div className="text-sm font-medium">{n.title ?? "Atualização"}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-1">{n.body}</div>}
                  {n.createdAt && (
                    <div className="text-xs text-muted-foreground mt-1">{String(n.createdAt)}</div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t text-center" style={{ borderColor: "#F1F6FB" }}>
            <button
              type="button"
              onClick={() => setNotifications((cur) => cur.map((x) => ({ ...x, read: true })))}
              className="text-xs text-primary"
            >
              Marcar todas como lidas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
