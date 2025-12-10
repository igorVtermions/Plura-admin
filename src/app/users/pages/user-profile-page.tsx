"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BanUserModal } from "../components/ban-user-modal";
import { UnbanUserModal } from "../components/unban-user-modal";
import { UserHero } from "../components/profile/user-hero";
import { UserStats } from "../components/profile/user-stats";
import { UserActivitySection } from "../components/profile/user-activity-section";
import { UserDetailsModal } from "../components/profile/user-details-modal";
import { FollowersFollowingModal } from "../components/profile/followers-following-modal";
import { UserReportsModal } from "../components/profile/user-reports-modal";
import { STATUS_META } from "../utils/visuals";
import type { BanReasonKey, UserProfile } from "@/types/users";
import {
  banUser,
  fetchFollowers as apiFetchFollowers,
  fetchFollowing as apiFetchFollowing,
  fetchUserProfile,
  unbanUser,
} from "@/services/users";
import { fetchUserSessionsAdmin } from "@/services/users";

function extractErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const response = (err as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (typeof record.message === "string") return record.message;
      if (typeof record.error === "string") return record.error;
    }
  }
  return fallback;
}

type ConfirmAction = "ban" | "unban" | null;
const FOLLOW_PAGE_SIZE = 20;

function normalizeProfile(payload: unknown): UserProfile | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const user = (data.user ?? data.data) as Record<string, unknown> | undefined;
  if (!user || typeof user !== "object") return null;

  const idValue = user.id ?? user.userId ?? user["_id"];
  const id = typeof idValue === "string" || typeof idValue === "number" ? String(idValue) : null;
  if (!id) return null;

  const nameValue = user.name ?? user.fullName ?? user.displayName;
  const name =
    typeof nameValue === "string" && nameValue.trim().length > 0 ? nameValue : "Usuário sem nome";

  const statusRaw = typeof user.status === "string" ? user.status.toLowerCase() : "";
  const status = statusRaw === "active" ? "active" : statusRaw === "banned" ? "banned" : "pending";

  const bio =
    typeof user.bio === "string"
      ? user.bio
      : typeof user.description === "string"
      ? user.description
      : typeof user.about === "string"
      ? user.about
      : null;

  const avatar =
    typeof user.avatarUrl === "string"
      ? user.avatarUrl
      : typeof user.photoUrl === "string"
      ? user.photoUrl
      : typeof user.picture === "string"
      ? user.picture
      : null;

  const topicsRaw = user.topics;
  const topics = Array.isArray(topicsRaw)
    ? topicsRaw.map((topic) => (typeof topic === "string" ? topic.trim() : "")).filter(Boolean)
    : [];

  const reportsBlock = (data.reports ?? user.reports) as Record<string, unknown> | undefined;
  const reportsListRaw = reportsBlock?.list ?? reportsBlock?.items ?? reportsBlock;
  const reportsArray = Array.isArray(reportsListRaw) ? reportsListRaw : [];
  const reports = reportsArray
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const cast = item as Record<string, unknown>;
      const reportId = cast.id ?? cast.reportId ?? cast["_id"];
      const resolvedId =
        typeof reportId === "string" || typeof reportId === "number" ? String(reportId) : null;
      if (!resolvedId) return null;
      return {
        id: resolvedId,
        authorName:
          typeof cast.authorName === "string"
            ? cast.authorName
            : typeof cast.author === "string"
            ? cast.author
            : null,
        reason:
          typeof cast.reason === "string"
            ? cast.reason
            : typeof cast.type === "string"
            ? cast.type
            : null,
        description:
          typeof cast.description === "string"
            ? cast.description
            : typeof cast.details === "string"
            ? cast.details
            : null,
        createdAt:
          typeof cast.createdAt === "string"
            ? cast.createdAt
            : typeof cast.created_at === "string"
            ? cast.created_at
            : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const liveBlock = (data.liveChatHistory ?? user.liveChatHistory ?? user.liveHistory) as
    | Record<string, unknown>
    | undefined;
  const liveListRaw = liveBlock?.list ?? liveBlock?.items ?? liveBlock;
  const liveArray = Array.isArray(liveListRaw) ? liveListRaw : [];
  const liveHistory = liveArray
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const cast = item as Record<string, unknown>;
      const sessionId = cast.id ?? cast.sessionId ?? cast.roomId ?? cast["_id"];
      const resolvedId =
        typeof sessionId === "string" || typeof sessionId === "number" ? String(sessionId) : null;
      if (!resolvedId) return null;

      const startedAt =
        typeof cast.startTime === "string"
          ? cast.startTime
          : typeof cast.startedAt === "string"
          ? cast.startedAt
          : null;
      const endedAt =
        typeof cast.endTime === "string"
          ? cast.endTime
          : typeof cast.finishedAt === "string"
          ? cast.finishedAt
          : null;

      const instructor =
        typeof cast.instructorName === "string"
          ? cast.instructorName
          : typeof cast.tutorName === "string"
          ? cast.tutorName
          : null;

      return {
        id: resolvedId,
        title:
          typeof cast.title === "string"
            ? cast.title
            : typeof cast.roomTitle === "string"
            ? cast.roomTitle
            : "Sala sem título",
        instructorName: instructor,
        startTime: startedAt,
        endTime: endedAt,
        durationMinutes:
          typeof cast.durationMinutes === "number"
            ? cast.durationMinutes
            : typeof cast.duration === "number"
            ? cast.duration
            : null,
        participantsCount:
          typeof cast.participantsCount === "number"
            ? cast.participantsCount
            : typeof cast.totalParticipants === "number"
            ? cast.totalParticipants
            : null,
        roomId:
          typeof cast.roomId === "string"
            ? cast.roomId
            : typeof cast.roomCode === "string"
            ? cast.roomCode
            : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const followersCount =
    typeof user.followersCount === "number"
      ? user.followersCount
      : typeof user.followers === "number"
      ? user.followers
      : 0;

  const followingCount =
    typeof user.followingCount === "number"
      ? user.followingCount
      : typeof user.following === "number"
      ? user.following
      : 0;

  const reportsTotal =
    typeof reportsBlock?.total === "number"
      ? reportsBlock.total
      : typeof user.reportsCount === "number"
      ? user.reportsCount
      : reports.length;

  const liveTotal =
    typeof liveBlock?.total === "number"
      ? liveBlock.total
      : typeof user.liveHistoryCount === "number"
      ? user.liveHistoryCount
      : liveHistory.length;

  return {
    id,
    name,
    status,
    plan:
      typeof user.plan === "string"
        ? user.plan
        : typeof user.subscription === "string"
        ? user.subscription
        : null,
    codename:
      typeof user.codinome === "string"
        ? user.codinome
        : typeof user.codename === "string"
        ? user.codename
        : null,
    email: typeof user.email === "string" ? user.email : null,
    phone: typeof user.phone === "string" ? user.phone : null,
    bio,
    avatarUrl: avatar,
    isVerified: typeof user.isVerified === "boolean" ? user.isVerified : false,
    topics,
    followersCount,
    followingCount,
    reportsTotal,
    liveHistoryTotal: liveTotal,
    reports,
    liveHistory,
  };
}

export function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [pendingAction, setPendingAction] = useState(false);
  const [viewDataOpen, setViewDataOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [finishedSessions, setFinishedSessions] = useState<Array<Record<string, unknown>> | null>(
    null,
  );

  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<"followers" | "following">("followers");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchUserProfile(userId ?? "");
        const normalized = normalizeProfile(payload);
        if (cancelled) return;
        if (!normalized) {
          setError("Não foi possível carregar o perfil do usuário.");
          setProfile(null);
          return;
        }
        setProfile(normalized);
        // try to fetch finished sessions (admin endpoint)
        try {
          const sessionsResp = await fetchUserSessionsAdmin(userId ?? "");
          if (!cancelled && sessionsResp && typeof sessionsResp === "object") {
            // expect { items: [...] }
            const items =
              sessionsResp.items && Array.isArray(sessionsResp.items) ? sessionsResp.items : [];
            setFinishedSessions(items as Array<Record<string, unknown>>);
          }
        } catch (err) {
          // ignore fetch errors for sessions
          console.debug("fetchUserSessionsAdmin error", err);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("fetchUserProfile error", err);
        setError("Não foi possível carregar o perfil do usuário.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    setViewDataOpen(false);
    setFollowModalOpen(false);
    setReportsModalOpen(false);
  }, [userId]);

  const meta = useMemo(() => {
    if (!profile) return null;
    return STATUS_META[profile.status] ?? STATUS_META.pending;
  }, [profile]);

  const handleBanConfirm = async (payload: { reason: BanReasonKey; description: string }) => {
    if (!profile || pendingAction) return;
    setPendingAction(true);
    try {
      await banUser(profile.id, payload);
      toast.success("Usuário banido com sucesso.");
      setProfile((prev) => (prev ? { ...prev, status: "banned" } : prev));
      setConfirmAction(null);
    } catch (err) {
      console.error("banUser error", err);
      const defaultError = "Não foi possível banir o usuário.";
      toast.error(extractErrorMessage(err, defaultError));
    } finally {
      setPendingAction(false);
    }
  };

  const handleUnbanConfirm = async (payload: { description: string }) => {
    if (!profile || pendingAction) return;
    setPendingAction(true);
    try {
      await unbanUser(profile.id, payload);
      toast.success("Usuário reativado com sucesso.");
      setProfile((prev) => (prev ? { ...prev, status: "active" } : prev));
      setConfirmAction(null);
    } catch (err) {
      console.error("unbanUser error", err);
      const defaultError = "Não foi possível desbanir o usuário.";
      toast.error(extractErrorMessage(err, defaultError));
    } finally {
      setPendingAction(false);
    }
  };

  const handleCloseModal = () => {
    if (pendingAction) return;
    setConfirmAction(null);
  };

  const openFollowers = () => {
    setFollowModalTab("followers");
    setFollowModalOpen(true);
  };
  const openFollowing = () => {
    setFollowModalTab("following");
    setFollowModalOpen(true);
  };
  const openReports = () => {
    setReportsModalOpen(true);
  };

  const fetchFollowers = async (uid: string, page = 1) => {
    const result = await apiFetchFollowers(uid, { page, perPage: FOLLOW_PAGE_SIZE });
    return { ...result, total: result.total ?? undefined };
  };

  const fetchFollowing = async (uid: string, page = 1) => {
    const result = await apiFetchFollowing(uid, { page, perPage: FOLLOW_PAGE_SIZE });
    return { ...result, total: result.total ?? undefined };
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#6350C9]" />
      </main>
    );
  }

  if (error || !profile || !meta) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <p className="text-lg text-[#5A6480]">{error ?? "Perfil não encontrado."}</p>
          <Button className="mt-6" onClick={() => navigate("/users")}>
            Voltar para usuários
          </Button>
        </div>
      </main>
    );
  }

  const isBanned = profile.status === "banned";
  const primaryActionLabel = isBanned ? "Desbanir usuário" : "Banir usuário";

  return (
    <main className="min-h-screen bg-white">
      <div className="relative w-full bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6350C9] hover:text-[#4F3AAF]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para usuários
          </button>

          <article className="rounded-3xl border border-[#E2E8F8] bg-white">
            <div
              className="h-36 w-full rounded-t-3xl"
              style={{ backgroundColor: meta.headerColor }}
            />
            <div className="space-y-8 px-8 pb-10 pt-6">
              <UserHero
                profile={profile}
                statusMeta={meta}
                isBanned={isBanned}
                primaryActionLabel={primaryActionLabel}
                onPrimaryActionClick={() => setConfirmAction(isBanned ? "unban" : "ban")}
                onViewUserData={() => setViewDataOpen(true)}
                pendingAction={pendingAction}
              />

              <UserStats
                followingCount={profile.followingCount}
                followersCount={profile.followersCount}
                reportsTotal={profile.reportsTotal}
                onOpenFollowers={openFollowers}
                onOpenFollowing={openFollowing}
                onOpenReports={openReports}
              />
            </div>
          </article>

          <section className="mt-10">
            <UserActivitySection
              liveHistory={profile.liveHistory}
              liveHistoryTotal={profile.liveHistoryTotal}
              finishedSessions={finishedSessions ?? undefined}
              finishedTotal={finishedSessions ? finishedSessions.length : undefined}
            />
          </section>
        </div>
      </div>

      <UserDetailsModal
        open={viewDataOpen}
        onClose={() => setViewDataOpen(false)}
        profile={profile}
      />

      <BanUserModal
        open={confirmAction === "ban"}
        pending={pendingAction}
        onClose={handleCloseModal}
        onConfirm={handleBanConfirm}
      />
      <UnbanUserModal
        open={confirmAction === "unban"}
        pending={pendingAction}
        onClose={handleCloseModal}
        onConfirm={handleUnbanConfirm}
      />
      <FollowersFollowingModal
        open={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        userId={profile.id}
        initialTab={followModalTab}
        fetchFollowers={fetchFollowers}
        fetchFollowing={fetchFollowing}
      />
      <UserReportsModal
        open={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        reports={profile.reports}
        total={profile.reportsTotal}
      />
    </main>
  );
}
