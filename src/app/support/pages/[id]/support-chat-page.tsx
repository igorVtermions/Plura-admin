"use client";

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Image from "@/components/ui/Image";
import Link from "@/router/Link";
import Modal from "@/components/ui/Modal";
import { supabase } from "@/services/api";
import {
  fetchSupportChatDetail,
  fetchSupportChatMessages,
  sendSupportChatMessage,
  deleteSupportRoom,
  type SupportChatMessage,
  type SupportRoom,
} from "@/services/support";

export const metadata = { title: "Chat de Suporte | Plura Talks - Administrador" };

const POLL_INTERVAL_MS = 1200;
const ROOM_REFRESH_EVERY_POLLS = 4;
const REQUEST_TIMEOUT_MS = 10000;
const INCREMENTAL_LOOKBACK_MS = 2 * 60 * 1000;
const MISSED_INCREMENTAL_BEFORE_DETAIL_REFRESH = 2;

export function SupportChatPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const defaultTitle = id ? `Sala de suporte #${id}` : "Sala de suporte";

  const [room, setRoom] = React.useState<SupportRoom | null>(null);
  const [messages, setMessages] = React.useState<SupportChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [messageDraft, setMessageDraft] = React.useState("");
  const [openUserInfo, setOpenUserInfo] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [resolving, setResolving] = React.useState(false);
  const [resolveError, setResolveError] = React.useState<string | null>(null);
  const messagesScrollRef = React.useRef<HTMLDivElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const latestMessageAtRef = React.useRef<string | null>(null);
  const pollCountRef = React.useRef(0);
  const missedIncrementalRef = React.useRef(0);
  const pullIncrementalRef = React.useRef<(() => Promise<void>) | null>(null);

  React.useEffect(() => {
    let active = true;
    async function loadChat() {
      if (!id) {
        setError("Sala não encontrada.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSupportChatDetail({ id });
        if (!active) return;
        setRoom(data.room ?? null);
        setMessages(data.messages);
        latestMessageAtRef.current = getLatestCreatedAt(data.messages);
        pollCountRef.current = 0;
      } catch {
        if (!active) return;
        setError("Erro ao carregar chat.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadChat();
    return () => {
      active = false;
    };
  }, [id]);

  React.useEffect(() => {
    if (!id || loading) return;
    let active = true;
    let timeoutId: number | null = null;

    const buildSinceCursor = () => {
      const current = latestMessageAtRef.current;
      if (!current) return null;
      const base = new Date(current).getTime();
      if (Number.isNaN(base)) return current;
      return new Date(base - INCREMENTAL_LOOKBACK_MS).toISOString();
    };

    async function pollMessages() {
      if (!active || !id) return;
      try {
        const messagesResult = await withTimeout(
          fetchSupportChatMessages({
            id,
            since: buildSinceCursor(),
            limit: 120,
          }),
          REQUEST_TIMEOUT_MS,
        );

        if (!active || !messagesResult) return;

        if (messagesResult.items.length) {
          missedIncrementalRef.current = 0;
          setMessages((current) => mergeMessages(current, messagesResult.items));
          latestMessageAtRef.current =
            messagesResult.latestCreatedAt || getLatestCreatedAt(messagesResult.items);
        } else {
          missedIncrementalRef.current += 1;
        }

        pollCountRef.current += 1;
        if (
          pollCountRef.current >= ROOM_REFRESH_EVERY_POLLS ||
          missedIncrementalRef.current >= MISSED_INCREMENTAL_BEFORE_DETAIL_REFRESH
        ) {
          pollCountRef.current = 0;
          missedIncrementalRef.current = 0;
          const detail = await withTimeout(fetchSupportChatDetail({ id }), REQUEST_TIMEOUT_MS);
          if (!active || !detail) return;
          setRoom((previous) => detail.room ?? previous ?? null);
          if (detail.messages.length) {
            setMessages((current) => mergeMessages(current, detail.messages));
            latestMessageAtRef.current = getLatestCreatedAt(detail.messages);
          }
        }
      } catch {
        // ignore transient polling failures
      } finally {
        if (!active) return;
        timeoutId = window.setTimeout(pollMessages, POLL_INTERVAL_MS);
      }
    }

    pollMessages();

    return () => {
      active = false;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [id, loading]);
  React.useEffect(() => {
    if (!id || loading || !supabase) return;
    let active = true;
    const channels: any[] = [];

    const buildSinceCursor = () => {
      const current = latestMessageAtRef.current;
      if (!current) return null;
      const base = new Date(current).getTime();
      if (Number.isNaN(base)) return current;
      return new Date(base - INCREMENTAL_LOOKBACK_MS).toISOString();
    };

    const pullIncremental = async () => {
      const result = await withTimeout(
        fetchSupportChatMessages({
          id,
          since: buildSinceCursor(),
          limit: 120,
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (!active || !result || !result.items.length) {
        missedIncrementalRef.current += 1;
        return;
      }

      missedIncrementalRef.current = 0;
      setMessages((current) => mergeMessages(current, result.items));
      latestMessageAtRef.current =
        result.latestCreatedAt || getLatestCreatedAt(result.items) || latestMessageAtRef.current;
    };
    pullIncrementalRef.current = pullIncremental;

    const subscribe = (filter: string, suffix: string) => {
      const channel = supabase
        .channel(`support-message:${id}:${suffix}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "SupportMessage",
            filter,
          },
          () => {
            void pullIncremental();
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void pullIncremental();
          }
        });

      channels.push(channel);
    };

    subscribe(`chatId=eq.${id}`, "chatId");
    subscribe(`chatid=eq.${id}`, "chatid");

    return () => {
      active = false;
      pullIncrementalRef.current = null;
      for (const channel of channels) {
        supabase.removeChannel(channel);
      }
    };
  }, [id, loading]);

  React.useEffect(() => {
    if (!id || loading) return;

    const triggerRefresh = () => {
      const pull = pullIncrementalRef.current;
      if (pull) void pull();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        triggerRefresh();
      }
    };

    const onFocus = () => {
      triggerRefresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [id, loading]);

  const chatTitle = room?.title || defaultTitle;
  const requesterName = room?.requesterName || room?.userName || "Usuário";
  const fallbackNickname = room?.nickname || null;
  const requesterNickname =
    fallbackNickname && fallbackNickname !== requesterName
      ? fallbackNickname
      : room?.userName && room.userName !== requesterName
        ? room.userName
        : null;
  const requesterRoleLabel = room?.isTutor ? "Tutor" : "Usuário";
  const requesterRole = room?.requesterRole || (room?.isTutor ? "Tutor" : null);
  const requesterAbout = room?.description || room?.reason || "Sem descrição disponível.";
  const requesterProfileHref = React.useMemo(() => {
    if (!room?.requesterId) return null;
    if (room.isTutor) return `/instructors/${room.requesterId}`;
    return `/users/${room.requesterId}`;
  }, [room]);
  const showEmptyState = !loading && !error && messages.length === 0;
  const headerDisabled = loading || !room;
  const inputDisabled = headerDisabled || Boolean(error);
  const sendDisabled = inputDisabled || sending || messageDraft.trim().length === 0;

  React.useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  async function handleSendMessage(event?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    if (!id || sendDisabled) return;
    const content = messageDraft.trim();
    if (!content) return;
    try {
      setSending(true);
      setSendError(null);
      const saved = await sendSupportChatMessage({ chatId: id, message: content });
      if (!saved) {
        throw new Error("INVALID_RESPONSE");
      }
      setMessages((current) => [...current, saved]);
      latestMessageAtRef.current = saved.createdAt || latestMessageAtRef.current;
      setMessageDraft("");
    } catch (err) {
      console.error("Erro ao enviar mensagem", err);
      setSendError("Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  async function handleResolveRoom() {
    if (!room?.id) return;
    try {
      setResolving(true);
      setResolveError(null);
      await deleteSupportRoom({ id: room.id });
      setOpenUserInfo(false);
      setRoom(null);
      setMessages([]);
      navigate("/support");
    } catch (err) {
      console.error("Erro ao concluir sala", err);
      setResolveError("Não foi possível marcar como resolvido.");
    } finally {
      setResolving(false);
    }
  }

  return (
    <>
      <main className="p-8 flex-1 overflow-auto md:overflow-auto min-h-0 bg-white">
        <div className="max-w-5xl mx-auto w-full min-h-0">
          <div className="flex items-center gap-5 mb-4">
            <Link
              href="/support"
              aria-label="Voltar para suporte"
              className="inline-flex items-center justify-center rounded-md p-0 m-0 leading-none"
              style={{ lineHeight: 0 }}
            >
              <Image src="/Arrow.svg" alt="Voltar" width={8} height={8} />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-[32px] font-medium" style={{ color: "#191F33" }}>
                {chatTitle}
              </h1>
              <p style={{ color: "#5A6480", fontSize: 16, fontWeight: 400 }}>
                Chat geral relacionado ao tema
              </p>
            </div>
          </div>

          <section
            className="w-full overflow-hidden"
            style={{ border: "1px solid #E2E8F8", borderRadius: 12 }}
          >
            {loading ? (
              <div className="p-6 space-y-5 bg-white">
                <div className="h-10 w-2/3 rounded bg-[#E2E8F8]" />
                <div className="h-[320px] rounded bg-[#F1F5FF]" />
                <div className="h-12 rounded bg-[#E2E8F8]" />
              </div>
            ) : error ? (
              <div
                className="p-4 text-sm"
                style={{ background: "#FFF5F5", color: "#842029", borderTop: "1px solid #F5C2C7" }}
              >
                {error}
              </div>
            ) : room ? (
              <>
                <header
                  className="w-full px-4 py-3 flex items-center justify-between"
                  style={{ background: "#F7F9FF", borderBottom: "1px solid #E2E8F8" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {room.photoUrl ? (
                      <img
                        src={room.photoUrl}
                        alt={requesterName}
                        width={40}
                        height={40}
                        style={{ borderRadius: 8, objectFit: "cover" }}
                      />
                    ) : (
                      <Image
                        src="/User.svg"
                        alt="Avatar"
                        width={40}
                        height={40}
                        style={{ borderRadius: 8 }}
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span style={{ color: "#191F33", fontSize: 14, fontWeight: 500 }}>
                        {requesterName}
                      </span>
                      <span style={{ color: "#5A6480", fontSize: 14, fontWeight: 400 }}>
                        {requesterNickname || requesterRoleLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {requesterProfileHref ? (
                      <Link
                        href={requesterProfileHref}
                        className="text-sm cursor-pointer"
                        style={{ color: "#6B4DB8", fontWeight: 500 }}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver perfil
                      </Link>
                    ) : (
                      <span
                        className="text-sm"
                        style={{ color: "#B6A6E6", fontWeight: 500, cursor: "not-allowed" }}
                      >
                        Ver perfil
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Mais opções"
                      className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => !headerDisabled && setOpenUserInfo(true)}
                      disabled={headerDisabled}
                      style={{
                        padding: 12,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 8,
                        border: "1px solid #D0D9F1",
                        background: "#FFFFFF",
                      }}
                    >
                      <Image src="/DotsThreeCircle.svg" alt="Mais opções" width={18} height={18} />
                    </button>
                  </div>
                </header>

                <div className="p-4" style={{ background: "#FFFFFF" }}>
                  <div
                    ref={messagesScrollRef}
                    className="overflow-y-auto pr-1"
                    style={{ minHeight: 360, maxHeight: 520 }}
                  >
                    <div className="flex flex-col gap-3">
                    {showEmptyState ? (
                      <div
                        className="flex flex-col items-center justify-center text-sm"
                        style={{ color: "#5A6480", minHeight: 200 }}
                      >
                        Nenhuma mensagem registrada nesta sala.
                      </div>
                    ) : (
                      messages.map((message) => {
                        const adminMessage = isAdminMessage(message);
                        const timeLabel = formatMessageTime(message.createdAt);
                        if (adminMessage) {
                          return (
                            <div
                              key={message.id}
                              className="self-end flex flex-col items-end gap-2"
                              style={{ maxWidth: "75%", marginLeft: "auto", width: "fit-content" }}
                            >
                              <div
                                className="rounded-md text-white text-sm"
                                style={{
                                  background: "#977CEC",
                                  padding: 10,
                                  display: "inline-flex",
                                  flexDirection: "column",
                                  maxWidth: "100%",
                                }}
                              >
                                <div style={{ fontWeight: 600 }}>
                                  {message.senderName || "Você"}
                                </div>
                                <div style={{ marginTop: 2 }}>{message.content}</div>
                              </div>
                              <div className="text-[12px]" style={{ color: "#5A6480" }}>
                                {timeLabel}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={message.id}
                            className="max-w-[75%]"
                            style={{ color: "#191F33", width: "fit-content" }}
                          >
                            <div
                              className="rounded-md"
                              style={{
                                background: "#FFF6EB",
                                border: "1px solid #FFD7AD",
                                padding: 12,
                                display: "inline-flex",
                                flexDirection: "column",
                                maxWidth: "100%",
                              }}
                            >
                              <div className="text-sm" style={{ fontWeight: 600 }}>
                                {message.senderName || requesterName}
                              </div>
                              <div className="text-sm" style={{ marginTop: 4 }}>
                                {message.content}
                              </div>
                            </div>
                            <div className="text-[12px] mt-2" style={{ color: "#5A6480" }}>
                              {timeLabel}
                            </div>
                          </div>
                        );
                      })
                    )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>

                <div
                  className="px-4 py-3"
                  style={{ borderTop: "1px solid #E2E8F8", background: "#F7F9FF" }}
                >
                  <form className="w-full flex items-center gap-3" onSubmit={handleSendMessage}>
                    <div
                      className="flex-1 rounded-md bg-white"
                      style={{ border: "1px solid #E2E8F8", padding: "10px 12px" }}
                    >
                      <input
                        type="text"
                        placeholder="Digite aqui..."
                        className="w-full outline-none bg-transparent"
                        style={{ fontSize: 14, color: "#191F33" }}
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        disabled={inputDisabled}
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: sendDisabled ? "#C7B9F3" : "#977CEC",
                        width: 44,
                        height: 44,
                        display: "grid",
                        placeItems: "center",
                      }}
                      aria-label="Enviar"
                      disabled={sendDisabled}
                    >
                      <Image src="/SendMensage.svg" alt="Enviar" width={18} height={18} />
                    </button>
                  </form>
                  {sendError ? (
                    <p className="text-xs mt-2" style={{ color: "#C53030" }}>
                      {sendError}
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="p-4 text-sm" style={{ color: "#5A6480", background: "#FFFFFF" }}>
                Sala não encontrada ou sem dados disponíveis.
              </div>
            )}
          </section>
        </div>
      </main>

      <Modal
        open={openUserInfo}
        onClose={() => setOpenUserInfo(false)}
        title="Informações da sala"
        modalStyle={{}}
        maxWidth="max-w-xl"
      >
        {room ? (
          <div
            className="rounded-lg"
            style={{ background: "#F3F0FF", border: "1px solid #D4C7FF" }}
          >
            <div className="p-4">
              <div className="mb-3">
                <div className="text-sm font-medium" style={{ color: "#191F33" }}>
                  Nome do usuário
                </div>
                <div className="text-sm" style={{ color: "#191F33" }}>
                  {requesterName}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: "#191F33" }}>
                  Sobre
                </div>
                <div className="text-sm" style={{ color: "#191F33" }}>
                  {requesterAbout}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg p-4 text-sm"
            style={{ background: "#F8F9FF", border: "1px solid #E2E8F8", color: "#5A6480" }}
          >
            Nenhuma informação disponível no momento.
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            className="w-full rounded-md text-white cursor-pointer"
            style={{ background: resolving ? "#C7B9F3" : "#977CEC", padding: "12px 16px", fontWeight: 500, opacity: resolving ? 0.8 : 1 }}
            onClick={handleResolveRoom}
            disabled={resolving}
          >
            {resolving ? "Finalizando..." : "Marcar como resolvido"}
          </button>
          {resolveError ? (
            <p className="mt-2 text-sm" style={{ color: "#C53030" }}>
              {resolveError}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

function formatMessageTime(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function isAdminMessage(message: SupportChatMessage) {
  const role = (message.senderRole || "").toLowerCase();
  if (!role) return false;
  return role.includes("admin") || role.includes("support");
}

function mergeMessages(
  current: SupportChatMessage[],
  incoming: SupportChatMessage[],
): SupportChatMessage[] {
  if (!incoming || incoming.length === 0) return current;
  const map = new Map<string, SupportChatMessage>();
  for (const message of current) {
    if (message?.id) {
      map.set(message.id, message);
    }
  }
  for (const message of incoming) {
    if (message?.id) {
      map.set(message.id, message);
    }
  }
  const merged = Array.from(map.values());
  merged.sort((a, b) => compareTimestamps(a.createdAt, b.createdAt));
  return merged;
}

function compareTimestamps(a: string | null, b: string | null) {
  const timeA = a ? new Date(a).getTime() : 0;
  const timeB = b ? new Date(b).getTime() : 0;
  return timeA - timeB;
}

function getLatestCreatedAt(messages: SupportChatMessage[]): string | null {
  if (!messages || messages.length === 0) return null;
  const sorted = [...messages].sort((a, b) => compareTimestamps(a.createdAt, b.createdAt));
  return sorted[sorted.length - 1]?.createdAt ?? null;
}







async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return await Promise.race([
    promise,
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}




