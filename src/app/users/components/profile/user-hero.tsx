// src/features/users/components/profile/UserHero.tsx
import React from "react";
import { User as UserIcon } from "lucide-react";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/users";
import { STATUS_META } from "../../utils/visuals";
import { formatProfileTopic } from "../../utils/profile-formatters";

type StatusMeta = (typeof STATUS_META)[keyof typeof STATUS_META];

type Props = {
  profile: UserProfile;
  statusMeta: StatusMeta;
  isBanned: boolean;
  primaryActionLabel: string;
  onPrimaryActionClick: () => void;
  onViewUserData: () => void;
  pendingAction: boolean;
};

export const UserHero: React.FC<Props> = ({
  profile,
  statusMeta,
  isBanned,
  primaryActionLabel,
  onPrimaryActionClick,
  onViewUserData,
  pendingAction,
}) => {
  const actionButtonClasses = isBanned
    ? "border-[#256740] text-[#256740] hover:bg-[#256740] hover:text-white"
    : "border-[#C53030] text-[#C53030] hover:bg-[#B42323] hover:text-white hover:border-[#B42323]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-6">
        <div
          className={cn(
            "relative -mt-28 flex h-[168px] w-[168px] items-center justify-center overflow-hidden border-[4px] rounded-full",
            profile.avatarUrl ? "bg-white/80" : "bg-[#F4F6FF]",
          )}
          style={{
            borderColor: profile.avatarUrl ? statusMeta.avatarBorder : "#D0D9F1",
            boxShadow: profile.avatarUrl ? statusMeta.avatarShadow : "none",
          }}
        >
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              width={168}
              height={168}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <UserIcon className="h-16 w-16 text-[#9BA3BC]" strokeWidth={1.6} />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-left">
              <h1
                className="text-2xl font-semibold leading-none"
                style={{ color: statusMeta.nameColor }}
              >
                {profile.name}
              </h1>
              {profile.isVerified && profile.status !== "banned" && (
                <span className="inline-flex items-center rounded-full border border-[#D5DDF5] px-3 py-1 text-xs font-semibold text-[#256740]">
                  Verificado
                </span>
              )}
              {profile.plan && (
                <span className="inline-flex items-center rounded-full border border-[#D5DDF5] px-3 py-1 text-xs font-semibold text-[#586189]">
                  {profile.plan}
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-[#5A6480]">
              {profile.codename
                ? `@${profile.codename.replace(/^@/, "")}`
                : profile.email ?? profile.phone ?? "Sem identificador"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[220px] flex-1 flex-wrap gap-2">
          {profile.topics.length > 0 ? (
            profile.topics.map((topic, index) => (
              <span
                key={`${topic}-${index}`}
                className="rounded-full border border-[#E1E6F3] px-3 py-1 text-xs font-medium text-[#586189]"
              >
                {formatProfileTopic(topic)}
              </span>
            ))
          ) : (
            <span className="text-xs text-[#8A94AB]">Sem tópicos atribuídos.</span>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={pendingAction}
            className={cn(
              "h-11 rounded-[12px] px-6 text-sm font-semibold transition-colors disabled:opacity-70",
              actionButtonClasses,
            )}
            onClick={onPrimaryActionClick}
          >
            {primaryActionLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-[12px] border border-[#D5DDF5] px-6 text-sm font-semibold text-[#5A6480] hover:bg-[#F4F6FF] hover:text-[#2B1F58]"
            onClick={onViewUserData}
          >
            Ver dados do usuário
          </Button>
        </div>
      </div>

      <p className="text-base font-normal leading-relaxed text-[#5A6480]">
        {profile.bio && profile.bio.trim().length > 0
          ? profile.bio
          : "Este usuário ainda não adicionou uma bio."}
      </p>
    </div>
  );
};
