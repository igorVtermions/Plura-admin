// src/features/instructors/components/profile/InstructorActivitySection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import type { InstructorProfileActivity } from "@/types/tutor";
import { LiveRoomCard } from "@/app/home/components/live-room-card";
import { SoonRoomCard } from "@/app/home/components/soon-room-card";
import { EndedRoomCard } from "@/app/home/components/ended-room-card";

type Props = {
  sessions: InstructorProfileActivity[];
  total: number;
  hostName?: string;
};

export function InstructorActivitySection({ sessions, total, hostName }: Props) {
  const navigate = useNavigate();
  // debug: log sessions to help diagnose classification (live/ended/soon)
  // eslint-disable-next-line no-console
  console.debug("InstructorActivitySection sessions:", sessions);
  // also log counts
  try {
    const now = new Date();
    const counts = { live: 0, ended: 0, soon: 0 };
    for (const s of sessions) {
      const live =
        Boolean(s.isLive) ||
        (s.status
          ? ["live", "ao vivo", "in progress"].includes((s.status ?? "").toLowerCase())
          : false);
      const endDate = s.endTime ? new Date(s.endTime) : null;
      const ended =
        endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < now.getTime();
      if (live) counts.live += 1;
      else if (ended) counts.ended += 1;
      else counts.soon += 1;
    }
    // eslint-disable-next-line no-console
    console.debug("InstructorActivitySection counts:", counts);
  } catch (e) {
    // ignore
  }
  return (
    <section className="mt-10 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#191F33]">Atividade recente</h2>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.isArray(sessions) && sessions.length > 0
          ? sessions.map((session) => {
              const startAt = session.startTime ?? undefined;
              const endAt = session.endTime ?? undefined;
              const host = hostName ?? "";

              const startDate = session.startTime ? new Date(session.startTime) : null;
              const endDate = session.endTime ? new Date(session.endTime) : null;
              const now = new Date();

              let live = false;
              if (
                startDate &&
                endDate &&
                !Number.isNaN(startDate.getTime()) &&
                !Number.isNaN(endDate.getTime())
              ) {
                live = now.getTime() >= startDate.getTime() && now.getTime() <= endDate.getTime();
              } else {
                live =
                  Boolean(session.isLive) ||
                  (session.status
                    ? ["live", "ao vivo", "in progress"].includes(
                        (session.status ?? "").toLowerCase(),
                      )
                    : false);
              }

              if (live) {
                return (
                  <LiveRoomCard
                    key={String(session.id)}
                    id={String(session.id)}
                    startAt={startAt}
                    endAt={endAt}
                    topic={session.title}
                    host={host}
                    liveUsers={[]}
                    onJoin={(id) => navigate(`/rooms/${id}`)}
                  />
                );
              }

              const ended =
                !live &&
                endDate &&
                !Number.isNaN(endDate.getTime()) &&
                endDate.getTime() < now.getTime();

              if (ended) {
                return (
                  <EndedRoomCard
                    key={String(session.id)}
                    id={String(session.id)}
                    startAt={startAt}
                    endAt={endAt}
                    topic={session.title}
                    host={host}
                    liveUsers={[]}
                    onView={(id) => navigate(`/rooms/history/${id}`)}
                  />
                );
              }

              return (
                <SoonRoomCard
                  key={String(session.id)}
                  dateLabel={undefined}
                  startAt={startAt}
                  endAt={endAt}
                  topic={session.title}
                  host={host}
                  showSlash={false}
                  onToggleReminder={() => {}}
                />
              );
            })
          : null}
      </div>
    </section>
  );
}
