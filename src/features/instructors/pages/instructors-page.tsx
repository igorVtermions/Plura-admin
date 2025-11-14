// src/features/instructors/pages/instructors-page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Pagination from "../components/Pagination";
import InstructorCard from "../components/InstructorCard";
import EditInstructorModal from "@/components/instructor/EditInstructorModal";
import { adaptInstructor, fetchInstructors, deleteInstructor } from "../api";
import type {
  InstructorCardData,
  InstructorListMeta,
  InstructorStatus,
} from "../types";
import { useNavigate } from "react-router-dom";

type FilterKey = "all" | Extract<InstructorStatus, "active" | "pending" | "banned">;

const perPage = 9;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "pending", label: "Pendentes" },
  { key: "banned", label: "Banidos" },
];

const SKELETON_COUNT = 6;

export default function InstructorsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [instructors, setInstructors] = useState<InstructorCardData[]>([]);
  const [meta, setMeta] = useState<InstructorListMeta>({
    total: 0,
    page: 1,
    perPage,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [pendingDeletes, setPendingDeletes] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOpen, setEditingOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorCardData | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          search: debouncedSearch || undefined,
          status: filter === "all" ? undefined : filter,
          page,
          perPage,
        };
        const response = await fetchInstructors(params);
        const adapted = response.data
          .map(adaptInstructor)
          .filter((item): item is InstructorCardData => item !== null);

        if (cancelled) return;

        const total =
          typeof response.meta.total === "number" ? response.meta.total : adapted.length;
        const currentPage =
          typeof response.meta.page === "number" ? response.meta.page : page;
        const limit =
          typeof response.meta.perPage === "number" && response.meta.perPage > 0
            ? response.meta.perPage
            : perPage;
        const totalPages =
          typeof response.meta.totalPages === "number" && response.meta.totalPages > 0
            ? response.meta.totalPages
            : Math.max(1, Math.ceil(total / limit));

        setInstructors(adapted);
        setMeta({
          total,
          page: currentPage,
          perPage: limit,
          totalPages,
        });
        if (currentPage !== page) setPage(currentPage);
      } catch (err) {
        if (cancelled) return;
        console.error("fetchInstructors error", err);
        setInstructors([]);
        setMeta((prev) => ({ ...prev, total: 0, totalPages: 1 }));
        setError("Não foi possível carregar os instrutores.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, filter, debouncedSearch, reloadToken]);

  const totalLabel = useMemo(() => {
    const total = meta.total ?? instructors.length;
    const noun = total === 1 ? "instrutor" : "instrutores";
    return `${total} ${noun}`;
  }, [meta.total, instructors.length]);

  const handleReload = () => setReloadToken((value) => value + 1);

  const handleViewProfile = (id: string) => {
    navigate(`/instructors/${id}`);
  };

  const handleEditProfile = (id: string) => {
    const selected = instructors.find((item) => item.id === id) ?? null;
    setSelectedInstructor(selected);
    setEditingId(id);
    setEditingOpen(true);
  };

  const handleDeleteInstructor = async (id: string) => {
    if (pendingDeletes[id]) return;

    setPendingDeletes((prev) => ({ ...prev, [id]: true }));
    const wasLastItemOnPage = instructors.length === 1;

    try {
      await deleteInstructor(id);
      toast.success("Instrutor removido com sucesso.");

      setInstructors((prev) => prev.filter((item) => item.id !== id));
      setMeta((prev) => {
        const nextTotal =
          typeof prev.total === "number" ? Math.max(prev.total - 1, 0) : prev.total;
        const perPageValue =
          typeof prev.perPage === "number" && prev.perPage > 0 ? prev.perPage : perPage;
        const nextTotalPages =
          typeof nextTotal === "number"
            ? Math.max(1, Math.ceil(nextTotal / perPageValue))
            : prev.totalPages;
        const currentPageValue =
          typeof prev.page === "number" ? prev.page : page;
        let nextPage = currentPageValue;

        if (
          typeof currentPageValue === "number" &&
          typeof nextTotalPages === "number"
        ) {
          nextPage = Math.min(currentPageValue, nextTotalPages);
        }

        return {
          ...prev,
          total: nextTotal,
          totalPages: nextTotalPages,
          page: nextPage,
        };
      });

      if (wasLastItemOnPage && page > 1) {
        setPage((value) => Math.max(1, value - 1));
      } else {
        handleReload();
      }
    } catch (err) {
      console.error("deleteInstructor error", err);
      toast.error("Não foi possível remover o instrutor. Tente novamente.");
    } finally {
      setPendingDeletes((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleInstructorUpdated = (updated: InstructorCardData) => {
    setInstructors((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelectedInstructor(updated);
    handleReload();
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-[28px] font-semibold text-[#191F33]">Instrutores</h1>
            <p className="text-sm text-[#5A6480]">Ver todos instrutores</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6480]" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.currentTarget.value)}
                placeholder="Pesquisar por instrutor"
                className="h-11 rounded-xl border-[#D0D9F1] bg-white pl-11 text-sm text-[#191F33] placeholder:text-[#8A94AB]"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.currentTarget.value as FilterKey)}
              className="h-11 rounded-xl border border-[#D0D9F1] bg-white px-4 text-sm text-[#191F33] focus:outline-none focus:ring-2 focus:ring-[#977CEC]"
            >
              {FILTERS.map((item) => (
                <option key={item.key} value={item.key}>
                  Filtrar por {item.label.toLowerCase()}
                </option>
              ))}
            </select>

            <div className="px-4 py-2 text-sm font-normal" style={{ color: "#808DB2" }}>
              {totalLabel}
            </div>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {loading && instructors.length === 0
            ? Array.from({ length: Math.min(perPage, SKELETON_COUNT) }, (_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-[312px] w-full max-w-[362px] animate-pulse rounded-[22px] border border-[#E6EBFA] bg-[#F8FAFF]"
                />
              ))
            : instructors.map((instructor) => (
                <InstructorCard
                  key={instructor.id}
                  instructor={instructor}
                  onView={handleViewProfile}
                  onEdit={handleEditProfile}
                  onDelete={handleDeleteInstructor}
                  pendingDelete={pendingDeletes[instructor.id]}
                />
              ))}
          {!loading && instructors.length === 0 && !error && (
            <div className="col-span-full rounded-2xl border border-dashed border-[#D0D9F1] p-10 text-center text-[#5A6480]">
              Nenhum instrutor encontrado com os filtros atuais.
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
                onClick={handleReload}
                className="h-8 px-3 text-[#842029] hover:bg-[#FDEAEA]"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        <Pagination
          page={meta.page ?? 1}
          totalPages={Math.max(1, meta.totalPages ?? 1)}
          onPageChange={setPage}
          disabled={loading}
        />

        <EditInstructorModal
          open={editingOpen}
          tutorId={editingId}
          fallbackData={selectedInstructor}
          onUpdated={handleInstructorUpdated}
          onClose={() => {
            setEditingOpen(false);
            setEditingId(null);
            setSelectedInstructor(null);
          }}
        />
      </div>
    </main>
  );
}