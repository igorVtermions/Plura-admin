// src/features/instructors/components/profile/InstructorHero.tsx
import { Phone, User as UserIcon } from "lucide-react";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InstructorProfile } from "../../types";
import type { InstructorStatusMeta } from "../../visuals";

type Props = {
  profile: InstructorProfile;
  statusMeta: InstructorStatusMeta;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
};

export default function InstructorHero({
  profile,
  statusMeta,
  onEdit,
  onDelete,
  deleting,
}: Props) {
  const identifier = profile.codename
    ? `@${profile.codename.replace(/^@/, "")}`
    : profile.email ?? profile.phone ?? "Sem identificador";

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative -mt-28 flex h-[168px] w-[168px] items-center justify-center overflow-hidden rounded-full border-[4px]",
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
            {profile.role && (
              <span
                className="inline-flex items-center rounded-full border border-[#D5DDF5] px-3 py-1 text-xs font-semibold"
                style={{ color: statusMeta.subtitleColor }}
              >
                {profile.role}
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-[#5A6480]">{identifier}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[220px] flex-1 flex-wrap gap-2">
          {profile.phone ? (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-[#E1E6F3] px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: statusMeta.badgeBg,
                color: statusMeta.badgeText,
              }}
            >
              <Phone className="h-4 w-4" style={{ color: statusMeta.accentColor }} />
              {profile.phone}
            </span>
          ) : (
            <span className="text-xs text-[#8A94AB]">
              Sem informações de contato registradas.
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onDelete}
            disabled={deleting}
            className="h-11 rounded-[12px] border border-[#F3B8B8] px-6 text-sm font-semibold text-[#C53030] transition-colors hover:border-[#C53030] hover:bg-[#FFF1F1] hover:text-[#A22727] disabled:opacity-70"
          >
            {deleting ? "Removendo..." : "Deletar instrutor"}
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            className="h-11 rounded-[12px] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: statusMeta.accentColor,
              boxShadow: statusMeta.primaryButtonShadow,
            }}
          >
            Editar perfil
          </Button>
        </div>
      </div>

      <p className="text-base_font-normal leading-relaxed text-[#5A6480]">
        {profile.bio && profile.bio.trim().length > 0
          ? profile.bio
          : "Este instrutor ainda não adicionou uma bio."}
      </p>
    </div>
  );
}