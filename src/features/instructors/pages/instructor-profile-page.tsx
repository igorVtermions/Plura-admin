// src/features/instructors/pages/instructor-profile-page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import InstructorHero from "../components/profile/InstructorHero";
import InstructorStats from "../components/profile/InstructorStats";
import InstructorActivitySection from "../components/profile/InstructorActivitySection";
import InstructorFollowersModal from "../components/profile/InstructorFollowersModal";
import InstructorReportsModal from "../components/profile/InstructorReportsModal";
import EditInstructorModal from "@/components/instructor/EditInstructorModal";
import {
  deleteInstructor,
  fetchInstructorFollowers,
  fetchInstructorProfile,
} from "../api";
import api from "@/services/api";
import { INSTRUCTOR_STATUS_META } from "../visuals";
import type { InstructorCardData, InstructorProfile } from "../types";

const FOLLOWERS_PAGE_SIZE = 20;

export default function InstructorProfilePage() {
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
        // also try to fetch live-chat-rooms for this tutor and attach to profile
        try {
          let roomsRes;
          try {
            roomsRes = await api.get(`/admin/live-chat-rooms`, { params: { tutorId: id } });
          } catch (e) {
            roomsRes = await api.get(`/users/live-chat-rooms`, { params: { tutorId: id } });
          }
          const roomsPayload = roomsRes?.data ?? roomsRes;
          let roomsArray: unknown[] = [];
          if (Array.isArray(roomsPayload)) roomsArray = roomsPayload as unknown[];
          else if (roomsPayload && typeof roomsPayload === "object") {
            // try common places
            const r = roomsPayload as Record<string, unknown>;
            if (Array.isArray(r.items)) roomsArray = r.items as unknown[];
            else if (Array.isArray(r.data)) roomsArray = r.data as unknown[];
            else if (Array.isArray(r.liveRooms)) roomsArray = r.liveRooms as unknown[];
            else if (Array.isArray(r.rooms)) roomsArray = r.rooms as unknown[];
          }

          if (Array.isArray(roomsArray) && roomsArray.length > 0) {
            const adaptedSessions = roomsArray
              .map((raw) => {
                const rec = raw as Record<string, unknown>;
                const rid = (rec.id ?? rec.roomId ?? rec._id ?? rec.roomCode ?? rec.code) as any;
                const title = (rec.title ?? rec.name ?? rec.topic ?? rec.roomTitle) as any;
                const start = (rec.startAt ?? rec.startTime ?? rec.beginAt ?? rec.date) as any;
                const end = (rec.endAt ?? rec.endTime ?? rec.finishAt ?? rec.dateEnd) as any;
                const participants = Array.isArray(rec["liveUsers"]) ? (rec["liveUsers"] as unknown[]).length : (typeof rec["participantsCount"] === "number" ? (rec["participantsCount"] as number) : null);
                const isLive = (() => {
                  try {
                    const s = start ? new Date(start) : null;
                    const e = end ? new Date(end) : null;
                    const now = new Date();
                    if (s && e && !isNaN(s.getTime()) && !isNaN(e.getTime())) return now >= s && now <= e;
                    return !!rec["isLive"] || !!rec["live"];
                  } catch { return false; }
                })();

                // determine owner/tutor id on the room payload
                const ownerCandidate = rec.tutorId ?? (rec.tutor && (rec.tutor as any).id) ?? rec.hostId ?? rec.ownerId ?? rec.tutor_id ?? rec.instructorId;

                return {
                  id: rid ? String(rid) : undefined,
                  title: typeof title === "string" ? title : String(title ?? "Sessão"),
                  startTime: start ? String(start) : null,
                  endTime: end ? String(end) : null,
                  durationMinutes: null,
                  participantsCount: typeof participants === "number" ? participants : null,
                  isLive: Boolean(isLive),
                  status: isLive ? "live" : null,
                  roomId: rid ? String(rid) : null,
                  __ownerId: ownerCandidate != null ? String(ownerCandidate) : null,
                } as unknown as import("../types").InstructorProfileActivity & { __ownerId?: string | null };
              })
              .filter((s) => s && typeof (s as any).id === "string")
              // only keep rooms that belong to the current instructor id
              .filter((s) => {
                const owner = (s as any).__ownerId ?? null;
                if (!owner) return false;
                return String(owner) === String(id);
              })
              .map((s) => {
                // remove helper prop before attaching
                const copy = { ...(s as any) };
                delete copy.__ownerId;
                return copy as import("../types").InstructorProfileActivity;
              });

            if (adaptedSessions.length > 0) {
              // merge into result profile
              result.liveSessions = adaptedSessions;
              result.liveSessionsTotal = adaptedSessions.length;
            }
          }
        } catch (err) {
          // ignore if rooms fetch fails
          // console.error("fetch tutor rooms error", err);
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

        const total =
          typeof summary.total === "number" ? summary.total : summary.items.length;
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
            <details className="p-3 border rounded-md bg-[#FBFBFF]">
              <summary className="cursor-pointer text-sm text-[#5A6480]">Nenhuma sala registrada</summary>
              <div className="text-xs mt-2 text-[#5A6480]">Não foram encontradas salas para este instrutor.</div>
            </details>
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