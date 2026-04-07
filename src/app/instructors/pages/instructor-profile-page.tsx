"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
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
  fetchTutorRoomHistory,
  fetchTutorFollowStats,
} from "@/services/tutor";
import { INSTRUCTOR_STATUS_META } from "../components/profile/visuals";
import type { InstructorCardData, InstructorProfile } from "@/types/tutor";

const FOLLOWERS_PAGE_SIZE = 5;

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
        // Load only finished rooms for this tutor profile.
        try {
          const rooms = await fetchTutorRoomHistory({
            tutorId: result.id,
            page: 1,
            limit: 12,
          });
          const mapped: import("@/types/tutor").InstructorProfileActivity[] = rooms
            .filter((room) => room && typeof room === "object")
            .map((room) => {
              const r = room as Record<string, unknown>;
              const rid = r.id ?? r.roomId ?? r.originalRoomId ?? r._id ?? r.code;
              const title = r.title ?? r.name ?? r.roomTitle ?? r.topic;
              const start = r.startAt ?? r.startTime ?? r.beginAt;
              const end = r.actualEndAt ?? r.endAt ?? r.endTime ?? r.finishAt;
              const participants =
                typeof r.participantsCount === "number"
                  ? r.participantsCount
                  : typeof r.totalParticipants === "number"
                  ? r.totalParticipants
                  : null;

              return {
                id: rid ? String(rid) : String(Math.random()),
                title: typeof title === "string" ? title : String(title ?? "Sala"),
                startTime: start ? String(start) : null,
                endTime: end ? String(end) : null,
                durationMinutes: null,
                participantsCount: participants,
                isLive: false,
                status: "finished",
                roomId: rid ? String(rid) : null,
              } as import("@/types/tutor").InstructorProfileActivity;
            });

          result.liveSessions = mapped;
          result.liveSessionsTotal = mapped.length;
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
        const statsTotal = await fetchTutorFollowStats(tutorId);
        if (cancelled) return;

        let total = statsTotal;
        if (!Number.isFinite(total ?? NaN)) {
          const summary = await fetchInstructorFollowers(tutorId, {
            page: 1,
            perPage: 1,
          });
          if (cancelled) return;
          total = typeof summary.total === "number" ? summary.total : summary.items.length;
        }
        if (!Number.isFinite(total ?? NaN)) return;

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
        <div className="mt-4 rounded-xl border border-[#F6B5B5] bg-[#FFF4F4] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[#C53030]" />
            <div>
              <p className="text-sm font-semibold text-[#9B1C1C]">Atenção ao impacto nas salas</p>
              <p className="mt-1 text-sm leading-relaxed text-[#7A2330]">
                Se houver salas de live chat ao vivo ou em espera vinculadas a este instrutor,
                elas poderão ser encerradas durante a exclusão.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
