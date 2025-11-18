// src/features/instructors/components/profile/InstructorActivitySection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import type { InstructorProfileActivity } from "../../types";
import { LiveRoomCard } from "@/features/home/components/live-room-card";
import { SoonRoomCard } from "@/features/home/components/soon-room-card";

type Props = {
  sessions: InstructorProfileActivity[];
  total: number;
  hostName?: string;
};



export default function InstructorActivitySection({ sessions, total, hostName }: Props) {
  const navigate = useNavigate();
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
            const startAt = session.startTime ?? undefined;
            const endAt = session.endTime ?? undefined;
            const host = hostName ?? "";
            const live = Boolean(session.isLive) || (session.status ? ["live", "ao vivo", "in progress"].includes(session.status.toLowerCase()) : false);
            if (live) {
              return (
                <LiveRoomCard
                  key={session.id}
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

            // soon / upcoming
            return (
              <SoonRoomCard
                key={session.id}
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
        )}
      </div>
    </section>
  );
}