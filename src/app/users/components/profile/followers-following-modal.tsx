import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import type { UserCardUser } from "@/types/users";

type TabKey = "followers" | "following";

type LoaderResultObject = {
  items?: UserCardUser[];
  total?: number;
  pageSize?: number;
  hasMore?: boolean;
};

type LoaderResult = UserCardUser[] | LoaderResultObject;

type LoaderFn = (userId: string, page?: number) => Promise<LoaderResult>;

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  fetchFollowers?: LoaderFn;
  fetchFollowing?: LoaderFn;
  initialTab?: TabKey;
};

type TabState = {
  items: UserCardUser[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  total: number | null;
};

const ITEM_PAGE_SIZE = 5;

const TABS: Array<{
  key: TabKey;
  label: string;
  subtitle: string;
  emptyMessage: string;
}> = [
  {
    key: "followers",
    label: "Seguidores",
    subtitle: "Quem segue este usuário",
    emptyMessage: "Nenhum seguidor encontrado.",
  },
  {
    key: "following",
    label: "Seguindo",
    subtitle: "Quem este usuário segue",
    emptyMessage: "Não segue ninguém no momento.",
  },
];

const makeInitialState = (): TabState => ({
  items: [],
  page: 0,
  hasMore: true,
  loading: false,
  error: null,
  total: null,
});

function asLoaderObject(result: LoaderResult): LoaderResultObject {
  if (Array.isArray(result)) return { items: result };
  if (result && typeof result === "object") return result;
  return {};
}

export function FollowersFollowingModal({
  open,
  onClose,
  userId,
  fetchFollowers,
  fetchFollowing,
  initialTab = "followers",
}: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [dataByTab, setDataByTab] = useState<Record<TabKey, TabState>>({
    followers: makeInitialState(),
    following: makeInitialState(),
  });
  const buttonRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    followers: null,
    following: null,
  });
  const indicatorRef = useRef<HTMLSpanElement | null>(null);

  const activeState = dataByTab[tab];
  const activeTabConfig = useMemo(
    () => TABS.find((option) => option.key === tab) ?? TABS[0],
    [tab],
  );


  const loadTabData = useCallback(
    async (targetTab: TabKey, pageToLoad: number, reset: boolean) => {
      const loader = targetTab === "followers" ? fetchFollowers : fetchFollowing;

      if (typeof loader !== "function") {
        setDataByTab((prev) => {
          const current = prev[targetTab];
          return {
            ...prev,
            [targetTab]: {
              ...current,
              items: reset ? [] : current.items,
              page: reset ? 0 : current.page,
              hasMore: false,
              loading: false,
              error: null,
              total: reset ? 0 : current.total,
            },
          };
        });
        return;
      }

      setDataByTab((prev) => ({
        ...prev,
        [targetTab]: {
          ...prev[targetTab],
          items: reset ? [] : prev[targetTab].items,
          page: reset ? 0 : prev[targetTab].page,
          hasMore: reset ? true : prev[targetTab].hasMore,
          loading: true,
          error: null,
        },
      }));

      try {
        const result = await loader(userId, pageToLoad);
        const normalized = asLoaderObject(result);
        const received = Array.isArray(normalized.items) ? normalized.items : [];
        const pageSize =
          typeof normalized.pageSize === "number" && normalized.pageSize > 0
            ? normalized.pageSize
            : ITEM_PAGE_SIZE;
        const hasMoreFlag =
          typeof normalized.hasMore === "boolean" ? normalized.hasMore : undefined;
        const incomingTotal = typeof normalized.total === "number" ? normalized.total : null;

        setDataByTab((prev) => {
          const current = prev[targetTab];
          const mergedItems = received;
          const effectiveTotal = incomingTotal !== null ? incomingTotal : current.total;
          const derivedHasMore =
            hasMoreFlag !== undefined
              ? hasMoreFlag
              : effectiveTotal != null
              ? pageToLoad * pageSize < effectiveTotal
              : received.length >= pageSize;

          return {
            ...prev,
            [targetTab]: {
              ...current,
              items: mergedItems,
              page: pageToLoad,
              hasMore: derivedHasMore,
              loading: false,
              error: null,
              total: effectiveTotal,
            },
          };
        });
      } catch (err) {
        console.error("FollowersFollowingModal load error", err);
        setDataByTab((prev) => ({
          ...prev,
          [targetTab]: {
            ...prev[targetTab],
            loading: false,
            error: "Não foi possível carregar a lista.",
          },
        }));
      }
    },
    [fetchFollowers, fetchFollowing, userId],
  );

  useEffect(() => {
    if (!open) return;

    setTab(initialTab);
    setDataByTab({
      followers: makeInitialState(),
      following: makeInitialState(),
    });

    loadTabData(initialTab, 1, true);
  }, [open, initialTab, loadTabData]);

  useEffect(() => {
    if (!open) return;
    const state = dataByTab[tab];
    if (state.page === 0 && !state.loading && !state.error) {
      loadTabData(tab, 1, true);
    }
  }, [open, tab, dataByTab, loadTabData]);

  useEffect(() => {
    const indicator = indicatorRef.current;
    const button = buttonRefs.current[tab];
    if (!indicator || !button) return;

    const rect = button.getBoundingClientRect();
    const containerRect = button.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const width = rect.width;
    const offset = rect.left - containerRect.left;

    indicator.style.width = `${width}px`;
    indicator.style.transform = `translateX(${offset}px)`;
  }, [tab, activeState.items.length, activeState.loading]);

  const handleSwitchTab = (next: TabKey) => {
    if (next !== tab) setTab(next);
  };

  const handleRetry = () => {
    const isFirstPage = activeState.page === 0;
    const targetPage = isFirstPage ? 1 : activeState.page;
    loadTabData(tab, targetPage, isFirstPage);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={activeTabConfig.label}
      subtitle={activeTabConfig.subtitle}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="w-full">
          <div className="relative flex items-stretch rounded-full border border-[#D0D9F1] bg-white p-1">
            <span
              ref={indicatorRef}
              aria-hidden
              className="absolute top-1 bottom-1 left-1 rounded-full bg-[#ECF0FD] transition-transform duration-200 ease-out"
              style={{ width: "50%" }}
            />
            <div className="relative z-10 flex w-full text-sm font-medium text-[#5A6480] gap-1">
              {TABS.map((option) => (
                <button
                  key={option.key}
                  ref={(el) => {
                    buttonRefs.current[option.key] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={tab === option.key}
                  onClick={() => handleSwitchTab(option.key)}
                  className="flex-1 rounded-full px-5 py-2 transition-colors duration-150 focus-visible:outline-none md:py-3"
                  style={{
                    color: tab === option.key ? "#191F33" : "#5A6480",
                    borderRadius: 9999,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-auto">
          {activeState.items.length === 0 && activeState.loading && (
            <div className="space-y-2">
              <div className="h-12 w-full animate-pulse rounded-md bg-[#F4F6FF]" />
              <div className="h-12 w-full animate-pulse rounded-md bg-[#F4F6FF]" />
              <div className="h-12 w-full animate-pulse rounded-md bg-[#F4F6FF]" />
            </div>
          )}

          {activeState.items.length === 0 && !activeState.loading && activeState.error && (
            <div className="space-y-3 rounded-lg border border-[#FCE8E8] bg-[#FFF6F6] p-4">
              <p className="text-sm text-[#C53030]">{activeState.error}</p>
              <Button onClick={handleRetry} size="sm" variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}

          {activeState.items.length === 0 && !activeState.loading && !activeState.error && (
            <div className="text-sm text-center text-[#5A6480]">{activeTabConfig.emptyMessage}</div>
          )}

          {activeState.items.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F8] bg-white px-3 py-2 cursor-pointer hover:bg-[#F7F9FF]"
              onClick={() => {
                if (user.role === "tutor") navigate(`/instructors/${user.id}`);
                else navigate(`/users/${user.id}`);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-[#F4F6FF]">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center text-[#9BA3BC]">
                      <User className="h-5 w-5" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#2B1F58]">
                    <span>{user.name}</span>
                    {user.role === "tutor" && (
                      <span className="rounded-full bg-[#F4F1FF] px-2 py-0.5 text-[11px] font-medium text-[#6A4BC5]">
                        Tutor
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#5A6480]">
                    {user.codename
                      ? `@${user.codename.replace(/^@/, "")}`
                      : user.email ??
                        user.phone ??
                        `@${String(user.name || "usuario")
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, ".")}`}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {activeState.items.length > 0 && activeState.error && (
            <div className="space-y-3 rounded-lg border border-[#FCE8E8] bg-[#FFF6F6] p-4">
              <p className="text-sm text-[#C53030]">{activeState.error}</p>
              <Button onClick={handleRetry} size="sm" variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}

          {activeState.loading && activeState.items.length > 0 && (
            <div className="h-12 w-full animate-pulse rounded-md bg-[#F4F6FF]" />
          )}
        </div>

        <div className="flex items-center justify-center">
          {activeState.items.length >= ITEM_PAGE_SIZE && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => loadTabData(tab, Math.max(1, activeState.page - 1), false)}
                size="sm"
                variant="outline"
                disabled={activeState.loading || activeState.page <= 1}
              >
                Anterior
              </Button>
              <Button
                onClick={() => loadTabData(tab, activeState.page + 1, false)}
                size="sm"
                disabled={activeState.loading || !activeState.hasMore}
              >
                {activeState.loading ? "Carregando..." : "Próxima página"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
