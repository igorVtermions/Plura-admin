"use client";

import React, { useEffect, useRef, useState } from "react";
import { MoreVertical, User as UserIcon } from "lucide-react";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { UserCardUser } from "@/types/users";
import { STATUS_META } from "../utils/visuals";

const MAX_DESCRIPTION_LENGTH = 80;
const DEFAULT_DESCRIPTION = "Este usuário ainda não adicionou uma bio.";

type UserCardProps = {
  user: UserCardUser;
  onBan?: (userId: string) => void;
  onUnban?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  isBanning?: boolean;
  isUnbanning?: boolean;
};

export function UserCard({
  user,
  onBan,
  onUnban,
  onViewProfile,
  isBanning = false,
  isUnbanning = false,
}: UserCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"ban" | "unban" | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const meta = STATUS_META[user.status] ?? STATUS_META.pending;
  const hasAvatar = typeof user.avatarUrl === "string" && user.avatarUrl.trim().length > 0;

  const codename = user.codename?.trim();
  const fallbackContact = user.email?.trim() || user.phone?.trim() || null;
  const displayHandle = codename
    ? `@${codename.startsWith("@") ? codename.slice(1) : codename}`
    : fallbackContact ?? "Sem identificador";

  const rawBio = typeof user.bio === "string" ? user.bio.trim() : "";
  const baseDescription = rawBio.length > 0 ? rawBio : DEFAULT_DESCRIPTION;
  const description =
    baseDescription.length > MAX_DESCRIPTION_LENGTH
      ? `${baseDescription.slice(0, MAX_DESCRIPTION_LENGTH - 3).trimEnd()}...`
      : baseDescription;

  const isBanned = user.status === "banned";
  const canBan = typeof onBan === "function" && !isBanned;
  const canUnban = typeof onUnban === "function" && isBanned;
  const isBanDisabled = !canBan || isBanning;
  const isUnbanDisabled = !canUnban || isUnbanning;
  const banLabel = isBanning ? "Banindo..." : "Banir usuário";
  const unbanLabel = isUnbanning ? "Desbanindo..." : "Desbanir usuário";

  const handleBanClick = () => {
    if (isBanDisabled || !onBan) return;
    onBan(user.id);
    setMenuOpen(false);
  };

  const openBanConfirm = () => {
    if (isBanDisabled) return;
    setMenuOpen(false);
    setConfirmAction("ban");
  };

  const openUnbanConfirm = () => {
    if (isUnbanDisabled) return;
    setMenuOpen(false);
    setConfirmAction("unban");
  };

  const handleConfirmAction = () => {
    if (confirmAction === "ban") {
      if (!onBan || isBanDisabled) return;
      onBan(user.id);
    } else if (confirmAction === "unban") {
      if (!onUnban || isUnbanDisabled) return;
      onUnban(user.id);
    }
    setConfirmAction(null);
  };

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

  const modalOpen = confirmAction !== null;
  const isConfirmBan = confirmAction === "ban";
  const confirmTitle = isConfirmBan ? "Banir usuário" : "Desbanir usuário";
  const confirmSubtitle = isConfirmBan
    ? `Tem certeza que deseja banir ${user.name}?`
    : `Tem certeza que deseja desbanir ${user.name}?`;
  const confirmDescription = isConfirmBan
    ? "Essa ação impede o acesso do usuário até que ele seja desbanido manualmente. Deseja continuar?"
    : "Essa ação restaurará o acesso do usuário imediatamente. Deseja continuar?";
  const confirmDisabled = isConfirmBan ? isBanDisabled : isUnbanDisabled;
  const confirmLabel = isConfirmBan ? banLabel : unbanLabel;
  const confirmButtonClasses = isConfirmBan
    ? "bg-[#C53030] text-white hover:bg-[#A22727] disabled:opacity-60"
    : "bg-[#256740] text-white hover:bg-[#1F5A35] disabled:opacity-60";

  const handleCardClick = () => {
    if (typeof onViewProfile === "function") onViewProfile(user.id);
  };

  return (
    <article
      className="relative flex w-full max-w-[362px] flex-col overflow-hidden rounded-[22px] border border-transparent bg-white h-[282px] cursor-pointer"
      onClick={handleCardClick}
    >
      <div
        className="absolute inset-x-0 top-0 z-0 h-14"
        style={{ backgroundColor: meta.headerColor }}
      />

      <div ref={menuRef} className="absolute right-5 z-20" style={{ top: 50 }}>
        <div className="relative">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center pt-2 text-current transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#977CEC] focus-visible:ring-offset-1 focus-visible:ring-offset-white"
            style={{ color: meta.iconColor }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Mais ações"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+12px)] w-[182px] rounded-xl border border-[#E2E8F8] bg-white p-2 text-sm text-[#191F33] shadow-[0px_18px_32px_rgba(63,85,199,0.16)]"
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  onViewProfile?.(user.id);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#F4F6FF]"
              >
                Ver perfil do usuário
              </button>
              {!isBanned && (
                <button
                  type="button"
                  disabled={isBanDisabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    openBanConfirm();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#C53030] hover:bg-[#FFF2F2]",
                    isBanDisabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
                  )}
                >
                  {banLabel}
                </button>
              )}
              {isBanned && (
                <button
                  type="button"
                  disabled={isUnbanDisabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    openUnbanConfirm();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#256740] hover:bg-[#E5F4ED]",
                    isUnbanDisabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
                  )}
                >
                  {unbanLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "absolute left-5 top-4 z-10 flex h-20 w-20 items-center justify-center overflow-hidden border-[3px] rounded-[18px]",
          hasAvatar ? "bg-white/80" : "bg-[#F4F6FF]",
        )}
        style={{
          borderColor: hasAvatar ? meta.avatarBorder : "#D0D9F1",
          boxShadow: hasAvatar ? meta.avatarShadow : "none",
        }}
      >
        {hasAvatar ? (
          <Image
            src={user.avatarUrl as string}
            alt={user.name}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserIcon className="h-10 w-10 text-[#9BA3BC]" strokeWidth={1.6} />
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-4 pt-[7.25rem]">
        <div className="space-y-1">
          <h3 className="text-[15px] font-semibold leading-tight" style={{ color: meta.nameColor }}>
            {user.name}
          </h3>
          <p className="text-sm font-medium" style={{ color: meta.handleColor }}>
            {displayHandle}
          </p>
        </div>

        <p className="mt-3 text-sm leading-relaxed" style={{ color: meta.bioColor }}>
          {description}
        </p>

        <div className="mt-auto pt-3">
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full rounded-[14px] border text-sm font-semibold transition-transform duration-150 hover:-translate-y-0.5 hover:bg-transparent hover:text-current focus-visible:ring-white/60 focus-visible:ring-offset-0"
            style={{
              background: meta.buttonGradient,
              color: "#FFFFFF",
              borderColor: meta.buttonBorder,
            }}
            onClick={(event) => {
              event.stopPropagation();
              onViewProfile?.(user.id);
            }}
          >
            Ver perfil
          </Button>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setConfirmAction(null)}
        title={confirmTitle}
        subtitle={confirmSubtitle}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              className="border-[#D0D9F1] text-[#1F2A44] hover:bg-[#F4F6FF]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAction}
              disabled={confirmDisabled}
              className={confirmButtonClasses}
            >
              {confirmLabel}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[#5A6480]">{confirmDescription}</p>
      </Modal>
    </article>
  );
}

function formatDate(value: string): string {
  if (!value) return "Data desconhecida";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
