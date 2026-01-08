"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import {
  fetchRoomHistoryDetail,
  type RoomHistoryDetail,
  type RoomHistoryParticipant,
} from "@/services/room-history";

function formatRangeLabel(start?: string | null, end?: string | null) {
  if (!start || !end) return "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "";

  const isToday =
    startDate.getFullYear() === new Date().getFullYear() &&
    startDate.getMonth() === new Date().getMonth() &&
    startDate.getDate() === new Date().getDate();

  const startLabel = startDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endLabel = endDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dateLabel = startDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return isToday
    ? `Hoje - ${startLabel} ate ${endLabel}`
    : `${dateLabel} - ${startLabel} ate ${endLabel}`;
}

function formatCountLabel(value?: number | null) {
  if (typeof value !== "number") return "0";
  return String(value);
}

function toHandle(name?: string | null, codinome?: string | null) {
  if (codinome && codinome.trim().length > 0) return `@${codinome.replace(/^@/, "")}`;
  if (!name) return "Sem identificador";
  return name;
}

export function RoomHistoryPage() {
  const { historyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<RoomHistoryDetail | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!historyId) {
        setError("Sala nao encontrada.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRoomHistoryDetail(historyId);
        if (cancelled) return;
        if (!data) {
          setError("Sala nao encontrada.");
          setDetail(null);
          return;
        }
        setDetail(data);
      } catch (err) {
        if (cancelled) return;
        console.error("fetchRoomHistoryDetail error", err);
        setError("Nao foi possivel carregar o historico.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [historyId]);

  const filteredParticipants = useMemo(() => {
    const list = detail?.participants ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((item) => {
      const name = (item.name ?? "").toLowerCase();
      const codinome = (item.codinome ?? "").toLowerCase();
      return name.includes(term) || codinome.includes(term);
    });
  }, [detail, search]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="h-8 w-40 rounded-md bg-[#F4F6FF] animate-pulse" />
          <div className="mt-6 h-28 rounded-2xl bg-[#F4F6FF] animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <p className="text-lg text-[#5A6480]">{error ?? "Sala nao encontrada."}</p>
          <Button className="mt-6" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </main>
    );
  }

  const room = detail.room;
  const tutor = room.tutor;
  const timeLabel = formatRangeLabel(room.startAt, room.actualEndAt ?? room.endAt);
  const topicsLabel = room.topics?.length ? room.topics.join(", ") : "Sem topicos";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F8] text-[#5A6480] hover:bg-[#F4F6FF]"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-[22px] font-semibold text-[#191F33]">Sala criada</h1>
            {timeLabel && <p className="text-sm text-[#7B87A6]">{timeLabel}</p>}
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-[#E6EBFA] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#191F33]">{room.title}</h2>
                {room.description && (
                  <p className="mt-2 text-sm text-[#5A6480]">{room.description}</p>
                )}
              </div>
              <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-medium text-[#4C5FB8]">
                Finalizada
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[#EEF2FF] bg-[#F9FAFF] p-4">
                <p className="text-xs font-semibold uppercase text-[#7B87A6]">Topicos</p>
                <p className="mt-2 text-sm text-[#2B1F58]">{topicsLabel}</p>
              </div>
              <div className="rounded-2xl border border-[#EEF2FF] bg-[#F9FAFF] p-4">
                <p className="text-xs font-semibold uppercase text-[#7B87A6]">Acessos totais</p>
                <p className="mt-2 text-2xl font-semibold text-[#2B1F58]">
                  {formatCountLabel(room.totalParticipants)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E6EBFA] bg-white p-6">
            <p className="text-xs font-semibold uppercase text-[#7B87A6]">Instrutor</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-[#F4F6FF]">
                  {tutor?.photoUrl ? (
                    <Image
                      src={tutor.photoUrl}
                      alt={tutor.name ?? "Tutor"}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center text-[#9BA3BC]">
                      <User className="h-5 w-5" aria-hidden />
                    </div>
                  )}
                </div>
              <div>
                <p className="text-sm font-semibold text-[#191F33]">
                  {tutor?.name ?? "Nao informado"}
                </p>
                <p className="text-xs text-[#7B87A6]">Instrutor responsável</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-[#E6EBFA] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#191F33]">Usuarios que participaram</h2>
              <p className="text-sm text-[#7B87A6]">
                {filteredParticipants.length} participante
                {filteredParticipants.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A94AB]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Pesquisar usuarios"
                className="h-10 rounded-xl border-[#D0D9F1] bg-white pl-10 text-sm text-[#191F33]"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {filteredParticipants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D0D9F1] p-6 text-center text-sm text-[#7B87A6]">
                Nenhum participante encontrado.
              </div>
            ) : (
              filteredParticipants.map((user: RoomHistoryParticipant, index) => (
                <div
                  key={`${user.userId ?? index}`}
                  className="flex items-center justify-between rounded-2xl border border-[#EEF2FF] bg-[#F9FAFF] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-white">
                      {user.photoUrl ? (
                        <Image
                          src={user.photoUrl}
                          alt={user.name ?? "Usuario"}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center text-[#9BA3BC]">
                          <User className="h-4 w-4" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#2B1F58]">
                        {user.name ?? "Usuario"}
                      </p>
                      <p className="text-xs text-[#7B87A6]">
                        {toHandle(user.name, user.codinome)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
