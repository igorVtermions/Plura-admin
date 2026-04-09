"use client";

import Image from "@/components/ui/Image";
import Link from "@/router/Link";
import { useNavigate } from "react-router-dom";
import {
  fetchSupportRooms,
  fetchSupportTickets,
  fetchSupportTicketsTotals,
  deleteSupportRoom,
  deleteSupportTicket,
  updateSupportRoomStatus,
  updateSupportTicketStatus,
  connectSupportChat,
  type SupportRoom,
  type SupportTicket,
  type SupportTicketsTotals,
} from "@/services/support";
import React from "react";
import Modal from "@/components/ui/Modal";

export const metadata = { title: "Suporte | Plura Talks - Administrador" };

export function SupportPage() {
  const SUPPORT_TICKETS_CACHE_KEY = "admin:support:tickets:v1";
  const SUPPORT_ROOMS_CACHE_KEY = "admin:support:rooms:v1";
  const SUPPORT_REFRESH_INTERVAL_MS = 10_000;
  const navigate = useNavigate();
  const [ticketItems, setTicketItems] = React.useState<SupportTicket[]>([]);
  const [ticketTotals, setTicketTotals] = React.useState<SupportTicketsTotals | null>(null);
  const [ticketsLoading, setTicketsLoading] = React.useState(true);
  const [ticketsError, setTicketsError] = React.useState<string | null>(null);
  const [rooms, setRooms] = React.useState<SupportRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = React.useState(true);
  const [roomsError, setRoomsError] = React.useState<string | null>(null);
  const [showTicketsOnly, setShowTicketsOnly] = React.useState(false);
  const [ticketSearch, setTicketSearch] = React.useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = React.useState<"all" | "completed" | "in_progress">("all");
  const [ticketSort, setTicketSort] = React.useState<"newest" | "oldest">("newest");
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<{
    id: string;
    type: "chat" | "ticket";
    title: string;
    status: string;
    ticketType?: SupportTicket["type"];
    action: "delete" | "complete" | "reopen";
  } | null>(null);
  const [selectedChat, setSelectedChat] = React.useState<SupportRoom | null>(null);
  const [chatModalOpen, setChatModalOpen] = React.useState(false);
  const [chatActionLoading, setChatActionLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const perPage = 9;
  const roomCards = React.useMemo(() => {
    const roomCards = rooms.map((room) => ({
      type: "chat" as const,
      id: room.id,
      title: room.title,
      userName: room.userName,
      nickname: room.nickname,
      photoUrl: room.photoUrl,
      isTutor: room.isTutor,
      status: room.status,
      priority: room.priority,
      reason: room.reason,
      description: room.description,
      requesterRole: room.requesterRole,
      requesterName: room.requesterName,
      assignedAdminName: room.assignedAdminName,
    }));
    return roomCards;
  }, [rooms]);

  const allTicketCards = React.useMemo(
    () =>
      ticketItems.map((ticket) => ({
        type: "ticket" as const,
        id: ticket.id,
        title: formatTicketTitle(ticket) || `Ticket #${ticket.id}`,
        userName: ticket.reporterName || ticket.tutorName || "Usuário",
        nickname: ticket.reportedCodinome || null,
        photoUrl: null,
        isTutor: ticket.type === "tutor_user_report" || ticket.type === "tutor_problem_report",
        status: ticket.status,
        ticketType: ticket.type,
        createdAt: ticket.createdAt,
      })),
    [ticketItems],
  );

  const filteredTickets = React.useMemo(() => {
    let items = [...ticketItems];
    if (ticketStatusFilter !== "all") {
      items = items.filter((ticket) => ticket.status === ticketStatusFilter);
    }
    const query = ticketSearch.trim().toLowerCase();
    if (query.length > 0) {
      items = items.filter((ticket) => {
        const haystack = [
          ticket.id,
          ticket.reason,
          ticket.problemType,
          ticket.description,
          ticket.reporterName,
          ticket.reportedName,
          ticket.reportedCodinome,
          ticket.tutorName,
        ]
          .filter((value): value is string => typeof value === "string" && value.length > 0)
          .map((value) => value.toLowerCase());
        return haystack.some((value) => value.includes(query));
      });
    }
    items.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ticketSort === "newest" ? bTime - aTime : aTime - bTime;
    });
    return items;
  }, [ticketItems, ticketSearch, ticketSort, ticketStatusFilter]);

  const filteredTicketCards = React.useMemo(
    () =>
      filteredTickets.map((ticket) => ({
        type: "ticket" as const,
        id: ticket.id,
        title: formatTicketTitle(ticket) || `Ticket #${ticket.id}`,
        userName: ticket.reporterName || ticket.tutorName || "Usuário",
        nickname: ticket.reportedCodinome || null,
        photoUrl: null,
        isTutor: ticket.type === "tutor_user_report" || ticket.type === "tutor_problem_report",
        status: ticket.status,
        ticketType: ticket.type,
        createdAt: ticket.createdAt,
      })),
    [filteredTickets],
  );

  const cards = React.useMemo(() => {
    if (showTicketsOnly) return filteredTicketCards;
    return [...roomCards, ...allTicketCards];
  }, [showTicketsOnly, roomCards, allTicketCards, filteredTicketCards]);
  const totalPages = Math.max(1, Math.ceil(cards.length / perPage));
  const paged = cards.slice((page - 1) * perPage, page * perPage);
  const pagesContainerRef = React.useRef<HTMLDivElement | null>(null);
  const selectedBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const supportRefreshInFlightRef = React.useRef(false);
  const supportInitialLoadDoneRef = React.useRef(false);
  const [pageAnimating, setPageAnimating] = React.useState(false);
  const ticketsTotal = ticketTotals?.all ?? ticketItems.length;

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const rawTickets = sessionStorage.getItem(SUPPORT_TICKETS_CACHE_KEY);
      const rawRooms = sessionStorage.getItem(SUPPORT_ROOMS_CACHE_KEY);

      if (rawTickets) {
        const parsed = JSON.parse(rawTickets);
        if (Array.isArray(parsed)) {
          setTicketItems(parsed as SupportTicket[]);
          setTicketsLoading(false);
        }
      }

      if (rawRooms) {
        const parsed = JSON.parse(rawRooms);
        if (Array.isArray(parsed)) {
          setRooms(parsed as SupportRoom[]);
          setRoomsLoading(false);
        }
      }
    } catch {
      // ignore cache errors
    }
  }, []);

  function formatTicketTitle(ticket: SupportTicket) {
    if (ticket.type === "problem_report") {
      return ticket.problemType ? `Problema técnico: ${ticket.problemType}` : "Problema técnico";
    }
    if (ticket.type === "tutor_problem_report") {
      return ticket.problemType
        ? `Problema técnico tutor: ${ticket.problemType}`
        : "Problema técnico tutor";
    }
    if (ticket.type === "tutor_user_report") {
      return ticket.reason ? `Denúncia tutor: ${ticket.reason}` : "Denúncia tutor";
    }
    return ticket.reason ? `Denúncia usuário: ${ticket.reason}` : "Denúncia usuário";
  }

  function getPriorityMeta(priority: string | null | undefined) {
    const value = String(priority || "").toLowerCase();
    if (value.includes("high") || value.includes("urgent") || value.includes("crise")) {
      return { label: "prioridade alta", color: "#C53030", bg: "#FFF5F5", border: "#FECACA" };
    }
    if (value.includes("medium") || value.includes("help") || value.includes("ajuda")) {
      return { label: "prioridade média", color: "#B45309", bg: "#FFFBEB", border: "#FCD34D" };
    }
    return { label: "prioridade baixa", color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" };
  }

  const refreshSupportData = React.useCallback(
    async (options?: { forceLoading?: boolean }) => {
      if (supportRefreshInFlightRef.current) return;
      supportRefreshInFlightRef.current = true;

      const shouldShowLoading = options?.forceLoading || !supportInitialLoadDoneRef.current;
      if (shouldShowLoading) {
        setTicketsLoading(true);
        setRoomsLoading(true);
      }

      try {
        const [ticketsResponse, totalsResponse, roomsResponse] = await Promise.allSettled([
          fetchSupportTickets({ page: 1, perPage: 6, withCounts: false }),
          fetchSupportTicketsTotals(),
          fetchSupportRooms({ page: 1, perPage: 20 }),
        ]);

        if (ticketsResponse.status === "fulfilled") {
          setTicketItems(ticketsResponse.value.items);
          setTicketsError(null);
          try {
            if (typeof window !== "undefined") {
              sessionStorage.setItem(
                SUPPORT_TICKETS_CACHE_KEY,
                JSON.stringify(ticketsResponse.value.items),
              );
            }
          } catch {
            // ignore cache errors
          }
        } else if (!supportInitialLoadDoneRef.current) {
          setTicketsError("Erro ao carregar tickets");
        }

        if (totalsResponse.status === "fulfilled") {
          setTicketTotals(totalsResponse.value);
        }

        if (roomsResponse.status === "fulfilled") {
          setRooms(roomsResponse.value.items);
          setRoomsError(null);
          try {
            if (typeof window !== "undefined") {
              sessionStorage.setItem(SUPPORT_ROOMS_CACHE_KEY, JSON.stringify(roomsResponse.value.items));
            }
          } catch {
            // ignore cache errors
          }
        } else if (!supportInitialLoadDoneRef.current) {
          setRoomsError("Erro ao carregar salas de suporte");
        }
      } finally {
        supportInitialLoadDoneRef.current = true;
        supportRefreshInFlightRef.current = false;
        setTicketsLoading(false);
        setRoomsLoading(false);
      }
    },
    [SUPPORT_ROOMS_CACHE_KEY, SUPPORT_TICKETS_CACHE_KEY],
  );

  React.useEffect(() => {
    let active = true;
    const runRefresh = async (options?: { forceLoading?: boolean }) => {
      if (!active) return;
      await refreshSupportData(options);
    };

    void runRefresh({ forceLoading: true });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void runRefresh();
    }, SUPPORT_REFRESH_INTERVAL_MS);

    const onFocus = () => {
      void runRefresh();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshSupportData, SUPPORT_REFRESH_INTERVAL_MS]);

  React.useEffect(() => {
    if (!menuOpenId) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpenId]);

  function goPage(p: number) {
    const next = Math.max(1, Math.min(totalPages, p));
    setPage(next);
    setTimeout(() => {
      if (selectedBtnRef.current) {
        selectedBtnRef.current.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }, 50);
  }
  React.useEffect(() => {
    setPageAnimating(true);
    const t = setTimeout(() => setPageAnimating(false), 260);
    return () => clearTimeout(t);
  }, [page]);

  const confirmTitle = pendingAction
    ? pendingAction.action === "delete"
      ? "Apagar item"
      : pendingAction.action === "complete"
      ? "Concluir item"
      : "Voltar para em andamento"
    : "";
  const confirmSubtitle = pendingAction
    ? pendingAction.action === "delete"
      ? `Tem certeza que deseja apagar "${pendingAction.title}"?`
      : pendingAction.action === "complete"
      ? `Tem certeza que deseja concluir "${pendingAction.title}"?`
      : `Tem certeza que deseja reabrir "${pendingAction.title}"?`
    : "";
  const confirmDescription = pendingAction
    ? pendingAction.action === "delete"
      ? "Essa acao nao pode ser desfeita."
      : pendingAction.action === "complete"
      ? "Essa acao marcara o item como concluido."
      : "Essa acao marcara o item como em andamento."
    : "";

  async function handleConnectChat() {
    if (!selectedChat || chatActionLoading) return;
    setChatActionLoading(true);
    try {
      const result = await connectSupportChat({ id: selectedChat.id });
      const payload = result && typeof result === "object" ? (result as Record<string, unknown>) : {};
      const assignedAdminName =
        typeof payload.assignedAdminName === "string" ? payload.assignedAdminName : null;
      const connectedAt =
        typeof payload.connectedAt === "string" ? payload.connectedAt : new Date().toISOString();
      const status = typeof payload.status === "string" ? payload.status : "connected";
      setRooms((items) =>
        items.map((item) =>
          item.id === selectedChat.id
            ? {
                ...item,
                status,
                assignedAdminName: assignedAdminName ?? item.assignedAdminName,
                connectedAt,
              }
            : item,
        ),
      );
      setChatModalOpen(false);
      navigate(`/support/chat/${selectedChat.id}`);
    } finally {
      setChatActionLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (!pendingAction || actionLoading) return;
    setActionLoading(true);
    try {
      if (pendingAction.type === "ticket") {
        if (pendingAction.action === "delete") {
          await deleteSupportTicket({ id: pendingAction.id, type: pendingAction.ticketType! });
          setTicketItems((items) =>
            items.filter(
              (item) =>
                item.id !== pendingAction.id || item.type !== pendingAction.ticketType,
            ),
          );
        } else {
          const status = pendingAction.action === "complete" ? "completed" : "in_progress";
          await updateSupportTicketStatus({
            id: pendingAction.id,
            type: pendingAction.ticketType!,
            status,
          });
          setTicketItems((items) =>
            items.map((item) =>
              item.id === pendingAction.id && item.type === pendingAction.ticketType
                ? { ...item, status }
                : item,
            ),
          );
        }
      } else {
        if (pendingAction.action === "delete") {
          await deleteSupportRoom({ id: pendingAction.id });
          setRooms((items) => items.filter((item) => item.id !== pendingAction.id));
        } else {
          const status = pendingAction.action === "complete" ? "completed" : "in_progress";
          await updateSupportRoomStatus({ id: pendingAction.id, status });
          setRooms((items) =>
            items.map((item) => (item.id === pendingAction.id ? { ...item, status } : item)),
          );
        }
      }
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  }


  return (
    <main className="p-8 flex-1 overflow-auto md:overflow-auto min-h-0 bg-white">
      <div className="max-w-5xl mx-auto w-full min-h-0">
        <h1 className="text-[32px] mb-6" style={{ fontFamily: "var(--font-rubik)" }}>
          Suporte
        </h1>

        <section className="p-1 rounded-lg">
          <h2 className="font-medium text-[20px] mb-4">Ações rápidas</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <>
              <button
                type="button"
                onClick={() => {
                  setShowTicketsOnly((current) => {
                    const next = !current;
                    setPage(1);
                    return next;
                  });
                }}
                className="rounded-md flex flex-col justify-center items-start gap-3 p-5 w-full flex-1 min-w-0 bg-[#F7F9FF] cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
                style={{ border: "1px solid #D0D9F1" }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 32,
                    height: 32,
                    WebkitMask: "url(/Megaphone.svg) center / contain no-repeat",
                    mask: "url(/Megaphone.svg) center / contain no-repeat",
                    background: "#808DB2",
                  }}
                />
                <span className="text-[16px] font-medium text-[#191F33]">Ticket</span>
                <span className="text-sm text-[#191F33]">
                  {ticketsLoading
                    ? "Atualizando tickets..."
                    : ticketsTotal > 0
                    ? `${ticketsTotal} ticket${ticketsTotal > 1 ? "s" : ""}`
                    : "Nenhum ticket"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowTicketsOnly(false)}
                className="rounded-md flex flex-col justify-center items-start gap-3 p-5 w-full flex-1 min-w-0 bg-[#F7F9FF] cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
                style={{ border: "1px solid #D0D9F1" }}
              >
                <Image src="/Hand.svg" alt="Bate papo" width={32} height={32} />
                <span className="text-[16px] font-medium text-[#191F33]">Bate papo</span>
                <span className="text-sm text-[#191F33]">
                  {roomsLoading
                    ? "Atualizando chats..."
                    : rooms.length > 0
                    ? `${rooms.length} chat${rooms.length > 1 ? "s" : ""}`
                    : "Nenhum chat"}
                </span>
              </button>
            </>
          </div>
        </section>

        <section className="p-1 rounded-lg mt-6 pb-0 md:pb-0">
          <h2 className="font-medium text-[20px] mb-4">Ação rápida</h2>
          {showTicketsOnly ? (
            <div className="mb-4 rounded-xl border border-[#E2E8F8] bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <label className="text-xs" style={{ color: "#5A6480" }}>
                    Buscar ticket
                  </label>
                  <input
                    value={ticketSearch}
                    onChange={(event) => {
                      setTicketSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar por título, usuário ou motivo"
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "#D0D9F1", background: "#F8FAFF", color: "#191F33" }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="min-w-[160px]">
                    <label className="text-xs" style={{ color: "#5A6480" }}>
                      Status
                    </label>
                    <select
                      value={ticketStatusFilter}
                      onChange={(event) => {
                        setTicketStatusFilter(
                          event.target.value as "all" | "completed" | "in_progress",
                        );
                        setPage(1);
                      }}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "#D0D9F1", background: "#F8FAFF", color: "#191F33" }}
                    >
                      <option value="all">Todos</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="completed">Concluído</option>
                    </select>
                  </div>
                  <div className="min-w-[180px]">
                    <label className="text-xs" style={{ color: "#5A6480" }}>
                      Ordenar por data
                    </label>
                    <select
                      value={ticketSort}
                      onChange={(event) => {
                        setTicketSort(event.target.value as "newest" | "oldest");
                        setPage(1);
                      }}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "#D0D9F1", background: "#F8FAFF", color: "#191F33" }}
                    >
                      <option value="newest">Mais recente</option>
                      <option value="oldest">Mais antigo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {(showTicketsOnly ? ticketsLoading : roomsLoading && ticketsLoading) && paged.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`card-skeleton-${idx}`}
                  className="h-[174px] rounded-2xl border border-[#D4C7FF] bg-[#F3F0FF] animate-pulse"
                />
              ))}
            </div>
          ) : (!showTicketsOnly && roomsError && ticketsError && paged.length === 0) ||
            (showTicketsOnly && ticketsError && paged.length === 0) ? (
            <div className="text-sm" style={{ color: "#5A6480" }}>
              {ticketsError || roomsError}
            </div>
          ) : paged.length === 0 ? (
            <div className="text-sm" style={{ color: "#5A6480" }}>
              Nenhum item encontrado
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${
                pageAnimating ? "page-transition" : ""
              }`}
            >
              {paged.map((c) => {
                const menuKey =
                  c.type === "ticket" ? `ticket-${c.ticketType}-${c.id}` : `chat-${c.id}`;
                const isCompleted = c.status === "completed";
                return (
                <article
                  key={menuKey}
                  className="rounded-2xl flex transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md"
                  style={{
                    height: 200,
                    padding: 16,
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 16,
                    background: isCompleted ? "#E6F7ED" : "#F3F0FF",
                    border: isCompleted ? "1px solid #A7E3C5" : "1px solid #D4C7FF",
                  }}
                >
                  <header className="w-full flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                      <h3
                        className="text-[16px] font-medium"
                        style={{ color: isCompleted ? "#1F7A4D" : "#361A6D" }}
                      >
                        {c.title}
                      </h3>
                      {c.type === "chat" ? (() => {
                        const meta = getPriorityMeta(c.priority);
                        return (
                          <span
                            className="text-[11px] font-semibold"
                            style={{
                              color: meta.color,
                              background: meta.bg,
                              border: `1px solid ${meta.border}`,
                              borderRadius: 999,
                              padding: "2px 8px",
                              width: "fit-content",
                            }}
                          >
                            {meta.label}
                          </span>
                        );
                      })() : null}
                    </div>
                    <div
                      className="flex items-center gap-3"
                      ref={menuOpenId === menuKey ? menuRef : null}
                    >
                      {isCompleted ? (
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full"
                          style={{ background: "#E5F4ED", border: "1px solid #A7E3C5" }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#1F7A4D"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      ) : (
                        <Image src="/MinusCircle.svg" alt="Minimizar" width={20} height={20} />
                      )}
                      {c.type === "ticket" ? (
                        <div className="relative">
                          <button
                            type="button"
                            aria-label="Mais opcoes"
                            aria-haspopup="menu"
                            aria-expanded={menuOpenId === menuKey}
                            onClick={(event) => {
                              event.stopPropagation();
                              setMenuOpenId((current) => (current === menuKey ? null : menuKey));
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full cursor-pointer hover:bg-[#E9E3FF]"
                          >
                            <Image src="/DotsThreeVertical.svg" alt="Mais opcoes" width={18} height={18} />
                          </button>
                          {menuOpenId === menuKey && (
                            <div
                              role="menu"
                              className="absolute right-0 top-[calc(100%+8px)] w-[180px] rounded-xl border border-[#E2E8F8] bg-white p-2 text-sm text-[#191F33] shadow-[0px_18px_32px_rgba(63,85,199,0.16)]"
                            >
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setMenuOpenId(null);
                                  const action = c.status === "completed" ? "reopen" : "complete";
                                  setPendingAction({
                                    id: c.id,
                                    type: c.type,
                                    title: c.title,
                                    status: c.status,
                                    ticketType: c.type === "ticket" ? c.ticketType : undefined,
                                    action,
                                  });
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left cursor-pointer hover:bg-[#F4F6FF]"
                              >
                                {c.status === "completed" ? "Reabrir" : "Concluir"}
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setMenuOpenId(null);
                                  setPendingAction({
                                    id: c.id,
                                    type: c.type,
                                    title: c.title,
                                    status: c.status,
                                    ticketType: c.type === "ticket" ? c.ticketType : undefined,
                                    action: "delete",
                                  });
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#C53030] cursor-pointer hover:bg-[#FFF2F2]"
                              >
                                Apagar
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </header>

                  <div className="flex items-center gap-3 w-full">
                    {c.photoUrl ? (
                      <img
                        src={c.photoUrl}
                        alt={c.userName}
                        width={40}
                        height={40}
                        style={{ borderRadius: 8, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        aria-hidden
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          WebkitMask: "url(/User.svg) center / contain no-repeat",
                          mask: "url(/User.svg) center / contain no-repeat",
                          background: isCompleted ? "#1F7A4D" : "#6B4DB8",
                        }}
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            color: isCompleted ? "#1F7A4D" : "#361A6D",
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                        >
                          {c.userName}
                        </span>
                        {c.isTutor ? (
                          <span
                            className="text-[11px] font-medium uppercase"
                            style={{
                              color: isCompleted ? "#1F7A4D" : "#F17E00",
                              border: isCompleted ? "1px solid #A7E3C5" : "1px solid #FFD7AD",
                              borderRadius: 999,
                              padding: "2px 6px",
                            }}
                          >
                            Tutor
                          </span>
                        ) : null}
                      </div>
                      {c.nickname ? (
                        <span
                          style={{
                            color: isCompleted ? "#2E8B57" : "#6B4DB8",
                            fontSize: 14,
                            fontWeight: 400,
                          }}
                        >
                          {c.nickname}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {c.type === "chat" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChat(c as SupportRoom);
                        setChatModalOpen(true);
                      }}
                      className="mt-auto w-full flex items-center justify-center gap-2 rounded-md cursor-pointer"
                      style={{
                        padding: "10px 12px",
                        background: isCompleted ? "#E5F4ED" : "#977CEC",
                        color: isCompleted ? "#1F7A4D" : "#FCFDFF",
                        fontSize: 14,
                        fontWeight: 500,
                        border: isCompleted ? "1px solid #A7E3C5" : "none",
                      }}
                    >
                      {isCompleted ? (
                        <span
                          aria-hidden
                          style={{
                            width: 18,
                            height: 18,
                            display: "inline-block",
                            WebkitMask: "url(/Chat.svg) center / contain no-repeat",
                            mask: "url(/Chat.svg) center / contain no-repeat",
                            background: "#1F7A4D",
                          }}
                        />
                      ) : (
                        <Image src="/Chat.svg" alt="Acessar chat" width={18} height={18} />
                      )}
                      Acessar Chat
                    </button>
                  ) : (
                    <Link
                      href={`/support/ticket/${c.id}?type=${c.ticketType}`}
                      className="mt-auto w-full flex items-center justify-center gap-2 rounded-md cursor-pointer"
                      style={{
                        padding: "10px 12px",
                        background: isCompleted ? "#E5F4ED" : "#977CEC",
                        color: isCompleted ? "#1F7A4D" : "#FCFDFF",
                        fontSize: 14,
                        fontWeight: 500,
                        border: isCompleted ? "1px solid #A7E3C5" : "none",
                      }}
                    >
                      {isCompleted ? (
                        <span
                          aria-hidden
                          style={{
                            width: 18,
                            height: 18,
                            display: "inline-block",
                            WebkitMask: "url(/Chat.svg) center / contain no-repeat",
                            mask: "url(/Chat.svg) center / contain no-repeat",
                            background: "#1F7A4D",
                          }}
                        />
                      ) : (
                        <Image src="/Chat.svg" alt="Acessar ticket" width={18} height={18} />
                      )}
                      Acessar Ticket
                    </Link>
                  )}
                </article>
              );
            })}
            </div>
          )}
          <div className="md:hidden mt-4 px-4 flex items-center justify-center">
            <button
              type="button"
              aria-label="Pagina anterior"
              onClick={() => goPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
              style={{
                borderColor: "#D0D9F1",
                color: page === 1 ? "#7682A5" : "#191F33",
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              <Image
                src="/Arrow.svg"
                alt="Anterior"
                width={13}
                height={13}
                className="object-contain"
              />
            </button>
            <div
              ref={pagesContainerRef}
              className="pages-scroll"
              style={{
                margin: "0 16px",
                display: "flex",
                gap: 8,
                alignItems: "center",
                overflowX: "auto",
                scrollBehavior: "smooth",
              }}
            >
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    ref={p === page ? selectedBtnRef : null}
                    onClick={() => goPage(p)}
                    className="w-10 h-10 rounded-md flex items-center justify-center cursor-pointer"
                    style={{
                      padding: "10px",
                      fontSize: "14px",
                      fontWeight: 500,
                      borderColor: "#D0D9F1",
                      borderStyle: "solid",
                      borderWidth: "1px",
                      color: p === page ? "#191F33" : "#7682A5",
                      background: "white",
                      minWidth: 40,
                      textAlign: "center",
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Proxima Pagina"
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
              style={{
                borderColor: "#D0D9F1",
                color: page === totalPages ? "#7682A5" : "#191F33",
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              <Image
                src="/Arrow.svg"
                alt="Proxima"
                width={13}
                height={13}
                className="object-contain rotate-180"
              />
            </button>
          </div>
          <div className="hidden md:flex mt-6 px-8 justify-center">
            <div className="bg-transparent p-0 flex items-center justify-center">
              <button
                type="button"
                aria-label="Pagina anterior"
                onClick={() => goPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
                style={{
                  borderColor: "#D0D9F1",
                  color: page === 1 ? "#7682A5" : "#191F33",
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                <Image
                  src="/Arrow.svg"
                  alt="Anterior"
                  width={13}
                  height={13}
                  className="object-contain"
                />
              </button>

              <div
                ref={pagesContainerRef}
                className="pages-scroll"
                style={{
                  margin: "0 24px",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  overflowX: "auto",
                  scrollBehavior: "smooth",
                }}
              >
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  return (
                    <button
                      key={p}
                      ref={p === page ? selectedBtnRef : null}
                      onClick={() => goPage(p)}
                      className="w-12 h-12 rounded-md flex items-center justify-center cursor-pointer"
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: 500,
                        borderColor: "#D0D9F1",
                        borderStyle: "solid",
                        borderWidth: "1px",
                        color: p === page ? "#191F33" : "#7682A5",
                        background: "white",
                        minWidth: 44,
                        textAlign: "center",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Proxima Pagina"
                onClick={() => goPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
                style={{
                  borderColor: "#D0D9F1",
                  color: page === totalPages ? "#7682A5" : "#191F33",
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                <Image
                  src="/Arrow.svg"
                  alt="Proxima"
                  width={13}
                  height={13}
                  className="object-contain rotate-180"
                />
              </button>
            </div>
          </div>
        </section>
      </div>
      <Modal
        open={chatModalOpen && selectedChat !== null}
        onClose={() => {
          setChatModalOpen(false);
          setSelectedChat(null);
        }}
        title="Detalhes do bate papo"
        subtitle="Informações da solicitação"
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm"
              style={{ borderColor: "#D0D9F1", color: "#191F33" }}
              onClick={() => {
                setChatModalOpen(false);
                setSelectedChat(null);
              }}
              disabled={chatActionLoading}
            >
              Fechar
            </button>
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm text-white"
              style={{ background: "#256740", opacity: chatActionLoading ? 0.7 : 1 }}
              onClick={handleConnectChat}
              disabled={chatActionLoading}
            >
              {chatActionLoading ? "Conectando..." : "Conectar"}
            </button>
          </div>
        }
      >
        {selectedChat ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {(() => {
                const meta = getPriorityMeta(selectedChat.priority);
                return (
                  <span
                    className="text-[11px] font-semibold"
                    style={{
                      color: meta.color,
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      borderRadius: 999,
                      padding: "2px 8px",
                      width: "fit-content",
                    }}
                  >
                    {meta.label}
                  </span>
                );
              })()}
            </div>

            <div className="rounded-lg border" style={{ borderColor: "#E2E8F8" }}>
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs" style={{ color: "#8A94AB" }}>
                    Solicitante
                  </div>
                  <div className="text-sm" style={{ color: "#191F33", fontWeight: 600 }}>
                    {selectedChat.requesterName || selectedChat.userName}
                  </div>
                  <div className="text-xs" style={{ color: "#5A6480" }}>
                    {selectedChat.requesterRole || (selectedChat.isTutor ? "Tutor" : "Usuário")}
                  </div>
                </div>

                <div>
                  <div className="text-xs" style={{ color: "#8A94AB" }}>
                    Motivo
                  </div>
                  <div className="text-sm" style={{ color: "#191F33" }}>
                    {selectedChat.reason || "Não informado"}
                  </div>
                </div>

                <div>
                  <div className="text-xs" style={{ color: "#8A94AB" }}>
                    Descrição
                  </div>
                  <div className="text-sm" style={{ color: "#191F33" }}>
                    {selectedChat.description || "Sem descrição"}
                  </div>
                </div>

                {selectedChat.assignedAdminName ? (
                  <div>
                    <div className="text-xs" style={{ color: "#8A94AB" }}>
                      Em atendimento por
                    </div>
                    <div className="text-sm" style={{ color: "#191F33" }}>
                      {selectedChat.assignedAdminName}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        title={confirmTitle}
        subtitle={confirmSubtitle}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm"
              style={{ borderColor: "#D0D9F1", color: "#191F33" }}
              onClick={() => setPendingAction(null)}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm text-white"
              style={{
                background: pendingAction?.action === "delete" ? "#C53030" : "#256740",
                opacity: actionLoading ? 0.7 : 1,
              }}
              onClick={handleConfirmAction}
              disabled={actionLoading}
            >
              {actionLoading ? "Processando..." : "Confirmar"}
            </button>
          </div>
        }
      >
        <p className="text-sm" style={{ color: "#5A6480" }}>
          {confirmDescription}
        </p>
      </Modal>
    </main>
  );
}



