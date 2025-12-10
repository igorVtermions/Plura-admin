"use client";

import React from "react";
import Image from "@/components/ui/Image";

type SoonRoomCardProps = {
  dateLabel?: string;
  startAt?: string | Date;
  endAt?: string | Date;
  topic: string;
  host: string;
  showSlash: boolean;
  onToggleReminder: () => void;
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

  const startLabel = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endLabel = end.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isToday) {
    return `Hoje - Das ${startLabel} às ${endLabel}`;
  }
  const dateLabel = start.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${dateLabel} - Das ${startLabel} às ${endLabel}`;
}
function CalendarIcon({ color = "#BE6100", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 3v4M8 3v4"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 11h18"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockWaitingIcon({ color = "#BE6100", size = 20 }: { color?: string; size?: number }) {
  return (
    <Image
      src="/ClockWainting.svg"
      alt="Clock waiting"
      width={20}
      height={20}
      className="object-contain"
    />
  );
}
function BellInline({
  color = "#F17E00",
  size = 20,
  className = "",
  showSlash = false,
}: {
  color?: string;
  size?: number;
  className?: string;
  showSlash?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M7.5 17.5H12.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.37515 8.125C4.37515 6.63316 4.96778 5.20242 6.02267 4.14752C7.07756 3.09263 8.5083 2.5 10.0001 2.5C11.492 2.5 12.9227 3.09263 13.9776 4.14752C15.0325 5.20242 15.6251 6.63316 15.6251 8.125C15.6251 10.9234 16.2736 13.1719 16.7892 14.0625C16.844 14.1574 16.8728 14.2649 16.8729 14.3745C16.873 14.484 16.8444 14.5916 16.7898 14.6865C16.7352 14.7815 16.6566 14.8604 16.5619 14.9154C16.4672 14.9705 16.3597 14.9996 16.2501 15H3.75015C3.64076 14.9993 3.53345 14.97 3.43896 14.9149C3.34448 14.8597 3.26611 14.7808 3.2117 14.6859C3.15729 14.591 3.12874 14.4835 3.12891 14.3741C3.12907 14.2647 3.15795 14.1572 3.21265 14.0625C3.72749 13.1719 4.37515 10.9227 4.37515 8.125Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showSlash && (
        <path
          d="M3.5 3.5L16.5 16.5"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function SoonRoomCard({
  dateLabel,
  startAt,
  endAt,
  topic,
  host,
  showSlash,
  onToggleReminder,
}: SoonRoomCardProps) {
  const start = toDate(startAt);
  const end = toDate(endAt);
  const label = dateLabel && dateLabel.length > 0 ? dateLabel : formatRangeLabel(start, end);

  return (
    <article
      className="flex h-full flex-col border rounded-md p-4 bg-[#FFF2E0] transition-shadow hover:shadow-sm"
      style={{ borderColor: "#FFD7AD" }}
      aria-labelledby={`soon-room-${topic}`}
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <CalendarIcon color="#BE6100" size={20} />
          <span className="text-[12px] text-[#BE6100]">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <ClockWaitingIcon color="#BE6100" size={20} />
          <span className="text-[12px] text-[#BE6100]">em breve</span>
        </div>
      </header>

      <h3 className="text-[16px] font-medium text-[#582F01] mb-1">{topic}</h3>

      <p className="text-[12px] font-normal text-[#582F01] mb-3">{host}</p>

      <div className="mt-auto">
        <button
          type="button"
          onClick={onToggleReminder}
          className="w-full flex items-center justify-center gap-2 bg-[#FFF2E0] px-3 py-2 rounded-md text-sm cursor-pointer"
          style={{ border: "1px solid #FFD7AD", color: "#F17E00" }}
          aria-pressed={showSlash}
        >
          <BellInline
            color="#F17E00"
            size={20}
            className={showSlash ? "opacity-70" : "opacity-100"}
            showSlash={showSlash}
          />
          <span className="text-[14px] font-medium" style={{ color: "#F17E00" }}>
            {showSlash ? "Esquecer" : "Lembre-me"}
          </span>
        </button>
      </div>
    </article>
  );
}
