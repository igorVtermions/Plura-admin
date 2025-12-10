// src/features/instructors/types.ts
export type InstructorStatus = "active" | "pending" | "banned" | "inactive";

export type InstructorProfileActivity = {
  id: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  participantsCount: number | null;
  isLive: boolean;
  status: string | null;
  roomId: string | null;
};

export type InstructorProfileReport = {
  id: string;
  authorName: string | null;
  reason: string | null;
  description: string | null;
  createdAt: string | null;
};

export type InstructorCardData = {
  id: string;
  name: string;
  codename: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  topics: string[];
  role: string | null;
  status: InstructorStatus;
  followersCount?: number;
  reportsTotal?: number;
  liveSessions?: InstructorProfileActivity[];
  liveSessionsTotal?: number;
};

export type InstructorProfile = InstructorCardData & {
  followersCount: number;
  reportsTotal: number;
  reports: InstructorProfileReport[];
  liveSessions: InstructorProfileActivity[];
  liveSessionsTotal: number;
};

export type InstructorFollower = {
  id: string;
  name: string;
  codename: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  followedAt: string | null;
};

export type InstructorFollowersParams = {
  page?: number;
  perPage?: number;
};

export type InstructorFollowersResult = {
  items: InstructorFollower[];
  total: number | null;
  pageSize: number;
  hasMore: boolean;
};

export type InstructorListParams = {
  search?: string;
  status?: Exclude<InstructorStatus, "inactive">;
  page?: number;
  perPage?: number;
};

export type InstructorListMeta = {
  total?: number;
  page?: number;
  perPage?: number;
  totalPages?: number;
};

export type InstructorListResponse = {
  data: unknown[];
  meta: InstructorListMeta;
};

export type InstructorProfileResponse = {
  data?: unknown;
  tutor?: unknown;
  profile?: unknown;
};
