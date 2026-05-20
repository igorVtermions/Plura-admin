import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import AgoraRTC, { type IAgoraRTCClient, type IAgoraRTCRemoteUser, type IRemoteAudioTrack } from "agora-rtc-sdk-ng";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { ChevronLeft, CircleEllipsis, Download, Ear, Eye, FileText, SendHorizontal, Trash2, User, Volume2, X } from "lucide-react";
import { invokeFunction } from "@/services/api";

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID ?? import.meta.env.AGORA_APP_ID;
type AudioMonitorStatus = "idle" | "connecting" | "ready" | "listening" | "blocked" | "error";

const decodeJwtPayload = (token?: string | null) => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const raw = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = raw.padEnd(raw.length + (4 - (raw.length % 4 || 4)), "=");
  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const toNumericUid = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const str = String(value ?? "");
  if (!str) return Math.floor(Math.random() * 900000000) + 1;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (hash % 900000000) + 1;
};

export type Participant = {
  id: string;
  name: string;
  avatarUrl: string;
  role?: string;
};

export type RoomOwner = {
  name: string;
  avatarUrl: string;
  subtitle?: string;
};

export type ChatMessage = {
  id: string;
  senderName: string;
  content: string;
  time: string;
  type: "incoming" | "outgoing";
  isTutor?: boolean;
  isAdmin?: boolean;
  isDeleted?: boolean;
  senderUid?: string | null;
  userId?: string | null;
  userPhotoUrl?: string | null;
  userStatus?: string | null;
  attachments?: Array<{
    url: string;
    name: string;
    mimeType?: string | null;
    type: "image" | "pdf" | "file";
  }>;
};

interface ChatViewProps {
  roomId?: string;
  roomTitle: string;
  roomSubtitle: string;
  owner: RoomOwner;
  participants: Participant[];
  messages: ChatMessage[];
  onBack?: () => void;
  onMoreOptions?: () => void;
  onSendMessage?: (message: string) => void;
  onDeleteMessage?: (message: ChatMessage) => Promise<void> | void;
  onViewUser?: (message: ChatMessage) => void;
  canSendMessage?: boolean;
  showHeaderActions?: boolean;
}

export function ChatView({
  roomId,
  roomTitle,
  roomSubtitle,
  owner,
  participants,
  messages,
  onBack,
  onMoreOptions,
  onSendMessage,
  onDeleteMessage,
  onViewUser,
  canSendMessage = true,
  showHeaderActions = true,
}: ChatViewProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: ChatMessage;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioMonitorStatus>("idle");
  const [audioError, setAudioError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const remoteAudioTracksRef = useRef<IRemoteAudioTrack[]>([]);

  const visibleParticipants = useMemo(() => participants.slice(0, 3), [participants]);
  const extraParticipants = participants.length - visibleParticipants.length;
  const audioStatusLabel =
    audioStatus === "connecting"
      ? "Conectando audio"
      : audioStatus === "listening"
      ? "Escutando sala"
      : audioStatus === "blocked"
      ? "Audio bloqueado"
      : audioStatus === "error"
      ? "Falha no audio"
      : "Aguardando audio";

  const handleSend = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed);
    setDraftMessage("");
  };

  const playRemoteAudioTracks = () => {
    let played = 0;
    remoteAudioTracksRef.current.forEach((track) => {
      try {
        track.play();
        played += 1;
      } catch (error) {
        console.warn("Agora audio play failed", error);
      }
    });
    if (played > 0) setAudioStatus("listening");
  };

  const handleActivateAudio = async () => {
    try {
      await (AgoraRTC as unknown as { resumeAudioContext?: () => Promise<void> }).resumeAudioContext?.();
      playRemoteAudioTracks();
      setAudioStatus(remoteAudioTracksRef.current.length > 0 ? "listening" : "ready");
      setAudioError(null);
    } catch (error) {
      console.warn("Agora audio activation failed", error);
      setAudioStatus("blocked");
      setAudioError("Clique novamente para ativar o audio da sala.");
    }
  };

  const openMessageMenu = (event: MouseEvent, message: ChatMessage) => {
    if (!onDeleteMessage && !onViewUser) return;
    if (message.isDeleted && !message.userId) return;
    event.preventDefault();
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 180),
      y: Math.min(event.clientY, window.innerHeight - 72),
      message,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDeleteMessage) return;
    setDeleteLoading(true);
    try {
      await onDeleteMessage(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!canSendMessage || !roomId) return;
    if (!AGORA_APP_ID) {
      setAudioStatus("error");
      setAudioError("AGORA_APP_ID nao configurado no admin web.");
      return;
    }
    let cancelled = false;

    const cleanup = async () => {
      const client = agoraClientRef.current;
      remoteAudioTracksRef.current.forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      remoteAudioTracksRef.current = [];
      if (!client) return;
      try {
        client.removeAllListeners();
      } catch {
        // ignore
      }
      try {
        await client.leave();
      } catch {
        // ignore
      }
      agoraClientRef.current = null;
      setAudioStatus("idle");
    };

    const subscribeRemoteAudio = async (client: IAgoraRTCClient, user: IAgoraRTCRemoteUser) => {
      try {
        await client.subscribe(user, "audio");
        if (!user.audioTrack) return;
        remoteAudioTracksRef.current = [
          ...remoteAudioTracksRef.current.filter((track) => track !== user.audioTrack),
          user.audioTrack,
        ];
        try {
          user.audioTrack.play();
          setAudioStatus("listening");
          setAudioError(null);
        } catch (error) {
          console.warn("Agora autoplay blocked or audio play failed", error);
          setAudioStatus("blocked");
          setAudioError("Clique em Ativar audio para escutar a sala.");
        }
      } catch (error) {
        console.warn("Agora subscribe audio failed", error);
        setAudioStatus("error");
        setAudioError("Falha ao assinar audio remoto.");
      }
    };

    const joinAgora = async () => {
      await cleanup();
      try {
        setAudioStatus("connecting");
        setAudioError(null);
        const rawToken = localStorage.getItem("token");
        const payload = decodeJwtPayload(rawToken);
        const uid = toNumericUid(
          payload?.sub ?? payload?.user_id ?? payload?.userId ?? payload?.id ?? rawToken,
        );
        const channelName = `room-${roomId}`;
        const tokenResponse = await invokeFunction<{ token?: string | null }>("agora-token", {
          method: "POST",
          body: { channelName, uid, role: "audience" },
        });
        const token = tokenResponse?.token ?? null;
        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        client.setClientRole("audience");
        client.on("user-published", async (user, mediaType) => {
          if (mediaType !== "audio") return;
          await subscribeRemoteAudio(client, user);
        });
        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType !== "audio") return;
          user.audioTrack?.stop();
          remoteAudioTracksRef.current = remoteAudioTracksRef.current.filter(
            (track) => track !== user.audioTrack,
          );
          if (remoteAudioTracksRef.current.length === 0) setAudioStatus("ready");
        });
        await client.join(AGORA_APP_ID, channelName, token, uid);
        if (cancelled) {
          await client.leave();
          return;
        }
        agoraClientRef.current = client;
        setAudioStatus("ready");
        await Promise.all(
          client.remoteUsers
            .filter((user) => Boolean(user.hasAudio))
            .map((user) => subscribeRemoteAudio(client, user)),
        );
      } catch (error) {
        console.warn("Agora join failed", error);
        setAudioStatus("error");
        setAudioError("Falha ao conectar no audio da sala.");
      }
    };

    void joinAgora();

    return () => {
      cancelled = true;
      void cleanup();
    };
  }, [canSendMessage, roomId]);

  return (
    <main className="mx-auto w-full max-w-[1100px] overflow-x-hidden text-md">
      <header className="mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F8] text-[#5A6480] hover:bg-[#F4F6FF]"
          aria-label="Voltar para lista de chats"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-[#1F1235] sm:text-xl">{roomTitle}</h1>
          <p className="text-sm text-[#7A7396]">{roomSubtitle}</p>
        </div>
      </header>

      <div className="flex h-[calc(100vh-220px)] min-h-[520px] max-h-[740px] flex-col rounded-2xl sm:rounded-3xl border border-[#E6EBFA] bg-white shadow-[0px_24px_60px_rgba(53,18,87,0.08)]">
        <section className="flex flex-col items-start justify-between gap-4 rounded-t-2xl sm:rounded-t-3xl border-b border-[#E6EBFA] bg-[#F9FAFF] px-4 py-4 sm:px-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-[#EEF1FF]">
              {owner.avatarUrl && owner.avatarUrl !== "/UserCircle.svg" ? (
                <Image
                  src={owner.avatarUrl}
                  alt={owner.name}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center text-[#191F33]">
                  <User className="h-5 w-5" aria-hidden />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#191F33]">{owner.name}</p>
              {owner.subtitle && <p className="text-xs text-[#7A7396]">{owner.subtitle}</p>}
            </div>
          </div>

          {showHeaderActions && (
            <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-medium text-[#6B6F85]">
                  {participants.length} online
                </span>
                <button
                  type="button"
                  onClick={handleActivateAudio}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    audioStatus === "listening"
                      ? "bg-[#E8F7EF] text-[#256740]"
                      : audioStatus === "error" || audioStatus === "blocked"
                      ? "bg-[#FFF1F1] text-[#C53030]"
                      : "bg-[#EEF2FF] text-[#6B4DB8]",
                  )}
                  title={audioError ?? audioStatusLabel}
                >
                  {audioStatus === "listening" ? (
                    <Volume2 className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Ear className="h-3.5 w-3.5" aria-hidden />
                  )}
                  <span>{audioStatus === "idle" || audioStatus === "ready" ? "Ativar audio" : audioStatusLabel}</span>
                </button>
              </div>
              <button
                onClick={onMoreOptions}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F8] bg-white text-[#6B6F85]"
                aria-label="Mais opcoes"
              >
                <CircleEllipsis className="h-5 w-5" />
              </button>
            </div>
          )}
        </section>

        <section className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
          <div ref={messagesRef} className="flex-1 space-y-6 overflow-y-auto pr-1 sm:pr-2">
            {messages.map((message, index) => {
              const isOutgoing = message.type === "outgoing";
              const previousMessage = index > 0 ? messages[index - 1] : undefined;
              const previousSender =
                previousMessage?.senderName?.trim().toLowerCase() ?? "";
              const currentSender =
                message.senderName?.trim().toLowerCase() ?? "";
              const previousTutor = Boolean(previousMessage?.isTutor);
              const currentTutor = Boolean(message.isTutor);
              const showSenderName =
                !previousMessage ||
                previousMessage.type !== message.type ||
                previousSender !== currentSender ||
                previousTutor !== currentTutor;
              const isAdminMessage = Boolean(message.isAdmin);
              const tutorName = owner.name?.trim().toLowerCase();
              const senderName = message.senderName?.trim().toLowerCase();
              const matchesOwner =
                tutorName && senderName && tutorName === senderName;
              const isTutorMessage =
                !isAdminMessage && !isOutgoing && (message.isTutor || matchesOwner);
              const displaySenderName = message.senderName?.trim()
                ? message.senderName
                : isTutorMessage
                ? owner.name
                : "Usuario";
              return (
                <div
                  key={message.id}
                  className={cn("flex w-full flex-col gap-2", isOutgoing ? "items-end" : "items-start")}
                >
                  <div
                    onContextMenu={(event) => openMessageMenu(event, message)}
                    className={cn(
                      "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                      isAdminMessage
                        ? "bg-[#2F9E44] text-white"
                        : isOutgoing
                        ? "bg-[#8F76E8] text-white"
                        : isTutorMessage
                        ? "bg-[#2F6BFF] text-white"
                        : "bg-[#FFF2E0] text-[#191F33]",
                    )}
                  >
                    {showSenderName && (
                      <span
                        className={cn(
                          isTutorMessage
                            ? "text-[12px] font-semibold text-white/80"
                            : "text-[11px] font-semibold tracking-wide",
                          isAdminMessage
                            ? "text-white/80"
                            : isOutgoing
                            ? "text-white/80"
                            : isTutorMessage
                            ? "text-white/80"
                            : "text-[#A05D0B]",
                        )}
                      >
                        {isAdminMessage
                          ? isOutgoing
                            ? "Você - Admin"
                            : `${displaySenderName} - Admin`
                          : isTutorMessage
                          ? `${displaySenderName} - tutor`
                          : isOutgoing
                          ? "Você"
                          : displaySenderName}
                      </span>
                    )}
                    {message.content.trim() && (
                      <p className="mt-2 leading-relaxed">{message.content}</p>
                    )}
                    {!message.isDeleted && message.attachments && message.attachments.length > 0 && (
                      <div className={cn("space-y-2", message.content.trim() ? "mt-3" : "mt-2")}>
                        {message.attachments.map((attachment) => {
                          if (attachment.type === "image") {
                            return (
                              <button
                                key={attachment.url}
                                type="button"
                                onClick={() => setPreviewImage({ url: attachment.url, name: attachment.name })}
                                className="block overflow-hidden rounded-xl bg-black/5"
                                aria-label={`Abrir imagem ${attachment.name}`}
                              >
                                <Image
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="max-h-72 w-full min-w-[180px] object-cover"
                                  loading="lazy"
                                />
                              </button>
                            );
                          }

                          return (
                            <a
                              key={attachment.url}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className={cn(
                                "flex min-w-[220px] items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                                isAdminMessage || isOutgoing || isTutorMessage
                                  ? "border-white/25 bg-white/10 text-white hover:bg-white/15"
                                  : "border-[#F1C98F] bg-white/70 text-[#191F33] hover:bg-white",
                              )}
                            >
                              <span
                                className={cn(
                                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                                  isAdminMessage || isOutgoing || isTutorMessage
                                    ? "bg-white/15"
                                    : "bg-[#FFF2E0]",
                                )}
                                aria-hidden
                              >
                                <FileText className="h-5 w-5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {attachment.name || (attachment.type === "pdf" ? "PDF" : "Arquivo")}
                                </span>
                                <span
                                  className={cn(
                                    "block text-xs",
                                    isAdminMessage || isOutgoing || isTutorMessage
                                      ? "text-white/75"
                                      : "text-[#8A5A1D]",
                                  )}
                                >
                                  {attachment.type === "pdf" ? "PDF" : "Arquivo"}
                                </span>
                              </span>
                              <Download className="h-4 w-4 shrink-0" aria-hidden />
                            </a>
                          );
                        })}
                      </div>
                    )}
                    {!message.content.trim() && (!message.attachments || message.attachments.length === 0) && (
                      <p className="mt-2 leading-relaxed opacity-80">Mensagem sem conteudo</p>
                    )}
                  </div>
                  <span className="text-xs text-[#7A7396]">{message.time}</span>
                </div>
              );
            })}
          </div>
        </section>

        {canSendMessage && (
        <div className="rounded-b-2xl sm:rounded-b-3xl border-t border-[#E6EBFA] bg-[#F9FAFF] px-4 py-4 sm:px-6">
          <form
            className="flex items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <Input
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder="Digite aqui..."
              className="h-12 flex-1 rounded-xl border border-[#D0D9F1] bg-white px-4 text-sm text-[#1F1235] placeholder:text-[#A09BBF]"
            />
            <Button
              type="submit"
              className="h-12 w-12 rounded-xl bg-[#8F76E8] p-0 text-white hover:bg-[#8066DD]"
            >
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </form>
        </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed z-[90] w-[168px] rounded-xl border border-[#E2E8F8] bg-white p-2 text-sm text-[#191F33] shadow-[0px_18px_32px_rgba(63,85,199,0.16)]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
          role="menu"
          aria-label="Opcoes da mensagem"
        >
          {onViewUser && (contextMenu.message.userId || contextMenu.message.senderUid) && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#2B1F58] hover:bg-[#F4F6FF]"
              onClick={() => {
                onViewUser(contextMenu.message);
                setContextMenu(null);
              }}
              role="menuitem"
            >
              <Eye className="h-4 w-4" aria-hidden />
              <span>Ver perfil</span>
            </button>
          )}
          {onDeleteMessage && !contextMenu.message.isDeleted && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[#C53030] hover:bg-[#FFF1F1]"
              onClick={() => {
                setDeleteTarget(contextMenu.message);
                setContextMenu(null);
              }}
              role="menuitem"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              <span>Apagar</span>
            </button>
          )}
        </div>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null);
        }}
        title="Apagar mensagem?"
        subtitle="Essa mensagem será marcada como apagada para todos na sala."
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
              className="rounded-md border border-[#D0D9F1] bg-white px-4 py-2 text-sm font-medium text-[#344054] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="rounded-md bg-[#C53030] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {deleteLoading ? "Apagando..." : "Apagar"}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[#344054]">
          Confirme para remover o conteúdo da mensagem e ocultar anexos como imagens e PDFs.
        </p>
      </Modal>

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview da imagem ${previewImage.name}`}
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-white">
              <div className="min-w-0 truncate text-sm font-medium">{previewImage.name}</div>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  download
                  className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                  aria-label="Baixar imagem"
                >
                  <Download className="h-5 w-5" aria-hidden />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                  aria-label="Fechar preview"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
            <div className="flex max-h-[82vh] items-center justify-center overflow-hidden rounded-xl bg-black/20">
              <Image
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[82vh] max-w-full object-contain"
                loading="eager"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}



