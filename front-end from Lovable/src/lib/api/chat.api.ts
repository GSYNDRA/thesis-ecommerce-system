import { apiClient, ApiError } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/lib/api/auth.api";

export type ChatSessionMode = "ai" | "human";
export type ChatSessionStatus = "active" | "escalation_pending" | "closed" | string;
export type ChatSenderType = "customer" | "staff" | "ai" | "system" | string;
export type ChatMessageType = "text" | "system" | string;

export interface ChatSessionSummary {
  sessionUuid: string;
  mode: ChatSessionMode;
  status: ChatSessionStatus;
  currentStaffId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  sessionUuid: string;
  messageId: number | null;
  senderType: ChatSenderType;
  senderId: number | null;
  messageType: ChatMessageType;
  content: string;
  timestamp: string;
}

export interface GetActiveSessionData {
  created: boolean;
  session: ChatSessionSummary;
}

export interface GetSessionHistoryData {
  sessionUuid: string;
  mode: ChatSessionMode;
  status: ChatSessionStatus;
  currentStaffId: number | null;
  messages: ChatMessage[];
}

export interface RequestHumanPayload {
  reason?: string;
}

export interface RequestHumanData {
  requested: boolean;
  assigned: boolean;
  alreadyAssigned?: boolean;
  reason?: string;
  staffId?: number | null;
  sessionUuid?: string;
  transferRequestId?: number;
}

export interface CloseSessionData {
  closed: boolean;
  alreadyClosed: boolean;
  sessionUuid: string;
}

export interface SetStaffAvailabilityPayload {
  isAvailable: boolean;
}

export interface SetStaffAvailabilityData {
  staffId: number;
  isAvailable: boolean;
  autoAssignedSessionUuid: string | null;
}

export interface WorkloadSessionItem {
  sessionUuid: string;
  userId: number;
  mode: ChatSessionMode;
  status: ChatSessionStatus;
  updatedAt: string | null;
}

export interface GetStaffWorkloadData {
  staffId: number;
  isOnline: boolean;
  isAvailable: boolean;
  currentChats: number;
  maxConcurrentChats: number;
  lastHeartbeat: string | null;
  sessions: WorkloadSessionItem[];
}

export type ChatApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export class ChatApiError extends Error {
  readonly statusCode: number;
  readonly code: ChatApiErrorCode;
  readonly data: unknown;

  constructor(message: string, statusCode: number, code: ChatApiErrorCode, data: unknown) {
    super(message);
    this.name = "ChatApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

function mapStatusToCode(statusCode: number): ChatApiErrorCode {
  if (statusCode === 401) return "UNAUTHORIZED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 409) return "CONFLICT";
  if (statusCode >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

function normalizeChatApiError(error: unknown): ChatApiError {
  if (error instanceof ChatApiError) return error;

  if (error instanceof ApiError) {
    return new ChatApiError(
      error.message,
      error.statusCode,
      mapStatusToCode(error.statusCode),
      error.data,
    );
  }

  return new ChatApiError("Unexpected API error", 0, "UNKNOWN_ERROR", error);
}

async function withChatApiError<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    throw normalizeChatApiError(error);
  }
}

function buildHistoryQuery(limit?: number, offset?: number): string {
  const params = new URLSearchParams();
  if (Number.isInteger(limit) && Number(limit) > 0) params.set("limit", String(limit));
  if (Number.isInteger(offset) && Number(offset) >= 0) params.set("offset", String(offset));
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

function buildWorkloadQuery(limit?: number): string {
  if (!Number.isInteger(limit) || Number(limit) <= 0) return "";
  return `?limit=${encodeURIComponent(String(limit))}`;
}

export const chatApi = {
  getActiveSession(accessToken: string) {
    return withChatApiError(() =>
      apiClient.get<ApiSuccessResponse<GetActiveSessionData>>("/chat/session/active", {
        accessToken,
      }),
    );
  },

  getSessionHistory(
    accessToken: string,
    sessionUuid: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const query = buildHistoryQuery(options.limit, options.offset);
    return withChatApiError(() =>
      apiClient.get<ApiSuccessResponse<GetSessionHistoryData>>(
        `/chat/session/${encodeURIComponent(sessionUuid)}/history${query}`,
        { accessToken },
      ),
    );
  },

  requestHuman(
    accessToken: string,
    sessionUuid: string,
    payload: RequestHumanPayload = {},
  ) {
    return withChatApiError(() =>
      apiClient.post<ApiSuccessResponse<RequestHumanData>>(
        `/chat/session/${encodeURIComponent(sessionUuid)}/request-human`,
        payload.reason ? { reason: payload.reason } : {},
        { accessToken },
      ),
    );
  },

  closeSession(accessToken: string, sessionUuid: string) {
    return withChatApiError(() =>
      apiClient.post<ApiSuccessResponse<CloseSessionData>>(
        `/chat/session/${encodeURIComponent(sessionUuid)}/close`,
        {},
        { accessToken },
      ),
    );
  },

  setStaffAvailability(accessToken: string, payload: SetStaffAvailabilityPayload) {
    return withChatApiError(() =>
      apiClient.post<ApiSuccessResponse<SetStaffAvailabilityData>>(
        "/chat/staff/availability",
        { isAvailable: payload.isAvailable },
        { accessToken },
      ),
    );
  },

  getStaffWorkload(accessToken: string, options: { limit?: number } = {}) {
    const query = buildWorkloadQuery(options.limit);
    return withChatApiError(() =>
      apiClient.get<ApiSuccessResponse<GetStaffWorkloadData>>(
        `/chat/staff/workload${query}`,
        { accessToken },
      ),
    );
  },
};

