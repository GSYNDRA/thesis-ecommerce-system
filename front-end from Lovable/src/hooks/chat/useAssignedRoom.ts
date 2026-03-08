import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi, ChatApiError } from "@/lib/api/chat.api";
import { getChatSocketClient, type ChatMessagePayload } from "@/lib/chat/chat.socket";
import { getHeartbeatIntervalMs } from "@/lib/chat/heartbeat";
import { createEventSystemMessage, mergeMessages } from "@/lib/chat/messages";
import { useAuth } from "@/contexts/AuthContext";
import { getSession } from "@/lib/auth/session";

export type AssignedRoomState =
  | "loading"
  | "active"
  | "reassigning"
  | "closed"
  | "forbidden"
  | "unauthorized"
  | "error";

const HISTORY_PAGE_SIZE = 20;

interface UseAssignedRoomResult {
  state: AssignedRoomState;
  messages: ChatMessagePayload[];
  blockedMessage: string | null;
  hasMoreHistory: boolean;
  isHistoryLoading: boolean;
  mode: string | null;
  status: string | null;
  currentStaffId: number | null;
  isConnected: boolean;
  errorMessage: string | null;
  sendMessage: (content: string) => Promise<boolean>;
  closeSession: () => Promise<boolean>;
  reloadHistory: () => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  clearBlockedMessage: () => void;
}

function isUnauthorizedConnectError(error: Error): boolean {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("unauthorized") || message.includes("authorization");
}

export function useAssignedRoom(sessionUuid: string | null): UseAssignedRoomResult {
  const { accessToken, clearAuthSession, refresh } = useAuth();
  const [state, setState] = useState<AssignedRoomState>("loading");
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [historyCursor, setHistoryCursor] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [currentStaffId, setCurrentStaffId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(accessToken);
  const roomRef = useRef<string | null>(sessionUuid);
  const isRecoveringSocketAuthRef = useRef(false);
  const socketRecoveryAttemptsRef = useRef(0);

  useEffect(() => {
    tokenRef.current = accessToken || null;
  }, [accessToken]);

  const resolveAccessToken = useCallback((): string | null => {
    const latest = getSession()?.accessToken || tokenRef.current || null;
    tokenRef.current = latest;
    return latest;
  }, []);

  useEffect(() => {
    roomRef.current = sessionUuid;
  }, [sessionUuid]);

  const applyApiError = useCallback((error: unknown) => {
    if (error instanceof ChatApiError) {
      if (error.code === "UNAUTHORIZED") {
        clearAuthSession();
        setState("unauthorized");
        setErrorMessage("Your login session has expired. Please login again.");
        return;
      }
      if (error.code === "FORBIDDEN") {
        setBlockedMessage("You are no longer assigned to this session.");
        setState("error");
        setErrorMessage("History access denied for this assigned room.");
        return;
      }
      if (error.code === "NOT_FOUND") {
        setState("error");
        setErrorMessage("This chat session does not exist.");
        return;
      }
    }

    setState("error");
    setErrorMessage(error instanceof Error ? error.message : "Unexpected error");
  }, [clearAuthSession]);

  const syncStateFromMetadata = useCallback((input: {
    mode?: string | null;
    status?: string | null;
    currentStaffId?: number | null;
  }) => {
    setMode(input.mode || null);
    setStatus(input.status || null);
    setCurrentStaffId(
      Number.isInteger(input.currentStaffId) ? Number(input.currentStaffId) : null,
    );

    const normalizedStatus = String(input.status || "").toLowerCase();
    if (normalizedStatus === "closed") {
      setState("closed");
      return;
    }

    if (normalizedStatus === "escalation_pending") {
      setState("reassigning");
      return;
    }

    setState("active");
  }, []);

  const fetchHistoryPage = useCallback(async (offset: number, replace: boolean): Promise<void> => {
    const token = resolveAccessToken();
    const activeRoom = roomRef.current;
    if (!token || !activeRoom) {
      setState("unauthorized");
      return;
    }

    setIsHistoryLoading(true);
    try {
      const response = await chatApi.getSessionHistory(token, activeRoom, {
        limit: HISTORY_PAGE_SIZE,
        offset,
      });
      const incoming = response.data.messages || [];
      setMessages((prev) => (replace ? mergeMessages([], incoming) : mergeMessages(prev, incoming)));
      setHistoryCursor(offset + incoming.length);
      setHasMoreHistory(incoming.length === HISTORY_PAGE_SIZE);
      syncStateFromMetadata(response.data);
      setErrorMessage(null);
      setBlockedMessage(null);
    } catch (error) {
      if (error instanceof ChatApiError && error.code === "FORBIDDEN") {
        setBlockedMessage("Access denied for this room. Redirecting to staff dashboard.");
        setErrorMessage("Session access denied.");
        return;
      }
      applyApiError(error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [applyApiError, resolveAccessToken, syncStateFromMetadata]);

  const reloadHistory = useCallback(async (): Promise<void> => {
    setHistoryCursor(0);
    setHasMoreHistory(true);
    await fetchHistoryPage(0, true);
  }, [fetchHistoryPage]);

  const recoverSocketAuth = useCallback(async (): Promise<boolean> => {
    if (isRecoveringSocketAuthRef.current) return false;
    if (socketRecoveryAttemptsRef.current >= 1) {
      clearAuthSession();
      setState("unauthorized");
      setErrorMessage("Your login session has expired. Please login again.");
      return false;
    }

    isRecoveringSocketAuthRef.current = true;
    socketRecoveryAttemptsRef.current += 1;
    setErrorMessage("Refreshing session...");

    try {
      const nextSession = await refresh();
      const nextAccessToken = nextSession?.accessToken || null;
      if (!nextAccessToken) {
        clearAuthSession();
        setState("unauthorized");
        setErrorMessage("Your login session has expired. Please login again.");
        return false;
      }

      tokenRef.current = nextAccessToken;
      const client = getChatSocketClient();
      client.connect({ token: nextAccessToken, tokenTransport: "auth" });
      setErrorMessage(null);
      return true;
    } catch {
      clearAuthSession();
      setState("unauthorized");
      setErrorMessage("Your login session has expired. Please login again.");
      return false;
    } finally {
      isRecoveringSocketAuthRef.current = false;
    }
  }, [clearAuthSession, refresh]);

  useEffect(() => {
    const token = resolveAccessToken();
    const room = roomRef.current;

    if (!token) {
      setState("unauthorized");
      setErrorMessage("Login required.");
      return;
    }

    if (!room) {
      setState("error");
      setErrorMessage("sessionUuid is required.");
      return;
    }

    const client = getChatSocketClient();
    const initializeAssignedRoom = async () => {
      try {
        const ack = await client.init({ sessionUuid: room });
        if (!ack.ok) {
          if (ack.code === "UNAUTHORIZED") {
            await recoverSocketAuth();
            return;
          }
          if (ack.code === "FORBIDDEN") {
            setBlockedMessage("You are no longer assigned to this session.");
            setState("error");
            return;
          }
          setErrorMessage(ack.message || "Failed to initialize assigned room.");
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to initialize room.");
      }
    };

    const unsubs = [
      client.on("ws:connected", async () => {
        setIsConnected(true);
        socketRecoveryAttemptsRef.current = 0;
        await initializeAssignedRoom();
      }),
      client.on("chat:initialized", (payload) => {
        if (payload.sessionUuid !== roomRef.current) return;
        setMessages(payload.messages || []);
        syncStateFromMetadata(payload);
      }),
      client.on("chat:new_message", (payload) => {
        if (payload.sessionUuid !== roomRef.current) return;
        setMessages((prev) => mergeMessages(prev, [payload]));
      }),
      client.on("chat:assigned", (payload) => {
        if (payload.sessionUuid !== roomRef.current) return;
        setMessages((prev) =>
          mergeMessages(prev, [createEventSystemMessage(payload.sessionUuid, payload.content)]),
        );
        setState("active");
      }),
      client.on("chat:reassigning", (payload) => {
        if (payload.sessionUuid !== roomRef.current) return;
        setMessages((prev) =>
          mergeMessages(prev, [createEventSystemMessage(payload.sessionUuid, payload.content)]),
        );
        setState("reassigning");
      }),
      client.on("chat:closed", (payload) => {
        if (payload.sessionUuid !== roomRef.current) return;
        setMessages((prev) =>
          mergeMessages(prev, [createEventSystemMessage(payload.sessionUuid, payload.content)]),
        );
        setState("closed");
      }),
      client.onConnectError((error) => {
        setIsConnected(false);
        if (isUnauthorizedConnectError(error)) {
          void recoverSocketAuth();
          return;
        }
        setErrorMessage(error.message || "Socket connection failed.");
      }),
      client.onDisconnect(() => {
        setIsConnected(false);
      }),
    ];

    client.connect({ token, tokenTransport: "auth" });
    if (client.isConnected()) {
      setIsConnected(true);
      void initializeAssignedRoom();
    }
    void reloadHistory();

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
      // Keep staff socket alive across route transitions (dashboard <-> room)
      // to avoid backend triggering reassignment on disconnect.
    };
  }, [recoverSocketAuth, reloadHistory, resolveAccessToken, syncStateFromMetadata]);

  useEffect(() => {
    if (!isConnected || state === "unauthorized" || state === "forbidden" || state === "error") {
      return;
    }

    const client = getChatSocketClient();
    const heartbeatIntervalMs = getHeartbeatIntervalMs();

    try {
      client.heartbeat();
    } catch {
      // noop
    }

    const interval = window.setInterval(() => {
      try {
        client.heartbeat();
      } catch {
        // noop
      }
    }, heartbeatIntervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [isConnected, state]);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    const text = content.trim();
    const room = roomRef.current;
    if (!text || !room || state === "closed" || state === "forbidden" || state === "loading") {
      return false;
    }

    try {
      const ack = await getChatSocketClient().send({ sessionUuid: room, content: text });
      if (!ack.ok) {
        if (ack.code === "UNAUTHORIZED") {
          await recoverSocketAuth();
          return false;
        }
        setErrorMessage(ack.message || "Failed to send message.");
        return false;
      }
      setErrorMessage(null);
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send message.");
      return false;
    }
  }, [recoverSocketAuth, state]);

  const closeSession = useCallback(async (): Promise<boolean> => {
    const token = resolveAccessToken();
    const room = roomRef.current;
    if (!room) return false;

    try {
      const client = getChatSocketClient();
      if (client.isConnected()) {
        const ack = await client.close({ sessionUuid: room });
        if (!ack.ok) {
          if (ack.code === "UNAUTHORIZED") {
            await recoverSocketAuth();
            return false;
          }
          setErrorMessage(ack.message || "Failed to close chat.");
          return false;
        }
      } else if (token) {
        await chatApi.closeSession(token, room);
      }
      setState("closed");
      setErrorMessage(null);
      return true;
    } catch (error) {
      applyApiError(error);
      return false;
    }
  }, [applyApiError, recoverSocketAuth, resolveAccessToken]);

  const loadMoreHistory = useCallback(async (): Promise<void> => {
    if (isHistoryLoading || !hasMoreHistory) return;
    await fetchHistoryPage(historyCursor, false);
  }, [fetchHistoryPage, hasMoreHistory, historyCursor, isHistoryLoading]);

  const clearBlockedMessage = useCallback(() => {
    setBlockedMessage(null);
  }, []);

  return useMemo(
    () => ({
      state,
      messages,
      blockedMessage,
      hasMoreHistory,
      isHistoryLoading,
      mode,
      status,
      currentStaffId,
      isConnected,
      errorMessage,
      sendMessage,
      closeSession,
      reloadHistory,
      loadMoreHistory,
      clearBlockedMessage,
    }),
    [
      blockedMessage,
      clearBlockedMessage,
      closeSession,
      currentStaffId,
      errorMessage,
      hasMoreHistory,
      isHistoryLoading,
      isConnected,
      loadMoreHistory,
      messages,
      mode,
      reloadHistory,
      sendMessage,
      state,
      status,
    ],
  );
}
