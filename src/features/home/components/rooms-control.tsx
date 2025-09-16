"use client";

import React, { useMemo, useState } from "react";
import { LiveRoomCard } from "./live-room-card";
import { SoonRoomCard } from "./soon-room-card";

type Room = {
  id: string;
  title: string;
  speaker?: string;
  time?: string;
  startAt?: string;
  endAt?: string;
  users?: { id?: string | number; name?: string; photoUrl?: string }[];
};

const allRoomsSample = Array.from({ length: 12 }).map((_, i) => ({
  id: `r${i + 1}`,
  title: `Sala ${i + 1} — Tópico ${i + 1}`,
  speaker: i % 2 === 0 ? "João Silva" : "Mariana Costa",
  time: i % 2 === 0 ? "Agora" : "Em breve",
  startAt: new Date().toISOString(),
  endAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  users: Array.from({ length: (i % 5) + 1 }).map((__, u) => ({ id: `${i}-${u}`, name: `Usuário ${u + 1}` })),
}));

export function RoomsControl() {
  const [tab, setTab] = useState<"live" | "waiting">("live");
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  const rooms = useMemo(() => {
    return tab === "live" ? allRoomsSample.filter((_, i) => i % 2 === 0) : allRoomsSample.filter((_, i) => i % 2 === 1);
  }, [tab]);

  const totalPages = Math.max(1, Math.ceil(rooms.length / perPage));
  const paged = rooms.slice((page - 1) * perPage, page * perPage);

  function handleJoin(id: string) {
    console.log("Ingressar em", id);
  }

  function goPage(p: number) {
    setPage(Math.max(1, Math.min(totalPages, p)));
  }

  function toggleReminder(id: string) {
    setReminders((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  React.useEffect(() => setPage(1), [tab]);

  return (
    <section className="mt-8 p-1 rounded-lg bg-white">
      <h2 className="font-medium text-[20px] mb-4">Controle de salas</h2>

      <div className="w-full flex justify-center mb-6">
        <div className="w-full max-w-full">
          <div role="tablist" aria-label="Controle de salas" className="mx-auto w-full">
            <div className="rounded-full border-2 border-[#D0D9F1] overflow-hidden">
              <div className="flex items-stretch">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "live"}
                  onClick={() => setTab("live")}
                  className={`flex-1 px-6 py-3 text-[16px] font-medium transition-colors duration-150 focus:outline-none text-[#191F33] ${
                    tab === "live" ? "bg-[#ECF0FD]" : "bg-white"
                  }`}
                >
                  Salas ao vivo
                </button>
                <div className="w-[1px] bg-[#D0D9F1]" aria-hidden />
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "waiting"}
                  onClick={() => setTab("waiting")}
                  className={`flex-1 px-6 py-3 text-[16px] font-medium transition-colors duration-150 focus:outline-none text-[#191F33] ${
                    tab === "waiting" ? "bg-[#ECF0FD]" : "bg-white"
                  }`}
                >
                  Salas em espera
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {tab === "live"
          ? paged.map((r) => (
              <LiveRoomCard
                key={r.id}
                id={r.id}
                topic={r.title}
                host={r.speaker ?? ""}
                startAt={r.startAt}
                endAt={r.endAt}
                liveUsers={r.users}
                onJoin={handleJoin}
              />
            ))
          : paged.map((r) => (
              <SoonRoomCard
                key={r.id}
                topic={r.title}
                host={r.speaker ?? ""}
                startAt={r.startAt}
                endAt={r.endAt}
                showSlash={!!reminders[r.id]}
                onToggleReminder={() => toggleReminder(r.id)}
              />
            ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 rounded-md border border-[#E6EAF2] text-sm disabled:opacity-50"
        >
          Anterior
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={`w-8 h-8 rounded-md text-sm ${p === page ? "bg-[#ECF0FD] border border-[#D0D9F1]" : "bg-white border border-transparent"}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => goPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 rounded-md border border-[#E6EAF2] text-sm disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </section>
  );
}