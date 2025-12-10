"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UserCard } from "../components/user-card";
import type { UserCardUser, UserStatus } from "@/types/users";
import { banUser, fetchUsers, unbanUser } from "@/services/users";
import { useNavigate } from "react-router-dom";

type FilterKey = UserStatus | "all";
const perPage = 9;

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "pending", label: "Pendentes" },
  { key: "banned", label: "Banidos" },
];

type MetaState = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export function UsersPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserCardUser[]>([]);
  const [meta, setMeta] = useState<MetaState>({ total: 0, page: 1, perPage, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banningIds, setBanningIds] = useState<Record<string, boolean>>({});
  const [unbanningIds, setUnbanningIds] = useState<Record<string, boolean>>({});
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          search: debouncedSearch || undefined,
          status: filter === "all" ? undefined : filter,
          page,
          perPage,
        };
        const response = await fetchUsers(params);
        const rawUsers = ensureUsersArray(response.data);
        const adapted = rawUsers
          .map(adaptUser)
          .filter((user): user is UserCardUser => user !== null);
        if (cancelled) return;

        const {
          total = adapted.length,
          page: currentPage = page,
          perPage: limit = perPage,
          totalPages,
        } = response.meta ?? {};
        const safeLimit = typeof limit === "number" && limit > 0 ? limit : perPage;
        const fallbackTotalPages =
          safeLimit > 0 ? Math.max(1, Math.ceil(total / safeLimit || 1)) : 1;

        setUsers(adapted);
        setMeta({
          total,
          page: currentPage,
          perPage: safeLimit,
          totalPages:
            typeof totalPages === "number" && totalPages > 0 ? totalPages : fallbackTotalPages,
        });
        if (currentPage !== page) setPage(currentPage);
      } catch (err) {
        if (cancelled) return;
        console.error("fetchUsers error", err);
        setUsers([]);
        setMeta((prev) => ({ ...prev, total: 0, totalPages: 1 }));
        setError("Não foi possível carregar os usuários.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [page, filter, debouncedSearch, reloadToken]);

  const refreshUsers = () => setReloadToken((token) => token + 1);
  const totalLabel = useMemo(() => {
    const total = meta.total;
    return `${total} ${total === 1 ? "usuário" : "usuários"}`;
  }, [meta.total]);

  const handleBan = async (userId: string) => {
    setBanningIds((prev) => ({ ...prev, [userId]: true }));
    try {
      await banUser(userId);
      toast.success("Usuário banido com sucesso.");
      refreshUsers();
    } catch (err) {
      console.error("banUser error", err);
      toast.error("Não foi possível banir o usuário.");
    } finally {
      setBanningIds((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    }
  };

  const handleUnban = async (userId: string) => {
    setUnbanningIds((prev) => ({ ...prev, [userId]: true }));
    try {
      await unbanUser(userId);
      toast.success("Usuário reativado com sucesso.");
      refreshUsers();
    } catch (err) {
      console.error("unbanUser error", err);
      toast.error("Não foi possível desbanir o usuário.");
    } finally {
      setUnbanningIds((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-[28px] font-semibold text-[#191F33]">Usuários</h1>
            <p className="text-sm text-[#5A6480]">Ver todos usuários</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6480]" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.currentTarget.value)}
                placeholder="Pesquisar por usuário"
                className="h-11 rounded-xl border-[#D0D9F1] bg-white pl-11 text-sm text-[#191F33] placeholder:text-[#8A94AB]"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.currentTarget.value as FilterKey)}
              className="h-11 rounded-xl border border-[#D0D9F1] bg-white px-4 text-sm text-[#191F33] focus:outline-none focus:ring-2 focus:ring-[#977CEC]"
            >
              {TABS.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  Filtrar por {tab.label.toLowerCase()}
                </option>
              ))}
            </select>

            <div className="px-4 py-2 text-sm font-normal" style={{ color: "#808DB2" }}>
              {totalLabel}
            </div>
          </div>

          <nav className="mt-4 flex w-full overflow-hidden rounded-full border border-[#D5DDF5] bg-white">
            {TABS.map((tab, index) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  aria-label={`Filtrar por ${tab.label.toLowerCase()}`}
                  aria-pressed={active}
                  className={cn(
                    "flex-1 px-6 py-2 text-sm font-medium text-[#5A6480] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#977CEC] focus-visible:ring-offset-0",
                    index === 0 && "rounded-l-full",
                    index === TABS.length - 1 && "rounded-r-full",
                    active ? "bg-[#EEF2FF] text-[#2E3A63]" : "bg-white hover:bg-[#F7F9FF]",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {loading && users.length === 0
            ? Array.from({ length: Math.min(perPage, 6) }, (_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-[282px] w-full max-w-[362px] animate-pulse rounded-[22px] border border-[#E6EBFA] bg-[#F8FAFF]"
                />
              ))
            : users.map((user: UserCardUser) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onBan={handleBan}
                  onUnban={handleUnban}
                  onViewProfile={(id) => navigate(`/users/${id}`)}
                  isBanning={Boolean(banningIds[user.id])}
                  isUnbanning={Boolean(unbanningIds[user.id])}
                />
              ))}
          {!loading && users.length === 0 && !error && (
            <div className="col-span-full rounded-2xl border border-dashed border-[#D0D9F1] p-10 text-center text-[#5A6480]">
              Nenhum usuário encontrado com os filtros atuais.
            </div>
          )}
        </section>

        {error && (
          <div className="mb-6 mt-6 rounded-xl border border-[#F5C2C7] bg-[#FFF5F5] p-4 text-sm text-[#842029]">
            <div className="flex items-start justify-between gap-4">
              <span>{error}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={refreshUsers}
                className="h-8 px-3 text-[#842029] hover:bg-[#FDEAEA]"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        <Pagination
          page={meta.page}
          totalPages={Math.max(1, meta.totalPages)}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>
    </main>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  disabled?: boolean;
}) {
  const selectedBtnRef = React.useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedBtnRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);
  const start = Math.max(1, Math.min(page - half, Math.max(1, totalPages - maxVisible + 1)));
  const end = Math.min(totalPages, start + maxVisible - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);

  const goPage = (target: number) => {
    if (disabled) return;
    onPageChange(Math.max(1, Math.min(totalPages, target)));
  };
  const prevDisabled = disabled || page === 1;
  const nextDisabled = disabled || page === totalPages;

  return (
    <div className="mt-10 flex items-center justify-center">
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Página anterior"
          onClick={() => goPage(page - 1)}
          disabled={prevDisabled}
          className="flex h-10 items-center justify-center rounded-md border bg-white px-3 py-2 md:h-12"
          style={{
            borderColor: "#D0D9F1",
            color: prevDisabled ? "#7682A5" : "#191F33",
            opacity: prevDisabled ? 0.5 : 1,
          }}
        >
          <Image
            src="/Arrow.svg"
            alt="Anterior"
            width={13}
            height={13}
            className="object-contain"
          />
        </button>

        <div
          className="users-pagination-scroll mx-4 flex items-center gap-2 overflow-x-auto md:mx-6"
          style={{ scrollBehavior: "smooth" }}
        >
          {pages.map((p) => (
            <button
              key={p}
              ref={p === page ? selectedBtnRef : null}
              type="button"
              disabled={disabled}
              onClick={() => goPage(p)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md border bg-white text-sm font-medium md:h-12 md:w-12",
                disabled && "cursor-not-allowed opacity-70",
              )}
              style={{
                borderColor: "#D0D9F1",
                color: p === page ? "#191F33" : "#7682A5",
                minWidth: 44,
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Próxima página"
          onClick={() => goPage(page + 1)}
          disabled={nextDisabled}
          className="flex h-10 items-center justify-center rounded-md border bg-white px-3 py-2 md:h-12"
          style={{
            borderColor: "#D0D9F1",
            color: nextDisabled ? "#7682A5" : "#191F33",
            opacity: nextDisabled ? 0.5 : 1,
          }}
        >
          <Image
            src="/Arrow.svg"
            alt="Próxima"
            width={13}
            height={13}
            className="object-contain rotate-180"
          />
        </button>
      </div>

      <style>{`
        .users-pagination-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .users-pagination-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function adaptUser(raw: unknown): UserCardUser | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const id = String(data.id);
  if (!id) return null;

  const nameValue = data.name ?? data.fullName ?? data.displayName;
  const name =
    typeof nameValue === "string" && nameValue.trim().length > 0 ? nameValue : "Usuário sem nome";

  const statusRaw = typeof data.status === "string" ? data.status.toLowerCase() : "";
  const status: UserStatus =
    statusRaw === "active" ? "active" : statusRaw === "banned" ? "banned" : "pending";

  const codename = typeof data.codinome === "string" ? data.codinome : null;
  const email = typeof data.email === "string" ? data.email : null;
  const phone = typeof data.phone === "string" ? data.phone : null;
  const isVerified = typeof data.isVerified === "boolean" ? data.isVerified : false;
  const createdAt = typeof data.createdAt === "string" ? data.createdAt : null;
  const loginAttemptsRaw = data.loginAttempts;
  const loginAttempts =
    typeof loginAttemptsRaw === "number"
      ? loginAttemptsRaw
      : typeof loginAttemptsRaw === "string"
      ? Number.parseInt(loginAttemptsRaw, 10) || 0
      : 0;
  const lockedUntil = typeof data.lockedUntil === "string" ? data.lockedUntil : null;

  const bio =
    typeof data.bio === "string"
      ? data.bio
      : typeof data.description === "string"
      ? data.description
      : typeof data.about === "string"
      ? data.about
      : null;

  const avatar =
    typeof data.avatarUrl === "string"
      ? data.avatarUrl
      : typeof data.photoUrl === "string"
      ? data.photoUrl
      : typeof data.picture === "string"
      ? data.picture
      : null;

  return {
    id,
    name,
    status,
    codename,
    email,
    phone,
    isVerified,
    createdAt,
    loginAttempts,
    lockedUntil,
    bio,
    avatarUrl: avatar,
  };
}

function ensureUsersArray(payload: unknown): Record<string, unknown>[] {
  if (!Array.isArray(payload)) {
    throw new Error("Formato inesperado de usuários retornado pela API.");
  }

  const invalidIndex = payload.findIndex(
    (item) => !item || typeof item !== "object" || Array.isArray(item),
  );

  if (invalidIndex !== -1) {
    throw new Error(`Usuário na posição ${invalidIndex} está em um formato inválido.`);
  }

  return payload as Record<string, unknown>[];
}
