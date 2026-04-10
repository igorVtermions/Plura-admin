"use client";

import React from "react";
import { useLocation, useParams } from "react-router-dom";
import Link from "@/router/Link";
import Image from "@/components/ui/Image";
import Modal from "@/components/ui/Modal";
import {
  fetchSupportTicketDetail,
  sendSupportTicketReply,
  updateSupportTicketStatus,
  type SupportTicket,
  type SupportTicketType,
} from "@/services/support";

export const metadata = { title: "Ticket de Suporte | Plura Talks - Administrador" };

function formatTicketTitle(ticket: SupportTicket) {
  if (ticket.type === "problem_report") {
    return ticket.problemType
      ? `Problema técnico: ${ticket.problemType}`
      : "Problema técnico";
  }
  if (ticket.type === "tutor_problem_report") {
    return ticket.problemType
      ? `Problema técnico tutor: ${ticket.problemType}`
      : "Problema técnico tutor";
  }
  if (ticket.type === "tutor_user_report") {
    return ticket.reason ? `Denúncia tutor: ${ticket.reason}` : "Denúncia tutor";
  }
  return ticket.reason
    ? `Denúncia usuário: ${ticket.reason}`
    : "Denúncia usuário";
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatTypeLabel(type: SupportTicketType) {
  if (type === "user_report") return "Denúncia de usuário";
  if (type === "tutor_user_report") return "Denúncia de tutor";
  if (type === "tutor_problem_report") return "Problema técnico (tutor)";
  return "Problema técnico";
}

export function SupportTicketPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const typeParam = React.useMemo(
    () => new URLSearchParams(location.search).get("type"),
    [location.search],
  );

  const [ticket, setTicket] = React.useState<SupportTicket | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<"conclude" | "reopen" | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [replyLoading, setReplyLoading] = React.useState(false);
  const [replyStatus, setReplyStatus] = React.useState<"idle" | "sent" | "error">("idle");

  const reporterProfileHref = React.useMemo(() => {
    if (!ticket) return null;
    if (ticket.tutorId) return `/instructors/${ticket.tutorId}`;
    if (ticket.reporterId) return `/users/${ticket.reporterId}`;
    return null;
  }, [ticket]);

  const reportedProfileHref = React.useMemo(() => {
    if (!ticket?.reportedId) return null;
    return `/users/${ticket.reportedId}`;
  }, [ticket]);

  React.useEffect(() => {
    let active = true;
    async function loadTicket() {
      if (!id || !typeParam) {
        setError("Tipo de ticket não informado.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSupportTicketDetail({
          id,
          type: typeParam as SupportTicketType,
        });
        if (!active) return;
        if (!data) {
          setError("Ticket não encontrado.");
        }
        setTicket(data);
      } catch {
        if (!active) return;
        setError("Erro ao carregar ticket.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTicket();
    return () => {
      active = false;
    };
  }, [id, typeParam]);

  const handleConfirmAction = async () => {
    if (!ticket || actionLoading || !pendingAction) return;
    try {
      setActionLoading(true);
      await updateSupportTicketStatus({
        id: ticket.id,
        type: ticket.type,
        status: pendingAction === "conclude" ? "completed" : "in_progress",
      });
      const refreshed = await fetchSupportTicketDetail({
        id: ticket.id,
        type: ticket.type,
      });
      if (refreshed) {
        setTicket(refreshed);
      } else {
        setTicket((prev) =>
          prev
            ? { ...prev, status: pendingAction === "conclude" ? "completed" : "in_progress" }
            : prev,
        );
      }
      setPendingAction(null);
    } catch (err) {
      console.error("Erro ao atualizar ticket", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!ticket || !replyText.trim() || replyLoading) return;
    try {
      setReplyLoading(true);
      setReplyStatus("idle");
      await sendSupportTicketReply({
        id: ticket.id,
        type: ticket.type,
        message: replyText.trim(),
      });
      const refreshed = await fetchSupportTicketDetail({
        id: ticket.id,
        type: ticket.type,
      });
      if (refreshed) setTicket(refreshed);
      setReplyText("");
      setReplyStatus("sent");
    } catch (err) {
      console.error("Erro ao enviar resposta", err);
      setReplyStatus("error");
    } finally {
      setReplyLoading(false);
    }
  };

  const isCompleted = ticket?.status === "completed";

  return (
    <main className="p-8 flex-1 overflow-auto md:overflow-auto min-h-0 bg-white">
      <div className="max-w-4xl mx-auto w-full min-h-0">
        <div className="flex items-center gap-5 mb-6">
          <Link
            href="/support"
            aria-label="Voltar para suporte"
            className="inline-flex items-center justify-center rounded-md p-0 m-0 leading-none"
            style={{ lineHeight: 0 }}
          >
            <Image src="/Arrow.svg" alt="Voltar" width={8} height={8} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-[28px] font-medium" style={{ color: "#191F33" }}>
              Ticket de suporte
            </h1>
            <p style={{ color: "#5A6480", fontSize: 16, fontWeight: 400 }}>
              Detalhes do ticket
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#E2E8F8] bg-[#F7F9FF] p-6 animate-pulse">
            <div className="h-6 w-2/3 rounded bg-[#E2E8F8]" />
            <div className="mt-4 h-4 w-1/2 rounded bg-[#E2E8F8]" />
            <div className="mt-6 h-24 rounded bg-[#E2E8F8]" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[#F5C2C7] bg-[#FFF5F5] p-4 text-sm text-[#842029]">
            {error}
          </div>
        ) : ticket ? (
          <div>
            <div className="rounded-2xl border border-[#E2E8F8] bg-white p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                    style={{
                      color: isCompleted ? "#1F7A4D" : "#7A4E00",
                      borderColor: isCompleted ? "#A7E3C5" : "#FFD7AD",
                      background: isCompleted ? "#E5F4ED" : "#FFF2E0",
                    }}
                  >
                    Ticket #{ticket.id}
                  </div>
                  <h2 className="mt-3 text-[20px] font-semibold" style={{ color: "#191F33" }}>
                    {formatTicketTitle(ticket)}
                  </h2>
                  <p className="text-sm" style={{ color: "#5A6480", marginTop: 6 }}>
                    Criado em {formatDateTime(ticket.createdAt)}
                  </p>
                  {isCompleted && ticket.completedByAdminName ? (
                    <p className="text-sm" style={{ color: "#1F7A4D", marginTop: 4 }}>
                      Concluído por {ticket.completedByAdminName}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-start gap-3">
                  <span
                    className="text-[12px] font-medium"
                    style={{
                      color: isCompleted ? "#1F7A4D" : "#7A4E00",
                      border: isCompleted ? "1px solid #A7E3C5" : "1px solid #FFD7AD",
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: isCompleted ? "#E5F4ED" : "#FFF2E0",
                    }}
                  >
                    {isCompleted ? "Concluído" : "Em andamento"}
                  </span>
                  <span
                    className="text-[12px] font-medium"
                    style={{
                      color: isCompleted ? "#2E8B57" : "#5A6480",
                      border: isCompleted ? "1px solid #A7E3C5" : "1px solid #E2E8F8",
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: isCompleted ? "#E5F4ED" : "#F8FAFF",
                    }}
                  >
                    {formatTypeLabel(ticket.type)}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="space-y-4">
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: isCompleted ? "#A7E3C5" : "#E2E8F8",
                      background: isCompleted ? "#F4FBF7" : "#FFFFFF",
                    }}
                  >
                    <div
                      className="text-xs tracking-wide"
                      style={{ color: isCompleted ? "#2E8B57" : "#5A6480" }}
                    >
                      Motivo
                    </div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: isCompleted ? "#1F7A4D" : "#191F33", marginTop: 6 }}
                    >
                      {ticket.reason || ticket.problemType || "Não informado"}
                    </div>
                  </div>
                  <div
                    className="rounded-2xl border p-6"
                    style={{
                      borderColor: isCompleted ? "#A7E3C5" : "#C7D7FF",
                      background: isCompleted ? "#E8F7EF" : "#F1F6FF",
                    }}
                  >
                    <div
                      className="text-xs tracking-wide"
                      style={{ color: isCompleted ? "#2E8B57" : "#3D4C72" }}
                    >
                      Descrição
                    </div>
                    <div
                      className="text-[15px] leading-6"
                      style={{
                        color: isCompleted ? "#1F7A4D" : "#191F33",
                        marginTop: 12,
                        fontWeight: 500,
                      }}
                    >
                      {ticket.description ||
                        ticket.reasonDescription ||
                        ticket.problemDescription ||
                        "Sem descrição."}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: isCompleted ? "#A7E3C5" : "#E2E8F8",
                      background: isCompleted ? "#F4FBF7" : "#FFFFFF",
                    }}
                  >
                    <div
                      className="text-xs tracking-wide"
                      style={{ color: isCompleted ? "#2E8B57" : "#5A6480" }}
                    >
                      Reportado por
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        aria-hidden
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: isCompleted ? "#E5F4ED" : "#F3F0FF",
                          border: isCompleted ? "1px solid #A7E3C5" : "1px solid #D4C7FF",
                          display: "grid",
                          placeItems: "center",
                          color: isCompleted ? "#1F7A4D" : "#6B4DB8",
                          fontWeight: 600,
                        }}
                      >
                        {(ticket.reporterName || ticket.tutorName || "U")
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                      <div>
                        {reporterProfileHref ? (
                          <Link
                            href={reporterProfileHref}
                            className="text-sm font-medium cursor-pointer hover:underline"
                            style={{ color: isCompleted ? "#1F7A4D" : "#191F33" }}
                          >
                            {ticket.reporterName || ticket.tutorName || "Usuário"}
                          </Link>
                        ) : (
                          <div
                            className="text-sm font-medium"
                            style={{ color: isCompleted ? "#1F7A4D" : "#191F33" }}
                          >
                            {ticket.reporterName || ticket.tutorName || "Usuário"}
                          </div>
                        )}
                        <div
                          className="text-xs"
                          style={{ color: isCompleted ? "#2E8B57" : "#5A6480" }}
                        >
                          {ticket.tutorName ? "Tutor" : "Usuário"}
                        </div>
                      </div>
                    </div>
                  </div>
                  {ticket.type === "user_report" || ticket.type === "tutor_user_report" ? (
                    <div
                      className="rounded-2xl border p-5"
                      style={{
                        borderColor: isCompleted ? "#A7E3C5" : "#E2E8F8",
                        background: isCompleted ? "#F4FBF7" : "#FFFFFF",
                      }}
                    >
                      <div
                        className="text-xs tracking-wide"
                        style={{ color: isCompleted ? "#2E8B57" : "#5A6480" }}
                      >
                        Reportado
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div
                          aria-hidden
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: isCompleted ? "#E5F4ED" : "#F3F0FF",
                            border: isCompleted ? "1px solid #A7E3C5" : "1px solid #D4C7FF",
                            display: "grid",
                            placeItems: "center",
                            color: isCompleted ? "#1F7A4D" : "#6B4DB8",
                            fontWeight: 600,
                          }}
                        >
                          {(ticket.reportedName || ticket.reportedCodinome || "U")
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                        <div>
                          {reportedProfileHref ? (
                            <Link
                              href={reportedProfileHref}
                              className="text-sm font-medium cursor-pointer hover:underline"
                              style={{ color: isCompleted ? "#1F7A4D" : "#191F33" }}
                            >
                              {ticket.reportedName || ticket.reportedCodinome || "Usuário"}
                            </Link>
                          ) : (
                            <div
                              className="text-sm font-medium"
                              style={{ color: isCompleted ? "#1F7A4D" : "#191F33" }}
                            >
                              {ticket.reportedName || ticket.reportedCodinome || "Usuário"}
                            </div>
                          )}
                          <div
                            className="text-xs"
                            style={{ color: isCompleted ? "#2E8B57" : "#5A6480" }}
                          >
                            Perfil denunciado
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setPendingAction(ticket.status === "completed" ? "reopen" : "conclude")
              }
              disabled={actionLoading}
              className="mt-6 w-full rounded-xl text-base font-semibold cursor-pointer"
              style={{
                padding: "14px 16px",
                background: ticket.status === "completed" ? "#F1F6FF" : "#1F7A4D",
                color: ticket.status === "completed" ? "#2E3A59" : "#FFFFFF",
                border: ticket.status === "completed" ? "1px solid #AFC3FF" : "none",
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              {ticket.status === "completed"
                ? "Reabrir ticket"
                : actionLoading
                  ? "Concluindo..."
                  : "Concluir ticket"}
            </button>
            <div
              className="mt-6 rounded-2xl border p-6"
              style={{
                borderColor: isCompleted ? "#A7E3C5" : "#E2E8F8",
                background: isCompleted ? "#F4FBF7" : "#FFFFFF",
              }}
            >
              <div
                className="text-sm font-medium"
                style={{ color: isCompleted ? "#1F7A4D" : "#191F33" }}
              >
                Resposta
              </div>
              {ticket.replyMessage ? (
                <div className="mt-3 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "#D0D9F1" }}>
                  <div className="text-xs" style={{ color: "#5A6480" }}>
                    {ticket.repliedByAdminName
                      ? `Respondido por ${ticket.repliedByAdminName}`
                      : "Resposta do admin"}
                    {ticket.repliedAt ? ` · ${formatDateTime(ticket.repliedAt)}` : ""}
                  </div>
                  <div className="mt-2" style={{ color: "#191F33", whiteSpace: "pre-wrap" }}>
                    {ticket.replyMessage}
                  </div>
                </div>
              ) : null}
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Escreva uma resposta para este ticket"
                rows={4}
                className="mt-3 w-full resize-none rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: isCompleted ? "#A7E3C5" : "#D0D9F1",
                  background: isCompleted ? "#E8F7EF" : "#F8FAFF",
                  color: "#191F33",
                }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={replyLoading || replyText.trim().length === 0}
                  className="rounded-lg px-5 py-2 text-sm font-semibold"
                  style={{
                    background:
                      replyLoading || replyText.trim().length === 0 ? "#E2E8F8" : "#1F7A4D",
                    color: replyLoading || replyText.trim().length === 0 ? "#7682A5" : "#FFFFFF",
                    cursor:
                      replyLoading || replyText.trim().length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {replyLoading ? "Enviando..." : "Enviar resposta"}
                </button>
              </div>
              {replyStatus === "sent" ? (
                <p className="mt-3 text-sm" style={{ color: "#1F7A4D" }}>
                  Resposta enviada com sucesso.
                </p>
              ) : null}
              {replyStatus === "error" ? (
                <p className="mt-3 text-sm" style={{ color: "#C53030" }}>
                  Não foi possível enviar a resposta. Tente novamente.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <Modal
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        title={pendingAction === "reopen" ? "Reabrir ticket" : "Concluir ticket"}
        subtitle={
          pendingAction === "reopen"
            ? "Deseja reabrir este ticket?"
            : "Deseja concluir este ticket?"
        }
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm"
              style={{ borderColor: "#D0D9F1", color: "#191F33" }}
              onClick={() => setPendingAction(null)}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm text-white"
              style={{
                background: pendingAction === "reopen" ? "#2E3A59" : "#256740",
                opacity: actionLoading ? 0.7 : 1,
              }}
              onClick={handleConfirmAction}
              disabled={actionLoading}
            >
              {actionLoading ? "Processando..." : "Confirmar"}
            </button>
          </div>
        }
      >
        <p className="text-sm" style={{ color: "#5A6480" }}>
          {pendingAction === "reopen"
            ? "O ticket voltará para em andamento."
            : "O ticket será marcado como concluído."}
        </p>
      </Modal>
    </main>
  );
}


