export type UserStatus = "active" | "pending" | "banned";

export type BanReasonKey =
  | "conteudo_improprio"
  | "assedio_ou_bullying"
  | "spam_ou_fraude"
  | "discurso_de_odio"
  | "outro";

export type BanUserPayload = {
  reason: BanReasonKey | string;
  description: string;
};

export type UnbanUserPayload = {
  description: string;
  status?: "active";
};

export type UserCardUser = {
  id: string;
  name: string;
  codename?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  status: UserStatus;
  isVerified: boolean;
  createdAt?: string | null;
  loginAttempts: number;
  lockedUntil?: string | null;
};

export type UserListParams = {
  search?: string;
  status?: UserStatus;
  page?: number;
  perPage?: number;
};

export type UserListMeta = {
  total?: number;
  page?: number;
  perPage?: number;
  totalPages?: number;
};

export type UserListResponse = {
  data: unknown[];
  meta: UserListMeta;
};

export type BanUserResponse = {
  message?: string;
  user?: {
    id?: string | number;
    status?: string;
    name?: string;
    email?: string;
    codinome?: string;
  };
  audit?: {
    reason?: {
      key?: string;
      label?: string;
    };
    description?: string;
  };
};

export type UserProfileReport = {
  id: string;
  authorName?: string | null;
  reason?: string | null;
  description?: string | null;
  createdAt?: string | null;
};

export type UserProfileActivity = {
  id: string;
  title: string;
  instructorName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  participantsCount?: number | null;
  roomId?: string | null;
};

export type UserProfile = {
  id: string;
  name: string;
  status: UserStatus;
  plan?: string | null;
  codename?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  topics: string[];
  followersCount: number;
  followingCount: number;
  reportsTotal: number;
  liveHistoryTotal: number;
  reports: UserProfileReport[];
  liveHistory: UserProfileActivity[];
};

export type UserProfileResponse = {
  user?: unknown;
  data?: unknown;
  reports?: unknown;
  liveChatHistory?: unknown;
};
