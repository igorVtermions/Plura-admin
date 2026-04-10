"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, MoreVertical, User as UserIcon } from "lucide-react";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { InstructorCardData } from "@/types/tutor";

const MAX_DESCRIPTION_LENGTH = 40;
const DEFAULT_DESCRIPTION = "Este instrutor ainda não adicionou uma bio.";

type Props = {
  instructor: InstructorCardData;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => Promise<void> | void;
  pendingDelete?: boolean;
};

export function InstructorCard({
  instructor,
  onView,
  onEdit,
  onDelete,
  pendingDelete = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const hasView = typeof onView === "function";
  const hasEdit = typeof onEdit === "function";
  const hasDelete = typeof onDelete === "function";

  const baseDescription =
    typeof instructor.bio === "string" && instructor.bio.trim().length > 0
      ? instructor.bio.trim()
      : DEFAULT_DESCRIPTION;
  const description =
    baseDescription.length > MAX_DESCRIPTION_LENGTH
      ? `${baseDescription.slice(0, MAX_DESCRIPTION_LENGTH - 3).trimEnd()}...`
      : baseDescription;

  const email =
    typeof instructor.email === "string" && instructor.email.trim().length > 0
      ? instructor.email.trim()
      : null;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleDelete = async () => {
    if (!hasDelete || !onDelete) return;
    await onDelete(instructor.id);
    setConfirmDelete(false);
  };

  const hasAvatar =
    typeof instructor.avatarUrl === "string" && instructor.avatarUrl.trim().length > 0;

  const handleCardClick = () => {
    if (menuOpen || confirmDelete || pendingDelete) return;
    if (typeof onView === "function") onView(instructor.id);
  };

  return (
    <article
      className="relative flex h-[306px] w-full max-w-[362px] flex-col overflow-hidden rounded-[22px] border border-[#DDD1FF] bg-gradient-to-b from-[#F3EEFF] to-white cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="absolute inset-x-0 top-0 z-0 h-[72px] bg-[#A984FF]" />

      <div
        className={cn(
          "absolute left-6 top-8 z-10 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[24px] border-[3px]",
          hasAvatar ? "bg-white/85" : "bg-[#F4F1FF]",
        )}
        style={{ borderColor: hasAvatar ? "#D6C7FF" : "#E2D8FF" }}
      >
        {hasAvatar ? (
          <Image
            src={instructor.avatarUrl as string}
            alt={instructor.name}
            width={88}
            height={88}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserIcon className="h-10 w-10 text-[#B4A0E6]" strokeWidth={1.5} />
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-6 pb-6 pt-[7.6rem]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-[16px] font-semibold leading-tight text-[#2D1F46]">
              {instructor.name}
            </h3>
            {email && <p className="text-sm text-[#7455B8]">{email}</p>}
          </div>

          {(hasView || hasEdit || hasDelete) && (
            <div ref={menuRef} className="relative -mt-6">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((value) => !value);
                }}
                className="flex cursor-pointer h-8 w-8 items-center justify-center text-[#7A6B9E] transition-colors duration-150 hover:text-[#5A4D80] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#977CEC] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Mais ações"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-[198px] rounded-xl border border-[#E6DAFF] bg-white p-2 text-sm text-[#322152] shadow-[0px_16px_32px_rgba(146,114,222,0.18)] md:mt-3"
                >
                  {hasView && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen(false);
                        onView?.(instructor.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#F4EEFF]"
                    >
                      Ver perfil do instrutor
                    </button>
                  )}
                  {hasEdit && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen(false);
                        onEdit?.(instructor.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#F4EEFF]"
                    >
                      Editar perfil
                    </button>
                  )}
                  {hasDelete && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!pendingDelete) {
                          setMenuOpen(false);
                          setConfirmDelete(true);
                        }
                      }}
                      disabled={pendingDelete}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#C53030] hover:bg-[#FFF2F2]",
                        pendingDelete && "cursor-not-allowed opacity-60 hover:bg-transparent",
                      )}
                    >
                      {pendingDelete ? "Removendo..." : "Deletar conta"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 flex-1 text-sm leading-relaxed text-[#5F4A8C]">{description}</p>

        <div className="pt-4">
          <Button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onView?.(instructor.id);
            }}
            disabled={!hasView}
            className={cn(
              "h-11 w-full rounded-[14px] border border-white/40 bg-gradient-to-r from-[#8A6DE8] to-[#B59DFF] text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md",
              !hasView && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none",
            )}
          >
            Ver perfil
          </Button>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Deletar conta do instrutor"
        subtitle={`Tem certeza que deseja remover ${instructor.name}?`}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                setConfirmDelete(false);
              }}
              className="border-[#D0D9F1] text-[#1F2A44] hover:bg-[#F4F6FF]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleDelete();
              }}
              disabled={!hasDelete || pendingDelete}
              className="bg-[#C53030] text-white hover:bg-[#A22727] disabled:opacity-60"
            >
              {pendingDelete ? "Removendo..." : "Deletar conta"}
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
    </article>
  );
}
