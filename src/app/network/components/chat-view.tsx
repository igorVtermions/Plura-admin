import { useMemo, useState } from "react";
import Image from "@/components/ui/Image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronLeft, CircleEllipsis, SendHorizontal } from "lucide-react";

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
};

interface ChatViewProps {
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

  const visibleParticipants = useMemo(() => participants.slice(0, 3), [participants]);
  const extraParticipants = participants.length - visibleParticipants.length;

  const handleSend = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed);
    setDraftMessage("");
  };

  return (
    <main className="-translate-y-7 text-md w-full max-w-[1100px] mx-auto">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E0D7FF] bg-[#F7F9FF] text-[#4C2A7A] transition-transform hover:-translate-y-0.5"
            aria-label="Voltar para lista de chats"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-[#1F1235] text-2xl font-bold">{roomTitle}</h1>
            <p className="text-sm font-medium uppercase tracking-wide text-[#7A7396]">
              {roomSubtitle}
            </p>
          </div>
        </div>
      </header>
      <div className="flex h-full flex-col rounded-3xl border border-[#E2E8F8] bg-white p-0 shadow-[0px_24px_60px_rgba(53,18,87,0.08)]">
        <section className="flex flex-col gap-6 rounded-t-3xl bg-[#E2E8F8] p-4 text-[#1F1235] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-[#E2D5FF] bg-white">
              <Image
                src={owner.avatarUrl || "/UserCircle.svg"}
                alt={owner.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-wide text-[#7A7396]">Host da sala</p>
              <p className="text-xl font-semibold">{owner.name}</p>
              {owner.subtitle && <p className="text-sm text-[#6F6C80]">{owner.subtitle}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {visibleParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-[#EEEAFD]"
                  >
                    <Image
                      src={participant.avatarUrl || "/UserCircle.svg"}
                      alt={participant.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {extraParticipants > 0 && (
                <span className="text-sm font-normal text-[#4C2A7A]">
                  +{participants.length} Online
                </span>
              )}
              <button
                onClick={onMoreOptions}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E0D7FF] bg-white text-[#4C2A7A]"
                aria-label="Mais opções"
              >
                <CircleEllipsis className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col p-4">
          <div className="space-y-6 overflow-y-auto pr-2" style={{ maxHeight: 420 }}>
            {messages.map((message, index) => {
              const isOutgoing = message.type === "outgoing";
              const previousMessage = index > 0 ? messages[index - 1] : undefined;
              const showSenderName = !previousMessage || previousMessage.type !== message.type;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full flex-col gap-2",
                    isOutgoing ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-[26px] px-5 py-4 text-sm shadow-sm",
                      isOutgoing
                        ? "bg-[#977cec] text-white rounded-br-[8px]"
                        : "bg-[#fff2e0] text-[#191f33] rounded-bl-[8px]",
                    )}
                  >
                    {showSenderName && (
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wide",
                          isOutgoing ? "text-white/70" : "text-[#a05d0b]",
                        )}
                      >
                        {isOutgoing ? "Você" : message.senderName}
                      </span>
                    )}
                    <p className="mt-2 leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-xs font-medium text-[#7A7396]">{message.time}</span>
                </div>
              );
            })}
          </div>
        </section>
        <div className="rounded-b-3xl bg-[#E2E8F8] p-4 text-[#1F1235] md:flex-row md:items-center md:justify-between">
          <form
            className="flex flex-col gap-4 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <Input
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder="Escreva uma mensagem"
              className="h-14 rounded-[24px] border border-[#D7D3F3] bg-white px-5 text-base text-[#1F1235] placeholder:text-[#A09BBF]"
            />
            <Button
              type="submit"
              className="h-14 rounded-[24px] bg-[#977cec] px-8 text-base font-semibold text-white hover:bg-[#8a6fdb]"
            >
              Enviar
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
