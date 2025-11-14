// src/features/instructors/components/profile/InstructorFollowersModal.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { User as UserIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import type { InstructorFollower, InstructorFollowersResult } from "../../types";

type LoaderFn = (tutorId: string, page?: number) => Promise<InstructorFollowersResult>;

type Props = {
  open: boolean;
  onClose: () => void;
  tutorId: string;
  fetchFollowers: LoaderFn;
};

type State = {
  items: InstructorFollower[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  total: number | null;
};

const INITIAL_STATE: State = {
  items: [],
  page: 0,
  hasMore: true,
  loading: false,
  error: null,
  total: null,
};

const InstructorFollowersModal: React.FC<Props> = ({
  open,
  onClose,
  tutorId,
  fetchFollowers,
}) => {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const loadPage = useCallback(
    async (page: number, reset = false) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        ...(reset ? { items: [], page: 0, hasMore: true, total: null } : {}),
      }));

      try {
        const result = await fetchFollowers(tutorId, page);
        setState((prev) => ({
          items: reset ? result.items : [...prev.items, ...result.items],
          page,
          hasMore: result.hasMore,
          loading: false,
          error: null,
          total: result.total ?? (reset ? null : prev.total),
        }));
      } catch (err) {
        console.error("InstructorFollowersModal fetch error", err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Não foi possível carregar os seguidores.",
        }));
      }
    },
    [fetchFollowers, tutorId],
  );

  useEffect(() => {
    if (!open) return;
    void loadPage(1, true);
  }, [open, loadPage]);

  useEffect(() => {
    if (!open) setState(INITIAL_STATE);
  }, [open]);

  const handleLoadMore = () => {
    if (state.loading || !state.hasMore) return;
    void loadPage(state.page + 1, false);
  };

  const handleRetry = () => {
    if (state.loading) return;
    const targetPage = state.page === 0 ? 1 : state.page + 1;
    const reset = state.page === 0;
    void loadPage(targetPage, reset);
  };

  const countLabel = useMemo(() => {
    if (state.items.length === 0) return "";
    if (typeof state.total === "number" && state.total >= state.items.length) {
      const noun = state.total === 1 ? "seguidor" : "seguidores";
      return `${state.items.length} de ${state.total} ${noun}`;
    }
    const noun = state.items.length === 1 ? "seguidor" : "seguidores";
    return `${state.items.length} ${noun}`;
  }, [state.items.length, state.total]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Seguidores"
      subtitle="Quem segue este instrutor"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="max-h-[60vh] space-y-3 overflow-auto pr-1">
          {state.loading && state.items.length === 0 && (
            <div className="space-y-2">
              <div className="h-12 w-full animate-pulse rounded-md bg-[#F4F6FF]" />
              <div className="h-12 w-full animate-pulse rounded-md bg-[#F4F6FF]" />
              <div className="h-12 w-full animate-pulse rounded-md bg-[#F4F6FF]" />
            </div>
          )}

          {state.error && state.items.length === 0 && !state.loading && (
            <div className="space-y-3 rounded-lg border border-[#FCE8E8] bg-[#FFF6F6] p-4 text-center">
              <p className="text-sm text-[#C53030]">{state.error}</p>
              <Button onClick={handleRetry} size="sm" variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}

          {state.items.length === 0 && !state.loading && !state.error && (
            <div className="rounded-lg border border-dashed border-[#D0D9F1] p-6 text-center text-sm text-[#5A6480]">
              Este instrutor ainda não possui seguidores.
            </div>
          )}

          {state.items.map((follower) => {
            const joinedDate =
              follower.followedAt && !Number.isNaN(new Date(follower.followedAt).getTime())
                ? new Date(follower.followedAt).toLocaleDateString("pt-BR")
                : null;

            return (
              <div
                key={follower.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F8] bg-white px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#F4F6FF]">
                    {follower.avatarUrl ? (
                      <Image
                        src={follower.avatarUrl}
                        alt={follower.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-[#9BA3BC]" strokeWidth={1.4} />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-[#2B1F58]">
                      {follower.name}
                    </div>
                    <div className="text-xs text-[#5A6480]">
                      {follower.codename
                        ? `@${follower.codename.replace(/^@/, "")}`
                        : follower.email ?? follower.phone ?? "Sem identificador"}
                    </div>
                  </div>
                </div>
                {joinedDate && (
                  <span className="text-xs text-[#8A94AB]">Desde {joinedDate}</span>
                )}
              </div>
            );
          })}

          {state.error && state.items.length > 0 && (
            <div className="space-y-3 rounded-lg border border-[#FCE8E8] bg-[#FFF6F6] p-4 text-center">
              <p className="text-sm text-[#C53030]">{state.error}</p>
              <Button onClick={handleRetry} size="sm" variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}

          {state.loading && state.items.length > 0 && (
            <div className="h-12 w-full animate-pulse rounded-md bg-[#F4F6FF]" />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-[#8A94AB]">{countLabel}</div>
          {state.hasMore && state.items.length > 0 && (
            <Button onClick={handleLoadMore} size="sm" disabled={state.loading}>
              {state.loading ? "Carregando..." : "Carregar mais"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default InstructorFollowersModal;