// src/features/users/components/profile/UserActivitySection.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import type { UserProfileActivity } from "@/types/users";
import { EndedRoomCard } from "@/app/home/components/ended-room-card";
import { formatDateTime, formatDuration } from "../../utils/profile-formatters";

type Props = {
  liveHistory: UserProfileActivity[];
  liveHistoryTotal: number;
  finishedSessions?: Array<Record<string, any>>;
  finishedTotal?: number;
};

export const UserActivitySection: React.FC<Props> = ({
  liveHistory,
  liveHistoryTotal,
  finishedSessions,
  finishedTotal,
}) => (
  <section className="mt-10 space-y-6">
    <header className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-[#191F33]">Atividade</h2>
      {liveHistoryTotal > 0 && (
        <span className="text-sm text-[#8A94AB]">
          {liveHistoryTotal} sala{liveHistoryTotal === 1 ? "" : "s"} registradas
        </span>
      )}
    </header>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.isArray(finishedSessions) && finishedSessions.length > 0 ? (
        finishedSessions.map((item) => {
          const historyId = String(item.roomHistoryId ?? item.id ?? item.roomId ?? Math.random());
          const title =
            typeof item.title === "string"
              ? item.title
              : Array.isArray(item.topic)
              ? String(item.topic[0] ?? "Sala")
              : String(item.topic ?? "Sala");
          const startAt = item.startAt ?? item.startedAt ?? null;
          const endAt = item.actualEndAt ?? item.endAt ?? item.endTime ?? null;
          const tutorName =
            item.tutor && typeof item.tutor === "object" ? item.tutor.name ?? "" : "";

          return (
            <EndedRoomCard
              key={historyId}
              id={historyId}
              startAt={startAt}
              endAt={endAt}
              topic={title}
              host={tutorName}
              liveUsers={[]}
              onView={(rid) => window.location.assign(`/rooms/history/${rid}`)}
            />
          );
        })
      ) : liveHistory.length === 0 ? (
        <div className="col-span-full rounded-2xl border border-dashed border-[#D0D9F1] p-10 text-center text-[#5A6480]">
          Nenhuma atividade registrada para este usuário.
        </div>
      ) : (
        liveHistory.map((session) => {
          const when = formatDateTime(session.startTime);
          const duration = formatDuration(session.durationMinutes);
          const participants =
            typeof session.participantsCount === "number"
              ? `${session.participantsCount} participante${
                  session.participantsCount === 1 ? "" : "s"
                }`
              : "Participantes não informados";

          return (
            <article
              key={session.id}
              className="flex h-full flex-col rounded-2xl border border-[#E2E8F8] bg-[#F9F5FF] p-5"
            >
              <div className="flex items-center justify-between text-xs text-[#8A94AB]">
                <span>{when ?? "Data não informada"}</span>
                {duration && <span>{duration}</span>}
              </div>
              <h3 className="mt-3 text-base font-semibold text-[#2B1F58]">{session.title}</h3>
              <p className="mt-1 text-sm text-[#5A6480]">
                Instrutor: {session.instructorName ?? "Não informado"}
              </p>
              <p className="mt-2 text-xs font-medium text-[#586189]">{participants}</p>
              <div className="mt-auto pt-4">
                <Button
                  variant="ghost"
                  className="h-10 w-full rounded-xl border border-[#D5DDF5] text-sm font-semibold text-[#6350C9] hover:bg-[#F3F0FF]"
                >
                  Ver sala
                </Button>
              </div>
            </article>
          );
        })
      )}
    </div>
  </section>
);
