// src/features/instructors/components/profile/InstructorActivitySection.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import type { InstructorProfileActivity } from "../../types";
import { formatDateTime, formatDuration } from "@/features/users/profile-formatters";

type Props = {
  sessions: InstructorProfileActivity[];
  total: number;
};

function formatRange(start: string | null, end: string | null): string {
  if (!start) return "Horário não informado";

  const startDate = new Date(start);
  const startValid = !Number.isNaN(startDate.getTime());
  const endDate = end ? new Date(end) : null;
  const endValid = endDate ? !Number.isNaN(endDate.getTime()) : false;

  const dayLabel = startValid
    ? startDate.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      })
    : null;
  const startTime = startValid
    ? startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;
  const endTime =
    endValid && endDate
      ? endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : null;

  if (dayLabel && startTime && endTime) return `${dayLabel} • ${startTime} às ${endTime}`;
  if (dayLabel && startTime) return `${dayLabel} • ${startTime}`;
  if (startTime && endTime) return `${startTime} às ${endTime}`;

  const fallback = formatDateTime(start) ?? (end ? formatDateTime(end) : null);
  return fallback ?? dayLabel ?? start ?? "Horário não informado";
}

export default function InstructorActivitySection({ sessions, total }: Props) {
  return (
    <section className="mt-10 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#191F33]">Atividade recente</h2>
        <span className="text-sm text-[#8A94AB]">
          {total} sala{total === 1 ? "" : "s"} registradas
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sessions.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[#D0D9F1] p-10 text-center text-[#5A6480]">
            Nenhuma sala registrada para este instrutor.
          </div>
        ) : (
          sessions.map((session) => {
            const schedule = session.startTime
              ? formatRange(session.startTime, session.endTime)
              : "Horário não informado";
            const duration = formatDuration(session.durationMinutes);
            const participantsLabel =
              typeof session.participantsCount === "number"
                ? `+${session.participantsCount} online`
                : "Audiência não informada";

            const live =
              session.isLive ||
              (session.status
                ? ["live", "ao vivo", "in progress"].includes(session.status.toLowerCase())
                : false);
            const statusLabel = live
              ? "Ao vivo"
              : session.status
              ? session.status.charAt(0).toUpperCase() + session.status.slice(1)
              : null;

            return (
              <article
                key={session.id}
                className="group flex h-full flex-col rounded-2xl border border-[#E2E8F8] bg-[#F9F5FF] p-5 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(99,80,201,0.12)]"
              >
                <div className="flex items-center justify-between text-xs text-[#8A94AB]">
                  <span>{schedule}</span>
                  {duration && <span>{duration}</span>}
                </div>

                <h3 className="mt-3 text-base font-semibold text-[#2B1F58] transition-colors duration-200 group-hover:text-[#1E1542]">
                  {session.title}
                </h3>

                {statusLabel && (
                  <span
                    className={`mt-2 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      live ? "bg-[#FCE8FF] text-[#7D2E91]" : "bg-[#EEF1FF] text-[#545C91]"
                    }`}
                  >
                    {statusLabel}
                  </span>
                )}

                <p className="mt-3 text-xs font-medium text-[#586189]">{participantsLabel}</p>

                <div className="mt-auto pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 w-full rounded-xl border border-[#D5DDF5] text-sm font-semibold text-[#6350C9] transition-colors hover:border-[#BFC6EB] hover:bg-[#F3F0FF]"
                  >
                    Ingressar na sala
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}