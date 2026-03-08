import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi, ChatApiError } from "@/lib/api/chat.api";
import { useAuth } from "@/contexts/AuthContext";
import { getSession } from "@/lib/auth/session";
import {
  getChatSocketClient,
  type ChatAssignedPayload,
  type ChatClosedPayload,
  type ChatMessagePayload,
  type ChatReassigningPayload,
  type ChatSocketAck,
} from "@/lib/chat/chat.socket";
import { createEventSystemMessage, mergeMessages } from "@/lib/chat/messages";

export type CustomerChatState =
  | "loading"
  | "ai_mode"
  | "waiting_human"
  | "assigned"
  | "reassigning"
  | "closed"
  | "forbidden"
  | "unauthorized";

const STREAM_INTERRUPT_THRESHOLD_MS = 3500;
const HISTORY_PAGE_SIZE = 20;

function toCustomerState(input: {
  mode?: string | null;
  status?: string | null;
  currentStaffId?: number | null;
}): CustomerChatState {
  const mode = String(input.mode || "").toLowerCase();
  const status = String(input.status || "").toLowerCase();
  const hasStaff = Number.isInteger(input.currentStaffId) && Number(input.currentStaffId) > 0;

  if (status === "closed") return "closed";
  if (mode === "human" && hasStaff) return "assigned";
  if (status === "escalation_pending" || mode === "human") return "waiting_human";
  return "ai_mode";
}

function isUnauthorizedConnectError(error: Error): boolean {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("unauthorized") || message.includes("authorization");
}

function isAckSuccess(ack: ChatSocketAck): boolean {
  return Boolean(ack?.ok);
}

interface UseCustomerChatSessionResult {
  state: CustomerChatState;
  sessionUuid: string | null;
  messages: ChatMessagePayload[];
  blockedMessage: string | null;
  hasMoreHistory: boolean;
  isHistoryLoading: boolean;
  streamingText: string;
  isStreaming: boolean;
  isStreamInterrupted: boolean;
  isConnected: boolean;
  errorMessage: string | null;
  sendMessage: (content: string) => Promise<boolean>;
  requestHuman: (reason?: string) => Promise<boolean>;
  closeChat: () => Promise<boolean>;
  restartSession: () => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  clearBlockedMessage: () => void;
}

export function useCustomerChatSession(): UseCustomerChatSessionResult {
  const { accessToken, clearAuthSession, refresh } = useAuth();
  const [state, setState] = useState<CustomerChatState>("loading");
  const [sessionUuid, setSessionUuid] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [historyCursor, setHistoryCursor] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStreamInterrupted, setIsStreamInterrupted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastTokenAtRef = useRef<number>(0);
  const sessionUuidRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(accessToken);
  const isStreamingRef = useRef<boolean>(false);
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
    sessionUuidRef.current = sessionUuid;
  }, [sessionUuid]);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const applyForbidden = useCallback(() => {
    setState("forbidden");
    setErrorMessage("You are not allowed to access this chat session.");
  }, []);

  const applyUnauthorized = useCallback(() => {
    clearAuthSession();
    setState("unauthorized");
    setErrorMessage("Your login session has expired. Please login again.");
  }, [clearAuthSession]);

  const recoverSocketAuth = useCallback(async (): Promise<boolean> => {
    if (isRecoveringSocketAuthRef.current) return false;
    if (socketRecoveryAttemptsRef.current >= 1) {
      applyUnauthorized();
      return false;
    }

    isRecoveringSocketAuthRef.current = true;
    socketRecoveryAttemptsRef.current += 1;
    setErrorMessage("Refreshing session...");

    try {
      const nextSession = await refresh();
      const nextAccessToken = nextSession?.accessToken || null;
      if (!nextAccessToken) {
        applyUnauthorized();
        return false;
      }

      tokenRef.current = nextAccessToken;
      const client = getChatSocketClient();
      client.connect({ token: nextAccessToken, tokenTransport: "auth" });
      setErrorMessage(null);
      return true;
    } catch {
      applyUnauthorized();
      return false;
    } finally {
      isRecoveringSocketAuthRef.current = false;
    }
  }, [applyUnauthorized, refresh]);

  const handleApiError = useCallback(
    (error: unknown) => {
      if (error instanceof ChatApiError) {
        if (error.code === "UNAUTHORIZED") {
          applyUnauthorized();
          return;
        }

        if (error.code === "FORBIDDEN") {
          applyForbidden();
          return;
        }
      }

      setErrorMessage(error instanceof Error ? error.message : "Unexpected error");
    },
    [applyForbidden, applyUnauthorized],
  );

  const fetchHistoryPage = useCallback(
    async (session: string, offset: number, replace: boolean) => {
      const token = resolveAccessToken();
      if (!token) {
        applyUnauthorized();
        return;
      }

      setIsHistoryLoading(true);
      try {
        const response = await chatApi.getSessionHistory(token, session, {
          limit: HISTORY_PAGE_SIZE,
          offset,
        });
        const incoming = response.data.messages || [];
        setMessages((prev) => (replace ? mergeMessages([], incoming) : mergeMessages(prev, incoming)));
        setHistoryCursor(offset + incoming.length);
        setHasMoreHistory(incoming.length === HISTORY_PAGE_SIZE);
        setBlockedMessage(null);
      } catch (error) {
        if (error instanceof ChatApiError && error.code === "FORBIDDEN") {
          setBlockedMessage("History access denied. Please start a new chat session.");
          return;
        }
        handleApiError(error);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [applyUnauthorized, handleApiError, resolveAccessToken],
  );

  const bootstrap = useCallback(async () => {
    const token = resolveAccessToken();
    if (!token) {
      applyUnauthorized();
      return;
    }

    setState("loading");
    setErrorMessage(null);
    setBlockedMessage(null);

    let activeSessionUuid: string | null = null;
    try {
      const active = await chatApi.getActiveSession(token);
      const activeSession = active.data.session;
      activeSessionUuid = activeSession.sessionUuid;
      setSessionUuid(activeSession.sessionUuid);
      setState(toCustomerState(activeSession));
    } catch (error) {
      handleApiError(error);
      return;
    }

    if (activeSessionUuid) {
      await fetchHistoryPage(activeSessionUuid, 0, true);
    }

    const latestToken = resolveAccessToken();
    if (!latestToken) {
      applyUnauthorized();
      return;
    }

    const client = getChatSocketClient();
    client.connect({ token: latestToken, tokenTransport: "auth" });
  }, [applyUnauthorized, fetchHistoryPage, handleApiError, resolveAccessToken]);

  useEffect(() => {
    const client = getChatSocketClient();
    const initializeCustomerSession = async () => {
      try {
        const ack = await client.init({});
        if (!isAckSuccess(ack)) {
          if (ack.code === "UNAUTHORIZED") {
            await recoverSocketAuth();
            return;
          }
          setErrorMessage(ack.message || "Failed to initialize chat.");
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Chat initialization failed");
      }
    };

    const unsubs = [
      client.on("ws:connected", async () => {
        setIsConnected(true);
        socketRecoveryAttemptsRef.current = 0;
        await initializeCustomerSession();
      }),
      client.on("chat:initialized", (payload) => {
        setSessionUuid(payload.sessionUuid);
        setMessages((prev) => mergeMessages(prev, payload.messages || []));
        setState(
          toCustomerState({
            mode: payload.mode,
            status: payload.status,
            currentStaffId: payload.currentStaffId,
          }),
        );
      }),
      client.on("chat:new_message", (payload) => {
        const currentSession = sessionUuidRef.current;
        if (currentSession && payload.sessionUuid !== currentSession) return;
        setMessages((prev) => mergeMessages(prev, [payload]));
        if (payload.senderType === "ai" && isStreamingRef.current) {
          setStreamingText("");
          setIsStreaming(false);
          setIsStreamInterrupted(false);
        }
      }),
      client.on("chat:ai_token", (payload) => {
        const currentSession = sessionUuidRef.current;
        if (currentSession && payload.sessionUuid !== currentSession) return;
        lastTokenAtRef.current = Date.now();
        setIsStreaming(true);
        setIsStreamInterrupted(false);
        setStreamingText((prev) => prev + payload.token);
      }),
      client.on("chat:ai_message_complete", (payload) => {
        const currentSession = sessionUuidRef.current;
        if (currentSession && payload.sessionUuid !== currentSession) return;
        setStreamingText("");
        setIsStreaming(false);
        setIsStreamInterrupted(false);
      }),
      client.on("chat:assigned", (payload: ChatAssignedPayload) => {
        const currentSession = sessionUuidRef.current;
        if (currentSession && payload.sessionUuid !== currentSession) return;
        setMessages((prev) =>
          mergeMessages(prev, [createEventSystemMessage(payload.sessionUuid, payload.content)]),
        );
        setState("assigned");
      }),
      client.on("chat:reassigning", (payload: ChatReassigningPayload) => {
        const currentSession = sessionUuidRef.current;
        if (currentSession && payload.sessionUuid !== currentSession) return;
        setMessages((prev) =>
          mergeMessages(prev, [createEventSystemMessage(payload.sessionUuid, payload.content)]),
        );
        setState(payload.reason === "NO_STAFF_AVAILABLE" ? "waiting_human" : "reassigning");
      }),
      client.on("chat:closed", (payload: ChatClosedPayload) => {
        const currentSession = sessionUuidRef.current;
        if (currentSession && payload.sessionUuid !== currentSession) return;
        setMessages((prev) =>
          mergeMessages(prev, [createEventSystemMessage(payload.sessionUuid, payload.content)]),
        );
        setStreamingText("");
        setIsStreaming(false);
        setIsStreamInterrupted(false);
        setState("closed");
      }),
      client.onConnectError((error) => {
        setIsConnected(false);
        if (isUnauthorizedConnectError(error)) {
          void recoverSocketAuth();
          return;
        }
        setErrorMessage(error.message || "Chat socket connection failed.");
      }),
      client.onDisconnect(() => {
        setIsConnected(false);
      }),
    ];

    void bootstrap();
    if (client.isConnected()) {
      setIsConnected(true);
      void initializeCustomerSession();
    }

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
      client.disconnect();
    };
  }, [bootstrap, recoverSocketAuth]);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = window.setInterval(() => {
      if (Date.now() - lastTokenAtRef.current >= STREAM_INTERRUPT_THRESHOLD_MS) {
        setIsStreamInterrupted(true);
      }
    }, 800);

    return () => {
      window.clearInterval(interval);
    };
  }, [isStreaming]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const text = content.trim();
      if (!text || !sessionUuidRef.current) return false;
      if (
        state === "closed" ||
        state === "forbidden" ||
        state === "unauthorized" ||
        state === "loading"
      ) {
        return false;
      }

      const client = getChatSocketClient();
      try {
        const ack = await client.send({
          sessionUuid: sessionUuidRef.current,
          content: text,
        });

        if (!isAckSuccess(ack)) {
          if (ack.code === "UNAUTHORIZED") {
            await recoverSocketAuth();
            return false;
          }
          if (String(ack.message || "").toLowerCase().includes("closed")) {
            setState("closed");
          }
          setErrorMessage(ack.message || "Message sending failed.");
          return false;
        }

        setErrorMessage(null);
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Message sending failed.");
        return false;
      }
    },
    [recoverSocketAuth, state],
  );

  const requestHuman = useCallback(
    async (reason?: string): Promise<boolean> => {
      const token = resolveAccessToken();
      const activeSessionUuid = sessionUuidRef.current;
      if (!activeSessionUuid) return false;

      const client = getChatSocketClient();
      try {
        if (client.isConnected()) {
          const ack = await client.requestHuman({
            sessionUuid: activeSessionUuid,
            reason,
          });
          if (!isAckSuccess(ack)) {
            if (ack.code === "UNAUTHORIZED") {
              await recoverSocketAuth();
              return false;
            }
            setErrorMessage(ack.message || "Failed to request human support.");
            return false;
          }
        } else if (token) {
          await chatApi.requestHuman(token, activeSessionUuid, { reason });
        }

        setState("waiting_human");
        setErrorMessage(null);
        return true;
      } catch (error) {
        handleApiError(error);
        return false;
      }
    },
    [handleApiError, recoverSocketAuth, resolveAccessToken],
  );

  const closeChat = useCallback(async (): Promise<boolean> => {
    const token = resolveAccessToken();
    const activeSessionUuid = sessionUuidRef.current;
    if (!activeSessionUuid) return false;

    const client = getChatSocketClient();
    try {
      if (client.isConnected()) {
        const ack = await client.close({ sessionUuid: activeSessionUuid });
        if (!isAckSuccess(ack)) {
          if (ack.code === "UNAUTHORIZED") {
            await recoverSocketAuth();
            return false;
          }
          setErrorMessage(ack.message || "Failed to close chat.");
          return false;
        }
      } else if (token) {
        await chatApi.closeSession(token, activeSessionUuid);
      }

      setState("closed");
      setStreamingText("");
      setIsStreaming(false);
      setIsStreamInterrupted(false);
      setErrorMessage(null);
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  }, [handleApiError, recoverSocketAuth, resolveAccessToken]);

  const restartSession = useCallback(async (): Promise<void> => {
    setMessages([]);
    setHistoryCursor(0);
    setHasMoreHistory(true);
    setBlockedMessage(null);
    setStreamingText("");
    setIsStreaming(false);
    setIsStreamInterrupted(false);
    await bootstrap();
  }, [bootstrap]);

  const loadMoreHistory = useCallback(async (): Promise<void> => {
    const activeSessionUuid = sessionUuidRef.current;
    if (!activeSessionUuid || isHistoryLoading || !hasMoreHistory) return;
    await fetchHistoryPage(activeSessionUuid, historyCursor, false);
  }, [fetchHistoryPage, hasMoreHistory, historyCursor, isHistoryLoading]);

  const clearBlockedMessage = useCallback(() => {
    setBlockedMessage(null);
  }, []);

  return useMemo(
    () => ({
      state,
      sessionUuid,
      messages,
      blockedMessage,
      hasMoreHistory,
      isHistoryLoading,
      streamingText,
      isStreaming,
      isStreamInterrupted,
      isConnected,
      errorMessage,
      sendMessage,
      requestHuman,
      closeChat,
      restartSession,
      loadMoreHistory,
      clearBlockedMessage,
    }),
    [
      blockedMessage,
      clearBlockedMessage,
      closeChat,
      errorMessage,
      hasMoreHistory,
      isHistoryLoading,
      isConnected,
      isStreamInterrupted,
      isStreaming,
      loadMoreHistory,
      messages,
      requestHuman,
      restartSession,
      sendMessage,
      sessionUuid,
      state,
      streamingText,
    ],
  );
}
