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
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LiveRoomCard } from "@/app/home/components/live-room-card";
import { SoonRoomCard } from "@/app/home/components/soon-room-card";
import { Pagination } from "../components/pagination";
import { ChatMessage, ChatView, Participant } from "../components/chat-view";
import { ModalDetail } from "../components/modal-detail";
import {
	fetchLiveChatRooms,
	LiveChatRoom,
  LiveRoomStatus,
  fetchLiveChatRoomParticipants,
  fetchLiveChatRoomMessages,
  sendLiveChatRoomMessage,
  LiveChatMessage,
  joinLiveChatRoom,
  leaveLiveChatRoom,
} from "@/services/network";

const PAGE_SIZE = 6;

const useNetworkPage = () => {
	const [currentPage, setCurrentPage] = useState(1);
	const [rooms, setRooms] = useState<LiveChatRoom[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LiveRoomStatus>("live");

  const loadRooms = useCallback(
    async (status: LiveRoomStatus) => {
      try {
        setLoading(true);
        setError(null);
        const fetchedRooms = await fetchLiveChatRooms({ status });
        setRooms(fetchedRooms);
      } catch (err) {
        setRooms([]);
        setError("Falha ao buscar as salas. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

	useEffect(() => {
    loadRooms(statusFilter);
	}, [statusFilter, loadRooms]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

	const totalRooms = rooms.length;
	const totalPages = Math.ceil(totalRooms / PAGE_SIZE);

	const visibleRooms = useMemo(() => {
		const startIndex = (currentPage - 1) * PAGE_SIZE;
		return rooms.slice(startIndex, startIndex + PAGE_SIZE);
	}, [currentPage, rooms]);

	const onPageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

  const reload = useCallback(() => {
    loadRooms(statusFilter);
  }, [loadRooms, statusFilter]);

  return {
    rooms,
    visibleRooms,
    loading,
    error,
    showPagination: totalPages > 1,
    totalRooms,
    totalPages,
    currentPage,
    statusFilter,
    onPageChange,
    onStatusFilterChange: setStatusFilter,
    reload,
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
				NÃ£o hÃ¡ salas de chat ao vivo disponÃ­veis no momento.
			</p>
		</div>
	);
};

interface ContentRoomsProps {
  visibleRooms: LiveChatRoom[];
  showPagination: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onJoinRoom: (room: LiveChatRoom) => void;
  statusFilter: LiveRoomStatus;
}

const ContentRooms = ({
  visibleRooms,
  showPagination,
  currentPage,
  totalPages,
  onPageChange,
  onJoinRoom,
  statusFilter,
}: ContentRoomsProps) => {
  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visibleRooms.map((room) => {
          const startAt = room.startAt ?? undefined;
          const endAt = room.endAt ?? undefined;
          const host = room.instructor.name;
          const now = new Date();
          const startDate = startAt ? new Date(startAt) : null;
          const endDate = endAt ? new Date(endAt) : null;
          const hasValidDates =
            startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime());
          const isLive = hasValidDates
            ? now.getTime() >= startDate!.getTime() && now.getTime() <= endDate!.getTime()
            : statusFilter === "live";
          const isSoon = hasValidDates ? now.getTime() < startDate!.getTime() : statusFilter === "soon";

          if (isLive) {
            return (
              <LiveRoomCard
                key={room.id}
                id={room.id}
                startAt={startAt}
                endAt={endAt}
                topic={room.title}
                host={host}
                liveUsers={room.liveUsers}
                onJoin={() => onJoinRoom(room)}
              />
            );
          }

          if (isSoon) {
            return (
              <SoonRoomCard
                key={room.id}
                dateLabel={undefined}
                startAt={startAt}
                endAt={endAt}
                topic={room.title}
                host={host}
                showSlash={false}
                onToggleReminder={() => {}}
              />
            );
          }

          return null;
        })}
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
  const location = useLocation();
  const navigate = useNavigate();
  const pendingRoomIdRef = useRef<string | null>(null);
  const {
    rooms,
    visibleRooms,
    loading,
    error,
    showPagination,
    totalRooms,
    totalPages,
    currentPage,
    statusFilter,
    onPageChange,
    onStatusFilterChange,
    reload,
  } = useNetworkPage();
  const [selectedRoom, setSelectedRoom] = useState<LiveChatRoom | null>(null);
  const [roomMessages, setRoomMessages] = useState<Record<string, LiveChatMessage[]>>({});
  const [roomParticipants, setRoomParticipants] = useState<Record<string, Participant[]>>({});
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  useEffect(() => {
    function handleSessionCreated() {
      reload();
    }
    window.addEventListener("session:created", handleSessionCreated as EventListener);
    return () => window.removeEventListener("session:created", handleSessionCreated as EventListener);
  }, [reload]);

  const handleJoinRoom = useCallback((room: LiveChatRoom) => {
    setSelectedRoom(room);
    void (async () => {
      try {
        await joinLiveChatRoom(room.id);
        const [participantsList, messagesList] = await Promise.all([
          fetchLiveChatRoomParticipants(room.id),
          fetchLiveChatRoomMessages(room.id),
        ]);
        setRoomParticipants((prev) => ({
          ...prev,
          [room.id]: participantsList,
        }));
        setRoomMessages((prev) => ({
          ...prev,
          [room.id]: messagesList,
        }));
      } catch {
        setRoomParticipants((prev) => ({ ...prev, [room.id]: [] }));
        setRoomMessages((prev) => ({ ...prev, [room.id]: [] }));
      }
    })();
  }, []);

  useEffect(() => {
    const state = location.state as { roomId?: string } | null;
    const params = new URLSearchParams(location.search);
    const queryRoomId = params.get("roomId");
    if (queryRoomId) {
      pendingRoomIdRef.current = queryRoomId;
      return;
    }
    if (state?.roomId) {
      pendingRoomIdRef.current = String(state.roomId);
    }
  }, [location.state, location.search]);

  useEffect(() => {
    if (!pendingRoomIdRef.current || selectedRoom) return;
    const room = rooms.find((item) => item.id === pendingRoomIdRef.current);
    if (!room) return;
    handleJoinRoom(room);
    pendingRoomIdRef.current = null;
    navigate("/network", { replace: true, state: null });
  }, [rooms, selectedRoom, handleJoinRoom, navigate]);

    useEffect(() => {
      if (!selectedRoom?.id) return;
      const roomId = selectedRoom.id;
      let isMounted = true;

    const refreshMessages = async () => {
      try {
        const messagesList = await fetchLiveChatRoomMessages(roomId);
        if (!isMounted) return;
        setRoomMessages((prev) => ({
          ...prev,
          [roomId]: messagesList,
        }));
      } catch {
        // ignore polling errors
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshMessages();
    }, 2500);

      return () => {
        isMounted = false;
        window.clearInterval(intervalId);
      };
    }, [selectedRoom?.id]);

    useEffect(() => {
      if (!selectedRoom?.id) return;
      const roomId = selectedRoom.id;
      let isMounted = true;

      const refreshParticipants = async () => {
        try {
          const participantsList = await fetchLiveChatRoomParticipants(roomId);
          if (!isMounted) return;
          setRoomParticipants((prev) => ({
            ...prev,
            [roomId]: participantsList,
          }));
        } catch {
          // ignore polling errors
        }
      };

      const intervalId = window.setInterval(() => {
        void refreshParticipants();
      }, 4000);

      return () => {
        isMounted = false;
        window.clearInterval(intervalId);
      };
    }, [selectedRoom?.id]);

  const handleSendMessage = async (newMessage: string) => {
    if (!selectedRoom) return;
    try {
      await joinLiveChatRoom(selectedRoom.id);
    } catch {
      // ignore join errors before sending
    }
    const timestamp = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setRoomMessages((prev) => {
      const existingMessages = prev[selectedRoom.id] ?? [];
      const outgoingMessage: LiveChatMessage = {
        id: `${selectedRoom.id}-${Date.now()}`,
        senderName: "VocÃª",
        content: newMessage,
        time: timestamp,
        type: "outgoing",
        isAdmin: true,
      };

      return {
        ...prev,
        [selectedRoom.id]: [...existingMessages, outgoingMessage],
      };
    });

    try {
      await sendLiveChatRoomMessage(selectedRoom.id, newMessage);
    } catch {
      // ignore send errors for now
    }
  };

  const selectedRoomMessages = selectedRoom ? roomMessages[selectedRoom.id] ?? [] : [];
  const selectedRoomParticipants = selectedRoom ? roomParticipants[selectedRoom.id] ?? [] : [];
  const selectedRoomOnlineUsers = useMemo(() => {
    if (!selectedRoomParticipants.length) return [];
    return selectedRoomParticipants.filter((participant) => {
      const role = (participant.role || "").toLowerCase();
      return role !== "admin" && role !== "tutor";
    });
  }, [selectedRoomParticipants]);
  const roomDetailUsers = useMemo(() => {
    if (!selectedRoomOnlineUsers.length) return [];
    return selectedRoomOnlineUsers.map((participant) => ({
      name: participant.name,
      handle: `@${participant.name.toLowerCase().replace(/\s+/g, ".")}`,
      avatar: participant.avatarUrl,
    }));
  }, [selectedRoomOnlineUsers]);

  return (
    <div className="min-h-screen bg-white px-6 py-12">
      {selectedRoom ? (
        <>
          <ChatView
            roomTitle={selectedRoom.title}
            roomSubtitle="Sala de acompanhamento"
            roomId={selectedRoom.id}
            owner={{
              name: selectedRoom.instructor.name,
              avatarUrl: "/UserCircle.svg",
              subtitle: selectedRoom.instructor.role ?? "Instrutor responsÃ¡vel",
            }}
            participants={selectedRoomOnlineUsers}
            messages={selectedRoomMessages as ChatMessage[]}
            onBack={() => {
              void leaveLiveChatRoom(selectedRoom.id);
              setSelectedRoom(null);
            }}
            onMoreOptions={() => setShowRoomDetails(true)}
            onSendMessage={handleSendMessage}
          />
          <ModalDetail
            open={showRoomDetails}
            onClose={() => setShowRoomDetails(false)}
            about={selectedRoom.description ?? "Sem descrição informada."}
            ageRange="Sem dados"
            audience="Sem dados"
            onlineCount={selectedRoomOnlineUsers.length}
            users={roomDetailUsers}
          />
        </>
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
            <Select
              value={statusFilter}
              onValueChange={(value) => onStatusFilterChange(value as LiveRoomStatus)}
            >
              <SelectTrigger className="h-14 w-full rounded-[26px] border border-[#D4D9F3] bg-[#F7F8FF] px-5 text-left text-base text-[#5B5F8A] md:w-[200px] [&_svg]:text-[#7A80AA]">
                <SelectValue placeholder="Filtrar por" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-[#D4D9F3] bg-white text-[#1F1235]">
                <SelectItem value="live">Ao Vivo</SelectItem>
                <SelectItem value="soon">Em espera</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading && <div className="mt-10 text-center">Carregando salas...</div>}
          {error && <div className="mt-10 text-center text-red-500">{error}</div>}
          {!loading && !error && (
            <>
              {totalRooms > 0 ? (
                <ContentRooms
                  showPagination={showPagination}
                  visibleRooms={visibleRooms}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                  onJoinRoom={handleJoinRoom}
                  statusFilter={statusFilter}
                />
              ) : (
                <NoRoom />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}





