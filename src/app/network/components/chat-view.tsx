import { useEffect, useMemo, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCClient } from "agora-rtc-sdk-ng";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronLeft, CircleEllipsis, SendHorizontal, User } from "lucide-react";
import { invokeFunction } from "@/services/api";

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID ?? import.meta.env.AGORA_APP_ID;

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
}: ChatViewProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);

  const visibleParticipants = useMemo(() => participants.slice(0, 3), [participants]);
  const extraParticipants = participants.length - visibleParticipants.length;

  const handleSend = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed);
    setDraftMessage("");
  };

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!roomId || !AGORA_APP_ID) return;
    let cancelled = false;

    const cleanup = async () => {
      const client = agoraClientRef.current;
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
    };

    const joinAgora = async () => {
      await cleanup();
      try {
        const rawToken = localStorage.getItem("token");
        const payload = decodeJwtPayload(rawToken);
        const uid = toNumericUid(
          payload?.sub ?? payload?.user_id ?? payload?.userId ?? payload?.id ?? rawToken,
        );
        const channelName = `room-${roomId}`;
        const tokenResponse = await invokeFunction("agora-token", {
          method: "POST",
          body: { channelName, uid },
        });
        const token = tokenResponse?.token ?? null;
        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        client.setClientRole("audience");
        client.on("user-published", async (user, mediaType) => {
          if (mediaType !== "audio") return;
          await client.subscribe(user, mediaType);
          user.audioTrack?.play();
        });
        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType !== "audio") return;
          user.audioTrack?.stop();
        });
        await client.join(AGORA_APP_ID, channelName, token, uid);
        if (cancelled) {
          await client.leave();
          return;
        }
        agoraClientRef.current = client;
      } catch {
        // ignore agora join errors
      }
    };

    void joinAgora();

    return () => {
      cancelled = true;
      void cleanup();
    };
  }, [roomId]);

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

          <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
            <span className="text-xs font-medium text-[#6B6F85]">
              {participants.length} online
            </span>
            <button
              onClick={onMoreOptions}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F8] bg-white text-[#6B6F85]"
              aria-label="Mais opcoes"
            >
              <CircleEllipsis className="h-5 w-5" />
            </button>
          </div>
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
                    <p className="mt-2 leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-xs text-[#7A7396]">{message.time}</span>
                </div>
              );
            })}
          </div>
        </section>

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
      </div>
    </main>
  );
}



