import React, { useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "@/app/users/utils/profile-formatters";
import type { InstructorProfileReport } from "@/types/tutor";

type Props = {
  open: boolean;
  onClose: () => void;
  reports?: InstructorProfileReport[];
  total?: number | null;
};

function buildCountLabel(items: InstructorProfileReport[], total?: number | null): string {
  if (items.length === 0) return "";
  const effectiveTotal = typeof total === "number" && total >= items.length ? total : items.length;
  if (effectiveTotal === items.length) {
    return `${items.length} ${items.length === 1 ? "denúncia" : "denúncias"}`;
  }
  return `${items.length} de ${effectiveTotal} denúncias`;
}

export const InstructorReportsModal: React.FC<Props> = ({ open, onClose, reports, total }) => {
  const items = useMemo(() => reports ?? [], [reports]);
  const countLabel = buildCountLabel(items, total);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Denúncias"
      subtitle="Denúncias registradas para este instrutor"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#D0D9F1] bg-[#F8FAFF] p-6 text-center text-sm text-[#5A6480]">
            Nenhuma denúncia registrada para este instrutor.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((report) => (
              <article key={report.id} className="rounded-2xl border border-[#E2E8F8] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#2B1F58]">
                      {report.authorName ?? "Autor não identificado"}
                    </p>
                    <p className="text-xs text-[#8A94AB]">
                      {formatDateTime(report.createdAt) ?? "Data não informada"}
                    </p>
                  </div>
                  {report.reason && (
                    <span className="rounded-full border border-[#F5C2C7] px-3 py-1 text-xs font-semibold text-[#9B1C1C]">
                      {report.reason}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#5A6480]">
                  {report.description ?? "Sem detalhes adicionais fornecidos."}
                </p>
              </article>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1 text-xs text-[#8A94AB] sm:flex-row sm:items-center sm:justify-between">
          <span>{countLabel}</span>
          <span>Origem: dados do perfil do instrutor</span>
        </div>
      </div>
    </Modal>
  );
};
