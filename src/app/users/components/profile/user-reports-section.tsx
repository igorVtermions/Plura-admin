// src/features/users/components/profile/UserReportsSection.tsx
import React from "react";
import type { UserProfileReport } from "@/types/users";
import { formatDateTime } from "../../utils/profile-formatters";

type Props = {
  reports: UserProfileReport[];
  reportsTotal: number;
};

export const UserReportsSection: React.FC<Props> = ({ reports, reportsTotal }) => (
  <section className="mt-12 space-y-6">
    <header className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-[#191F33]">Denúncias</h2>
      <span className="text-sm text-[#8A94AB]">
        {reports.length} de {reportsTotal}
      </span>
    </header>

    {reports.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-[#D0D9F1] p-8 text-center text-[#5A6480]">
        Nenhuma denúncia registrada para este usuário.
      </div>
    ) : (
      <div className="space-y-4">
        {reports.map((report) => (
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
  </section>
);
