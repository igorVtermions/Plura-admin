import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "../../utils/profile-formatters";
import type { UserProfileReport } from "@/types/users";

type Props = {
  open: boolean;
  onClose: () => void;
  reports?: UserProfileReport[];
  total?: number | null;
  loading?: boolean;
  error?: string | null;
};

function getCountLabel(items: UserProfileReport[], total?: number | null): string {
  if (items.length === 0) return "";
  const effectiveTotal = typeof total === "number" && total >= items.length ? total : items.length;
  if (effectiveTotal === items.length) {
    return `${items.length} ${items.length === 1 ? "denúncia" : "denúncias"}`;
  }
  return `${items.length} de ${effectiveTotal} denúncias`;
}

export const UserReportsModal: React.FC<Props> = ({
  open,
  onClose,
  reports,
  total,
  loading,
  error,
}) => {
  const navigate = useNavigate();
  const items = useMemo(() => reports ?? [], [reports]);
  const subtitle = "Denúncias registradas para este usuário";
  const countLabel = getCountLabel(items, total);

  const handleOpenTicket = (report: UserProfileReport) => {
    if (!report.type) return;
    navigate(`/support/ticket/${report.id}?type=${report.type}`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Denúncias" subtitle={subtitle} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-[#F5C2C7] bg-[#FDEDEE] p-4 text-sm text-[#9B1C1C]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`report-skeleton-${index}`}
                className="rounded-2xl border border-[#E2E8F8] bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded-full bg-[#E9EDF7]" />
                    <div className="h-3 w-24 rounded-full bg-[#EEF1FA]" />
                  </div>
                  <div className="h-6 w-24 rounded-full bg-[#F3F5FB]" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded-full bg-[#EEF1FA]" />
                  <div className="h-3 w-5/6 rounded-full bg-[#EEF1FA]" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-[#5A6480]">Nenhuma denúncia disponível.</p>
        ) : (
          <div className="space-y-3">
            {items.map((report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-[#E2E8F8] bg-white p-5 transition hover:shadow-sm cursor-pointer"
                onClick={() => handleOpenTicket(report)}
                role={report.type ? "button" : undefined}
                tabIndex={report.type ? 0 : -1}
                onKeyDown={(event) => {
                  if (!report.type) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenTicket(report);
                  }
                }}
                aria-label={report.type ? "Abrir detalhes do ticket" : undefined}
              >
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

        <div className="text-xs text-[#8A94AB]">
          <span>{countLabel}</span>
        </div>
      </div>
    </Modal>
  );
};
