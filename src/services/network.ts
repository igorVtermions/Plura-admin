import { invokeFunction } from "./api";

export interface LiveChatRoom {
  id: string;
  title: string;
  instructor: {
    name: string;
  };
  participants_count: number;
}

export type LiveRoomStatus = "live" | "soon" | "all";

type LiveChatRoomApiResponse = {
  id: string | number;
  title?: string;
  name?: string;
  tutor?: {
    name?: string;
  };
  participants_count?: number;
  liveUsers?: Array<unknown>;
};

export interface FetchLiveChatRoomsOptions {
  status?: LiveRoomStatus;
  topics?: string;
}

export const fetchLiveChatRooms = async (
  options: FetchLiveChatRoomsOptions = {},
): Promise<LiveChatRoom[]> => {
  const params = new URLSearchParams();
  const status = options.status ?? "live";
  params.set("status", status);
  if (options.topics) {
    params.set("topics", options.topics);
  }

  const functionName =
    params.size > 0 ? `users-live-chat-rooms?${params.toString()}` : "users-live-chat-rooms";

  const data = await invokeFunction<LiveChatRoomApiResponse[]>(functionName, {
    method: "GET",
  });

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((room) => {
      const id = room?.id != null ? String(room.id) : "";
      const title = room?.title ?? room?.name ?? "";
      if (!id || !title) return null;
      return {
        id,
        title,
        instructor: {
          name: room?.tutor?.name ?? "Instrutor",
        },
        participants_count:
          typeof room?.participants_count === "number"
            ? room.participants_count
            : Array.isArray(room?.liveUsers)
              ? room.liveUsers.length
              : 0,
      };
    })
    .filter((room): room is LiveChatRoom => room !== null);
};
