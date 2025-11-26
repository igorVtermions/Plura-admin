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
import { ChatCard } from "../../misc/components/chat-card";
import { Pagination } from "./components/pagination";

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
}

const ContentRooms = ({
  visibleRooms,
  showPagination,
  currentPage,
  totalPages,
  onPageChange,
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

  return (
    <div className="min-h-screen bg-white px-6 py-12">
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
        />
      ) : (
        <NoRoom />
      )}
    </div>
  );
}
