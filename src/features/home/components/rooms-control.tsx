"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "@/components/ui/Image";
import { LiveRoomCard } from "./live-room-card";
import { SoonRoomCard } from "./soon-room-card";
import api from "@/services/api";

type User = { id?: string | number; name?: string; photoUrl?: string };
type RoomApi = Record<string, unknown>;
type RoomUI = {
  id: string;
  title: string;
  speaker?: string;
  startAt?: string | Date;
  endAt?: string | Date;
  users?: User[];
};

function adaptRoom(r: RoomApi): RoomUI | null {
  if (!r) return null;
  const id = String(r["id"] ?? r["roomId"] ?? "");
  const title = typeof r["title"] === "string" ? r["title"] : typeof r["name"] === "string" ? r["name"] : "";
  const possibleSpeakers: unknown[] = [
    (r["tutor"] as Record<string, unknown>)?.["name"],
    r["tutorName"],
    r["host"],
    r["speaker"],
    (r["creator"] as Record<string, unknown>)?.["name"],
    (r["owner"] as Record<string, unknown>)?.["name"],
    (r["user"] as Record<string, unknown>)?.["name"],
    (r["createdBy"] as Record<string, unknown>)?.["name"],
  ];
  const speaker = possibleSpeakers.find((v): v is string => typeof v === "string") ?? undefined;

  const users =
    Array.isArray(r["liveUsers"]) || Array.isArray(r["users"])
      ? ((r["liveUsers"] ?? r["users"]) as unknown[]).filter((u): u is User => typeof u === "object" && u != null)
      : [];

  const startAt = typeof r["startAt"] === "string" || r["startAt"] instanceof Date ? (r["startAt"] as string | Date) : undefined;
  const endAt = typeof r["endAt"] === "string" || r["endAt"] instanceof Date ? (r["endAt"] as string | Date) : undefined;

  if (!id || !title) return null;
  return { id, title, speaker, startAt, endAt, users };
}

function categorizeRooms(rooms: RoomUI[]) {
  const now = new Date();
  const live: RoomUI[] = [];
  const soon: RoomUI[] = [];
  for (const r of rooms) {
    const s = r.startAt ? new Date(r.startAt) : undefined;
    const e = r.endAt ? new Date(r.endAt) : undefined;
    if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime())) continue;
    if (now < s) soon.push(r);
    else if (now >= s && now <= e) live.push(r);
  }
  return { live, soon };
}

export function RoomsControl() {
  const [tab, setTab] = useState<"live" | "waiting">("live");
  const [page, setPage] = useState(1);
  const [pageAnimating, setPageAnimating] = useState(false);
  const pagesContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedBtnRef = useRef<HTMLButtonElement | null>(null);
  const perPage = 6;
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveRooms, setLiveRooms] = useState<RoomUI[]>([]);
  const [soonRooms, setSoonRooms] = useState<RoomUI[]>([]);

  async function fetchRooms() {
    setLoading(true);
    setError(null);
    try {
      let data: unknown = null;
      try {
        const res = await api.get("/admin/live-chat-rooms");
        data = res.data;
      } catch {
        const res = await api.get("/users/live-chat-rooms");
        data = res.data;
      }

      let all: unknown[] = [];
      if (Array.isArray(data)) all = data as unknown[];
      else if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        const a1 = Array.isArray(d["liveRooms"]) ? (d["liveRooms"] as unknown[]) : [];
        const a2 = Array.isArray(d["soonRooms"]) ? (d["soonRooms"] as unknown[]) : [];
        all = [...a1, ...a2];
      }

      const adapted = all.map((x) => adaptRoom(x as RoomApi)).filter((r): r is RoomUI => r !== null);
      const { live, soon } = categorizeRooms(adapted);
      setLiveRooms(live);
      setSoonRooms(soon);
    } catch (e) {
      console.error("fetchRooms error", e);
      setError("Falha ao carregar salas");
      setLiveRooms([]);
      setSoonRooms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => setPage(1), [tab]);

  useEffect(() => {
    setPageAnimating(true);
    const t = setTimeout(() => setPageAnimating(false), 260);
    return () => clearTimeout(t);
  }, [page, tab]);

  const rooms = useMemo(() => (tab === "live" ? liveRooms : soonRooms), [tab, liveRooms, soonRooms]);
  const totalPages = Math.max(1, Math.ceil(rooms.length / perPage));
  const paged = rooms.slice((page - 1) * perPage, page * perPage);
  useEffect(() => {
    if (selectedBtnRef.current) {
      selectedBtnRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [page, totalPages]);

  function handleJoin(id: string) {
    console.log("Ingressar em", id);
  }
  function goPage(p: number) {
    setPage(Math.max(1, Math.min(totalPages, p)));
  }
  function toggleReminder(id: string) {
    setReminders((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <section className="mt-8 p-1 pb-0 rounded-lg bg-white flex flex-col overflow-hidden h-full min-h-0">
      <h2 className="font-medium text-[20px] mb-4">Controle de salas</h2>

      <div className="w-full flex justify-center mb-6">
        <div className="w-full max-w-full">
          <div role="tablist" aria-label="Controle de salas" className="mx-auto w-full">
            <div className="rounded-full border-2 border-[#D0D9F1] overflow-hidden relative">
              <span
                aria-hidden
                className="absolute top-0 left-0 h-full w-1/2 bg-[#ECF0FD] transition-transform duration-200"
                style={{ transform: tab === "live" ? "translateX(0%)" : "translateX(100%)" }}
              />
              <div className="flex items-stretch relative z-10">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "live"}
                  onClick={() => setTab("live")}
                  className="flex-1 px-6 py-3 text-[16px] font-medium transition-colors duration-150 focus:outline-none text-[#191F33] bg-transparent"
                >
                  Salas ao vivo
                </button>
                <div className="w-[1px] bg-[#D0D9F1]" aria-hidden />
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "waiting"}
                  onClick={() => setTab("waiting")}
                  className="flex-1 px-6 py-3 text-[16px] font-medium transition-colors duration-150 focus:outline-none text-[#191F33] bg-transparent"
                >
                  Salas em espera
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-3" role="alert">{error}</div>}

      <div key={`${tab}-${page}`} className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-0 ${pageAnimating ? "page-transition" : ""} flex-1 min-h-0 items-start`}>
        {loading ? (
          Array.from({ length: perPage }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 bg-[#FBFBFF] border-[#E9EDF6] animate-pulse h-[180px]" />
          ))
        ) : rooms.length === 0 ? (
          <div className="col-span-full text-sm text-[#808DB2]">Nenhuma sala encontrada</div>
        ) : tab === "live" ? (
          paged.map((r) => (
            <LiveRoomCard key={r.id} id={r.id} topic={r.title} host={r.speaker ?? ""} startAt={r.startAt} endAt={r.endAt} liveUsers={r.users} onJoin={handleJoin} />
          ))
        ) : (
          paged.map((r) => (
            <SoonRoomCard key={r.id} topic={r.title} host={r.speaker ?? ""} startAt={r.startAt} endAt={r.endAt} showSlash={!!reminders[r.id]} onToggleReminder={() => toggleReminder(r.id)} />
          ))
        )}
      </div>
      <div className="flex items-center justify-center flex-shrink-0 mt-auto md:hidden" style={{ marginBottom: 0 }}>
        <button
          type="button"
          aria-label="Página anterior"
          onClick={() => goPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
          style={{ borderColor: '#D0D9F1', color: page === 1 ? '#7682A5' : '#191F33', opacity: page === 1 ? 0.5 : 1 }}
        >
          <Image src="/Arrow.svg" alt="Anterior" width={13} height={13} className="object-contain" />
        </button>
        <div
          ref={pagesContainerRef}
          className="pages-scroll"
          style={{ margin: "0 16px", display: "flex", gap: 8, alignItems: "center", overflowX: "auto", scrollBehavior: "smooth" }}
        >
          {(() => {
            const maxVisible = 5;
            const half = Math.floor(maxVisible / 2);
            const start = Math.max(1, Math.min(page - half, Math.max(1, totalPages - maxVisible + 1)));
            const end = Math.min(totalPages, start + maxVisible - 1);
            const pages: number[] = [];
            for (let i = start; i <= end; i++) pages.push(i);
            return pages.map((p) => (
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
            ));
          })()}
        </div>
        <button
          type="button"
          aria-label="Próxima página"
          onClick={() => goPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
          style={{ borderColor: '#D0D9F1', color: page === totalPages ? '#7682A5' : '#191F33', opacity: page === totalPages ? 0.5 : 1 }}
        >
          <Image src="/Arrow.svg" alt="Próxima" width={13} height={13} className="object-contain rotate-180" />
        </button>
      </div>
      <div className="hidden md:flex fixed left-1/2 transform -translate-x-1/2 bottom-4 z-50 w-full max-w-5xl px-8 pointer-events-auto">
        <div className="w-full bg-transparent flex items-center justify-center">
          <div className="bg-transparent p-0 flex items-center justify-center">
            <button
              type="button"
              aria-label="Página anterior"
              onClick={() => goPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
              style={{ borderColor: '#D0D9F1', color: page === 1 ? '#7682A5' : '#191F33', opacity: page === 1 ? 0.5 : 1 }}
            >
              <Image src="/Arrow.svg" alt="Anterior" width={13} height={13} className="object-contain" />
            </button>

            <div
              ref={pagesContainerRef}
              className="pages-scroll"
              style={{ margin: "0 24px", display: "flex", gap: 8, alignItems: "center", overflowX: "auto", scrollBehavior: "smooth" }}
            >
              {(() => {
                const maxVisible = 5;
                const half = Math.floor(maxVisible / 2);
                const start = Math.max(1, Math.min(page - half, Math.max(1, totalPages - maxVisible + 1)));
                const end = Math.min(totalPages, start + maxVisible - 1);
                const pages: number[] = [];
                for (let i = start; i <= end; i++) pages.push(i);
                return pages.map((p) => (
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
                ));
              })()}
            </div>

            <button
              type="button"
              aria-label="Próxima página"
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
              style={{ borderColor: '#D0D9F1', color: page === totalPages ? '#7682A5' : '#191F33', opacity: page === totalPages ? 0.5 : 1 }}
            >
              <Image src="/Arrow.svg" alt="Próxima" width={13} height={13} className="object-contain rotate-180" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-transition { animation: pageFade 320ms cubic-bezier(.22,.9,.32,1); }
        @keyframes pageFade {
          from { opacity: 0; transform: translateY(12px) scale(0.995); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pages-scroll { -webkit-overflow-scrolling: touch; }
        .pages-scroll::-webkit-scrollbar { height: 6px; display: none; }
        .pages-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </section>
  );
}
