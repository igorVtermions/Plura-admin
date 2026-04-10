import { invokeFunction } from "@/services/api";

export type RoomHistoryRoom = {
  roomHistoryId: number;
  roomId: number | null;
  title: string;
  description: string;
  topic: string | null;
  topics: string[];
  startAt: string | null;
  endAt: string | null;
  actualEndAt: string | null;
  participantsCount: number;
  totalParticipants: number;
  totalInteractions: number;
  tutor: { id: number; name: string; photoUrl?: string | null } | null;
};

export type RoomHistoryParticipant = {
  userId: number | null;
  name: string | null;
  codinome: string | null;
  photoUrl: string | null;
  joinedAt: string | null;
  leftAt: string | null;
  totalTimeInRoom: number | null;
  hadMicrophone: boolean | null;
  wasRemoved: boolean | null;
};

export type RoomHistoryDetail = {
  room: RoomHistoryRoom;
  participants: RoomHistoryParticipant[];
};

export async function fetchRoomHistoryDetail(
  historyId: string,
): Promise<RoomHistoryDetail | null> {
  const response = await invokeFunction<RoomHistoryDetail>(
    `user-room-history/${encodeURIComponent(historyId)}`,
    { method: "GET" },
  );
  if (!response || typeof response !== "object") return null;
  return response;
}
