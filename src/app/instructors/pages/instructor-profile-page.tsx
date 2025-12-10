"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import { InstructorHero } from "../components/profile/instructor-hero";
import { InstructorStats } from "../components/profile/instructor-stats";
import { InstructorActivitySection } from "../components/profile/instructor-activity-section";
import { InstructorFollowersModal } from "../components/profile/instructor-followers-modal";
import { InstructorReportsModal } from "../components/profile/instructor-reports-modal";
import { EditInstructorModal } from "@/app/instructors/components/edit-instructor-modal";
import {
  deleteInstructor,
  fetchInstructorFollowers,
  fetchInstructorProfile,
} from "@/services/tutor";
import { INSTRUCTOR_STATUS_META } from "../components/profile/visuals";
import type { InstructorCardData, InstructorProfile } from "@/types/tutor";

const FOLLOWERS_PAGE_SIZE = 20;

export function InstructorProfilePage() {
  const { instructorId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!instructorId) {
      setLoading(false);
      setError("Instrutor não encontrado.");
      return;
    }

    const id = instructorId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchInstructorProfile(id);
        if (cancelled) return;
        if (!result) {
          setError("Não foi possível carregar o perfil do instrutor.");
          setProfile(null);
          return;
        }
        // raw profile fetch removed (debug panel cleanup)
        // try the new admin endpoint that returns grouped sessions (live/upcoming/finished)
        try {
          const sessionsResp = await import("@/services/tutor").then((m) =>
            m.fetchTutorSessionsAdmin(id),
          );
          // eslint-disable-next-line no-console
          console.debug("instructor-profile: fetchTutorSessionsAdmin result:", sessionsResp);
          if (sessionsResp) {
            const mapped: import("@/types/tutor").InstructorProfileActivity[] = [];
            const mapRoom = (
              room: Record<string, unknown>,
              kind: "live" | "upcoming" | "finished",
            ) => {
              const rid = (room.id ?? room.roomId ?? room._id ?? room.code) as any;
              const title = (room.name ?? room.title ?? room.roomTitle ?? room.topic) as any;
              const start = (room.startAt ?? room.startTime ?? room.date ?? room.beginAt) as any;
              const end = (room.endAt ?? room.endTime ?? room.actualEndAt ?? room.finishAt) as any;
              const stats = (room.stats ?? room) as Record<string, unknown> | undefined;
              let participants: number | null = null;
              if (stats) {
                if (typeof stats.participantsCount === "number")
                  participants = stats.participantsCount as number;
                else if (typeof stats.totalParticipants === "number")
                  participants = stats.totalParticipants as number;
                else if (typeof stats.participants === "number")
                  participants = stats.participants as number;
                else if (typeof stats.viewers === "number") participants = stats.viewers as number;
              }
              return {
                id: rid ? String(rid) : String(Math.random()),
                title: typeof title === "string" ? title : String(title ?? "Sessão"),
                startTime: start ? String(start) : null,
                endTime: end ? String(end) : null,
                durationMinutes: null,
                participantsCount: typeof participants === "number" ? participants : null,
                isLive: kind === "live",
                status: kind === "live" ? "live" : kind === "upcoming" ? "upcoming" : "finished",
                roomId: rid ? String(rid) : null,
              } as import("@/types/tutor").InstructorProfileActivity;
            };

            const tutorSessions = sessionsResp.live.concat(
              sessionsResp.upcoming,
              sessionsResp.finished,
            );
            for (const r of sessionsResp.live) {
              if (r && typeof r === "object")
                mapped.push(mapRoom(r as Record<string, unknown>, "live"));
            }
            for (const r of sessionsResp.upcoming) {
              if (r && typeof r === "object")
                mapped.push(mapRoom(r as Record<string, unknown>, "upcoming"));
            }
            for (const r of sessionsResp.finished) {
              if (r && typeof r === "object")
                mapped.push(mapRoom(r as Record<string, unknown>, "finished"));
            }

            if (mapped.length > 0) {
              result.liveSessions = mapped;
              result.liveSessionsTotal = mapped.length;
            }
          }
        } catch (err) {
          // ignore
        }
        setProfile(result);
      } catch (err) {
        if (cancelled) return;
        console.error("fetchInstructorProfile error", err);
        setError("Não foi possível carregar o perfil do instrutor.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [instructorId, reloadToken]);

  useEffect(() => {
    setEditOpen(false);
    setConfirmDelete(false);
    setFollowersModalOpen(false);
    setReportsModalOpen(false);
  }, [instructorId]);

  const fetchTutorFollowers = useCallback(
    (tutorId: string, page = 1) =>
      fetchInstructorFollowers(tutorId, {
        page,
        perPage: FOLLOWERS_PAGE_SIZE,
      }),
    [],
  );

  const currentProfileId = profile?.id ?? null;

  useEffect(() => {
    if (!currentProfileId) return;

    const tutorId = currentProfileId;
    let cancelled = false;

    async function syncFollowersCount() {
      try {
        const summary = await fetchInstructorFollowers(tutorId, {
          page: 1,
          perPage: 1,
        });
        if (cancelled) return;

        const total = typeof summary.total === "number" ? summary.total : summary.items.length;
        if (!Number.isFinite(total)) return;

        setProfile((prev) => {
          if (!prev || prev.id !== tutorId || prev.followersCount === total) {
            return prev;
          }
          return { ...prev, followersCount: total };
        });
      } catch (err) {
        console.error("fetchInstructorFollowers summary error", err);
      }
    }

    void syncFollowersCount();
    return () => {
      cancelled = true;
    };
  }, [currentProfileId]);

  const handleRefresh = () => setReloadToken((value) => value + 1);

  const handleInstructorUpdated = (updated: InstructorCardData) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            ...updated,
            followersCount: prev.followersCount,
            reportsTotal: prev.reportsTotal,
            reports: prev.reports,
            liveSessions: prev.liveSessions,
            liveSessionsTotal: prev.liveSessionsTotal,
          }
        : prev,
    );
    handleRefresh();
  };

  const handleDeleteInstructor = async () => {
    if (!profile || pendingDelete) return;
    setPendingDelete(true);
    try {
      await deleteInstructor(profile.id);
      toast.success("Instrutor removido com sucesso.");
      navigate("/instructors");
    } catch (err) {
      console.error("deleteInstructor error", err);
      toast.error("Não foi possível remover o instrutor. Tente novamente.");
    } finally {
      setPendingDelete(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#6350C9]" />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <p className="text-lg text-[#5A6480]">{error ?? "Instrutor não encontrado."}</p>
          <Button className="mt-6" onClick={() => navigate("/instructors")}>
            Voltar para instrutores
          </Button>
        </div>
      </main>
    );
  }

  const statusMeta = INSTRUCTOR_STATUS_META[profile.status] ?? INSTRUCTOR_STATUS_META.active;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <button
          type="button"
          onClick={() => navigate("/instructors")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6350C9] hover:text-[#4F3AAF]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <article className="rounded-3xl border border-[#E2E8F8] bg-white">
          <div
            className="h-36 w-full rounded-t-3xl"
            style={{ backgroundColor: statusMeta.headerColor }}
          />
          <div className="space-y-8 px-8 pb-10 pt-6">
            <InstructorHero
              profile={profile}
              statusMeta={statusMeta}
              onEdit={() => setEditOpen(true)}
              onDelete={() => setConfirmDelete(true)}
              deleting={pendingDelete}
            />
            <InstructorStats
              followers={profile.followersCount}
              reports={profile.reportsTotal}
              onFollowersClick={() => setFollowersModalOpen(true)}
              onReportsClick={() => setReportsModalOpen(true)}
            />
          </div>
        </article>

        <section className="mt-10">
          <InstructorActivitySection
            sessions={profile.liveSessions}
            total={profile.liveSessionsTotal}
            hostName={profile.name}
          />
        </section>
        {profile.liveSessions && profile.liveSessions.length === 0 && (
          <div className="mt-6">
            <div className="col-span-full rounded-2xl border border-dashed border-[#D0D9F1] p-10 text-center text-[#5A6480]">
              Nenhuma atividade registrada para este tutor.
            </div>
          </div>
        )}
      </div>

      <InstructorFollowersModal
        open={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        tutorId={profile.id}
        fetchFollowers={fetchTutorFollowers}
      />

      <InstructorReportsModal
        open={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        reports={profile.reports}
        total={profile.reportsTotal}
      />

      <EditInstructorModal
        open={editOpen}
        tutorId={profile.id}
        fallbackData={profile}
        onUpdated={handleInstructorUpdated}
        onClose={() => setEditOpen(false)}
      />

      <Modal
        open={confirmDelete}
        onClose={() => {
          if (pendingDelete) return;
          setConfirmDelete(false);
        }}
        title="Deletar instrutor"
        subtitle={`Tem certeza que deseja remover ${profile.name}?`}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              className="border-[#D0D9F1] text-[#1F2A44] hover:bg-[#F4F6FF]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteInstructor}
              disabled={pendingDelete}
              className="bg-[#C53030] text-white hover:bg-[#A22727] disabled:opacity-60"
            >
              {pendingDelete ? "Removendo..." : "Deletar instrutor"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[#5A6480]">
          Essa ação removerá o acesso do instrutor e não poderá ser desfeita.
        </p>
      </Modal>
    </main>
  );
}
