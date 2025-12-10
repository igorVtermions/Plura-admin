import Image from "@/components/ui/Image";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ChatCard } from "../components/chat-card";
import { Pagination } from "../components/pagination";
import {
  ChatMessage,
  ChatView,
  Participant,
} from "../components/chat-view";

type ChatRoom = {
  title: string;
  instructor: string;
  onlineCount: number;
};

const chatRooms: ChatRoom[] = Array.from({ length: 50 }, (_, index) => ({
  title: `Como tratar a ansiedade ${index + 1}`,
  instructor: "Mateus Silva",
  onlineCount: 32,
}));

const participants: Participant[] = [
  { id: "1", name: "Ana Clara", avatarUrl: "/UserCircle.svg" },
  { id: "2", name: "Daniel Souza", avatarUrl: "/UserCircle.svg" },
  { id: "3", name: "Juliana Freitas", avatarUrl: "/UserCircle.svg" },
  { id: "4", name: "Paulo Vinícius", avatarUrl: "/UserCircle.svg" },
  { id: "5", name: "Carla Mota", avatarUrl: "/UserCircle.svg" },
];

const createInitialMessages = (room: ChatRoom): ChatMessage[] => [
  {
    id: `${room.title}-welcome`,
    senderName: room.instructor,
    content: `Bem-vindo à sala ${room.title}! Fique à vontade para compartilhar suas experiências.`,
    time: "09:41",
    type: "incoming",
  },
  {
    id: `${room.title}-participant`,
    senderName: "Ana Clara",
    content: "Obrigado por abrir o tema hoje. Tenho sentido muita ansiedade antes das reuniões.",
    time: "09:46",
    type: "incoming",
  },
  {
    id: `${room.title}-you`,
    senderName: "Você",
    content: "Que bom poder fazer parte! Vou compartilhar o que vem me ajudando nos últimos dias.",
    time: "09:48",
    type: "outgoing",
  },
];

const PAGE_SIZE = 6;

const useNetworkPage = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalRooms = chatRooms.length;
  const totalPages = Math.ceil(totalRooms / PAGE_SIZE);

  const visibleRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return chatRooms.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage]);

  const onPageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    visibleRooms,
    showPagination: totalPages > 1,
    totalRooms,
    totalPages,
    currentPage,
    onPageChange,
  };
};

const NoRoom = () => {
  return (
    <div className="mt-24 flex flex-col items-center justify-center text-center text-[#1F1235]">
      <div className="rounded-full bg-[#F1E7FF] p-5">
        <Image src="/Chat.svg" alt="No chats" width={48} height={48} />
      </div>
      <h2 className="mt-6 text-2xl font-semibold">Nenhuma sala encontrada</h2>
      <p className="mt-2 text-[#6C5CAB]">
        Tente ajustar seus filtros ou crie uma nova sala para começar.
      </p>
    </div>
  );
};

interface ContentRoomsProps {
  visibleRooms: ChatRoom[];
  showPagination: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onJoinRoom: (room: ChatRoom) => void;
}

const ContentRooms = ({
  visibleRooms,
  showPagination,
  currentPage,
  totalPages,
  onPageChange,
  onJoinRoom,
}: ContentRoomsProps) => {
  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visibleRooms.map((room, index) => (
          <ChatCard
            key={`${room.title}-${index}`}
            title={room.title}
            instructor={room.instructor}
            onlineCount={room.onlineCount}
            onJoin={() => onJoinRoom(room)}
          />
        ))}
      </div>
      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export function NetworkPage() {
  const { visibleRooms, showPagination, totalRooms, totalPages, currentPage, onPageChange } = useNetworkPage();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessage[]>>({});

  const handleJoinRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setRoomMessages((prev) => {
      if (prev[room.title]) {
        return prev;
      }
      return {
        ...prev,
        [room.title]: createInitialMessages(room),
      };
    });
  };

  const handleSendMessage = (newMessage: string) => {
    if (!selectedRoom) return;
    const timestamp = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setRoomMessages((prev) => {
      const existingMessages = prev[selectedRoom.title] ?? [];
      const outgoingMessage: ChatMessage = {
        id: `${selectedRoom.title}-${Date.now()}`,
        senderName: "Você",
        content: newMessage,
        time: timestamp,
        type: "outgoing",
      };

      return {
        ...prev,
        [selectedRoom.title]: [...existingMessages, outgoingMessage],
      };
    });
  };

  const selectedRoomMessages = selectedRoom ? roomMessages[selectedRoom.title] ?? [] : [];

  return (
    <div className="min-h-screen bg-white px-6 py-12">
      {selectedRoom ? (
        <ChatView
          roomTitle={selectedRoom.title}
          roomSubtitle="Sala de acompanhamento"
          owner={{
            name: selectedRoom.instructor,
            avatarUrl: "/UserCircle.svg",
            subtitle: "Psicólogo responsável",
          }}
          participants={participants}
          messages={selectedRoomMessages}
          onBack={() => setSelectedRoom(null)}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <>
          <div className="space-y-1">
            <h1 className="text-4xl font-semibold text-[#1F1235]">Chat geral</h1>
            <p className="text-lg text-[#6F6C80]">
              Navegue e gerencie os chats abertos
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 md:flex-row">
            <div className="relative w-full md:max-w-md">
              <Input
                placeholder="Pesquisar por salas"
                className="h-14 rounded-[26px] border border-[#D4D9F3] bg-[#F7F8FF] pr-14 pl-5 text-base text-[#5B5F8A] placeholder:text-[#7A80AA] focus-visible:border-[#B9BEE6] focus-visible:ring-2 focus-visible:ring-[#C7CEF4]"
              />
              <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
                <Search className="h-5 w-5 text-[#7A80AA]" strokeWidth={2} />
              </div>
            </div>
            <Select>
              <SelectTrigger className="h-14 w-full rounded-[26px] border border-[#D4D9F3] bg-[#F7F8FF] px-5 text-left text-base text-[#5B5F8A] md:w-[200px] [&_svg]:text-[#7A80AA]">
                <SelectValue placeholder="Filtrar por" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-[#D4D9F3] bg-white text-[#1F1235]">
                <SelectItem value="live">Ao Vivo</SelectItem>
                <SelectItem value="waiting">Em espera</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {totalRooms > 0 ? (
            <ContentRooms
              showPagination={showPagination}
              visibleRooms={visibleRooms}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              onJoinRoom={handleJoinRoom}
            />
          ) : (
            <NoRoom />
          )}
        </>
      )}
    </div>
  );
}
