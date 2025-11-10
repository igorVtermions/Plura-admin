"use client";

import React, { useEffect, useRef, useState } from "react";
import { MoreVertical, User as UserIcon } from "lucide-react";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Plan = "subscriber" | "free" | "banned";

export type User = {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatarUrl?: string | null;
  plan: Plan;
};

type PlanMeta = {
  headerColor: string;
  iconColor: string;
  nameColor: string;
  usernameColor: string;
  bioColor: string;
  avatarBorder: string;
  avatarShadow: string;
  actionBg: string;
  actionBorder: string;
  buttonGradient: string;
  buttonBorder: string;
};

const PLAN_META: Record<Plan, PlanMeta> = {
  subscriber: {
    headerColor: "#A27DFF",
    iconColor: "#5D47B1",
    nameColor: "#2B1F58",
    usernameColor: "#6350C9",
    bioColor: "#4D4F72",
    avatarBorder: "rgba(255, 255, 255, 0.68)",
    avatarShadow: "0px 14px 28px rgba(144, 118, 236, 0.32)",
    actionBg: "rgba(255, 255, 255, 0.28)",
    actionBorder: "rgba(255, 255, 255, 0.45)",
    buttonGradient: "linear-gradient(180deg, #9F85FF 0%, #7F60F5 100%)",
    buttonBorder: "rgba(255, 255, 255, 0.6)",
  },
  free: {
    headerColor: "#BBC7DA",
    iconColor: "#42536C",
    nameColor: "#23344E",
    usernameColor: "#56667F",
    bioColor: "#4A566B",
    avatarBorder: "rgba(255, 255, 255, 0.7)",
    avatarShadow: "0px 14px 28px rgba(118, 138, 167, 0.24)",
    actionBg: "rgba(255, 255, 255, 0.32)",
    actionBorder: "rgba(255, 255, 255, 0.54)",
    buttonGradient: "linear-gradient(180deg, #8593AA 0%, #6E7D95 100%)",
    buttonBorder: "rgba(255, 255, 255, 0.55)",
  },
  banned: {
    headerColor: "#F08989",
    iconColor: "#7D2E2E",
    nameColor: "#661F1F",
    usernameColor: "#8F3636",
    bioColor: "#5D2020",
    avatarBorder: "rgba(255, 255, 255, 0.7)",
    avatarShadow: "0px 14px 28px rgba(201, 96, 96, 0.28)",
    actionBg: "rgba(255, 255, 255, 0.32)",
    actionBorder: "rgba(255, 255, 255, 0.52)",
    buttonGradient: "linear-gradient(180deg, #E67070 0%, #C54C4C 100%)",
    buttonBorder: "rgba(255, 255, 255, 0.55)",
  },
};

export function UserCard({ user }: { user: User }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const meta = PLAN_META[user.plan];
  const hasAvatar = Boolean(user.avatarUrl && user.avatarUrl.trim().length > 0);

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

  return (
    <article className="relative flex w-full max-w-[362px] flex-col overflow-hidden rounded-[22px] border border-transparent bg-white h-[282px]">
      <div
        className="absolute inset-x-0 top-0 z-0 h-14"
        style={{ backgroundColor: meta.headerColor }}
      />

      <div ref={menuRef} className="absolute right-5 z-20" style={{ top: 50 }}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
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
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#F4F6FF]"
              >
                Ver perfil do usuário
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#C53030] hover:bg-[#FFF2F2]"
              >
                Banir usuário
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "absolute left-5 top-4 z-10 flex h-20 w-20 items-center justify-center overflow-hidden border-[3px]",
          hasAvatar ? "rounded-[18px] bg-white/80" : "rounded-none bg-[#F4F6FF]"
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
          <h3
            className="text-[15px] font-semibold leading-tight"
            style={{ color: meta.nameColor }}
          >
            {user.name}
          </h3>
          <p
            className="text-sm font-medium"
            style={{ color: meta.usernameColor }}
          >
            @{user.username}
          </p>
        </div>

        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: meta.bioColor }}
        >
          {user.bio}
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
            onClick={() => {}}
          >
            Ver perfil
          </Button>
        </div>
      </div>
    </article>
  );
}