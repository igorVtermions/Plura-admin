"use client";

import React from "react";
import Image from "next/image";

type User = {
  id?: string | number;
  name?: string;
  photoUrl?: string;
};

type LiveRoomCardProps = {
  id: string;
  dateLabel?: string;
  startAt?: string | Date;
  endAt?: string | Date;
  topic: string;
  host: string;
  liveUsers?: User[];
  onJoin?: (id: string) => void;
};

function toDate(d?: string | Date) {
  if (!d) return undefined;
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatRangeLabel(start?: Date, end?: Date) {
  if (!start || !end) return "";
  const now = new Date();
  const isToday =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();

  const startLabel = start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
  const endLabel = end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });

  if (isToday) return `Hoje - Das ${startLabel} às ${endLabel}`;
  const dateLabel = start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${dateLabel} - Das ${startLabel} às ${endLabel}`;
}

export function LiveRoomCard({
  id,
  dateLabel,
  startAt,
  endAt,
  topic,
  host,
  liveUsers = [],
  onJoin,
}: LiveRoomCardProps) {
  const start = toDate(startAt);
  const end = toDate(endAt);
  const label = dateLabel && dateLabel.length > 0 ? dateLabel : formatRangeLabel(start, end);

  const safeUsers = Array.isArray(liveUsers) ? liveUsers : [];

  return (
    <article
      className="border rounded-lg p-4 bg-[#FBFBFF] border-[#E9EDF6] transition-shadow hover:shadow-sm"
      aria-labelledby={`room-${id}-title`}
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Image src="/Calendar.svg" alt="Calendário" width={20} height={20} aria-hidden className="object-contain" />
          <span className="text-[12px] text-[#6B4DB8]">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/Live.svg" alt="Ao vivo" width={20} height={20} className="object-contain" />
          <span className="text-[12px] text-[#6B4DB8]">Ao vivo</span>
        </div>
      </header>

      <h3
        id={`room-${id}-title`}
        className="text-[16px] font-medium text-[#361A6D] mb-1"
      >
        {topic}
      </h3>
      <p className="text-[12px] font-normal text-[#361A6D] mb-3">{host}</p>

      <div className="flex items-center gap-3 mb-4">
        {safeUsers.length === 0 ? (
          <span className="text-xs text-[#808DB2]">Sala vazia</span>
        ) : (
          <>
            <div className="flex -space-x-2">
              {safeUsers.slice(0, 3).map((u, i) => (
                <div
                  key={u.id ?? i}
                  className="w-6 h-6 rounded-full ring-2 ring-white bg-[#977CEC] overflow-hidden flex items-center justify-center text-[10px] text-white"
                >
                  {u.photoUrl ? (
                    <Image src={u.photoUrl} alt={u.name ?? "user"} width={24} height={24} className="object-cover" />
                  ) : (
                    (u.name && u.name[0]) || "?"
                  )}
                </div>
              ))}
            </div>
            <div className="text-[12px] font-normal text-[#191F33] ml-2">
              {safeUsers.length > 3 ? `+${safeUsers.length - 3} online` : `${safeUsers.length} online`}
            </div>
          </>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => onJoin?.(id)}
          className="w-full flex items-center justify-center gap-2 bg-[#977CEC] text-white px-3 py-2 rounded-md text-sm cursor-pointer"
        >
          <Image src="/Enter.svg" alt="Entrar" width={18} height={18} className="object-contain" />
          <span>Ingressar na sala</span>
        </button>
      </div>
    </article>
  );
}