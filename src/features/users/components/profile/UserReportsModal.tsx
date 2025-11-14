import React, { useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "../../profile-formatters";
import type { UserProfileReport } from "../../types";

type Props = {
  open: boolean;
  onClose: () => void;
  reports?: UserProfileReport[];
  total?: number | null;
};

const MOCK_REPORTS: UserProfileReport[] = [
  {
    id: "mock-1",
    authorName: "Equipe Plura",
    reason: "Conduta inadequada",
    description:
      "Transmissão interrompida por linguagem imprópria detectada pela moderação.",
    createdAt: "2024-11-18T10:30:00.000Z",
  },
  {
    id: "mock-2",
    authorName: "Aluno convidado",
    reason: "Comportamento agressivo",
    description:
      "Participante relatou atitude hostil durante sessão de Perguntas & Respostas.",
    createdAt: "2024-11-04T18:05:00.000Z",
  },
  {
    id: "mock-3",
    authorName: "Sistema automático",
    reason: "Uso de termos proibidos",
    description: "Filtro automático detectou palavras bloqueadas em chat público.",
    createdAt: "2024-10-27T22:12:00.000Z",
  },
];

function getCountLabel(
  items: UserProfileReport[],
  total?: number | null,
  usingMock?: boolean,
): string {
  if (items.length === 0) return "";
  const effectiveTotal =
    typeof total === "number" && !usingMock && total >= items.length ? total : items.length;
  if (effectiveTotal === items.length) {
    return `${items.length} ${items.length === 1 ? "denúncia" : "denúncias"}`;
  }
  return `${items.length} de ${effectiveTotal} denúncias`;
}

const UserReportsModal: React.FC<Props> = ({ open, onClose, reports, total }) => {
  const usingMock = !reports || reports.length === 0;
  const items = useMemo(
    () => (usingMock ? MOCK_REPORTS : reports ?? []),
    [reports, usingMock],
  );
  const subtitle = usingMock
    ? "Visualização mockada enquanto a integração real não chega"
    : "Denúncias registradas para este usuário";
  const countLabel = getCountLabel(items, total, usingMock);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Denúncias"
      subtitle={subtitle}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {usingMock && (
          <div className="rounded-lg border border-dashed border-[#D0D9F1] bg-[#F8FAFF] p-4 text-sm text-[#5A6480]">
            Estes registros são fictícios e servem apenas como placeholder até conectarmos com o
            endpoint real.
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-[#5A6480]">Nenhuma denúncia disponível.</p>
        ) : (
          <div className="space-y-3">
            {items.map((report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-[#E2E8F8] bg-white p-5"
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

        <div className="flex flex-col gap-1 text-xs text-[#8A94AB] sm:flex-row sm:items-center sm:justify-between">
          <span>{countLabel}</span>
          <span>{usingMock ? "Origem: mock temporário" : "Origem: dados do perfil"}</span>
        </div>
      </div>
    </Modal>
  );
};

export default UserReportsModal;