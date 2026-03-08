import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi, ChatApiError, type GetStaffWorkloadData } from "@/lib/api/chat.api";
import { getChatSocketClient } from "@/lib/chat/chat.socket";
import { getHeartbeatIntervalMs } from "@/lib/chat/heartbeat";
import { useAuth } from "@/contexts/AuthContext";
import { getSession } from "@/lib/auth/session";

export type StaffSupportState =
  | "loading"
  | "ready"
  | "forbidden"
  | "unauthorized"
  | "error";

export interface StaffNotification {
  id: string;
  level: "info" | "warning";
  message: string;
  sessionUuid?: string;
  timestamp: string;
}

interface UseStaffSupportResult {
  state: StaffSupportState;
  workload: GetStaffWorkloadData | null;
  isConnected: boolean;
  errorMessage: string | null;
  isUpdatingAvailability: boolean;
  notifications: StaffNotification[];
  refreshWorkload: () => Promise<void>;
  setAvailability: (isAvailable: boolean) => Promise<boolean>;
  clearNotifications: () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildNotification(message: string, input: Partial<StaffNotification> = {}): StaffNotification {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    level: input.level || "info",
    message,
    sessionUuid: input.sessionUuid,
    timestamp: input.timestamp || nowIso(),
  };
}

function isUnauthorizedConnectError(error: Error): boolean {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("unauthorized") || message.includes("authorization");
}

export function useStaffSupport(limit = 20): UseStaffSupportResult {
  const { accessToken, user, clearAuthSession, refresh } = useAuth();
  const [state, setState] = useState<StaffSupportState>("loading");
  const [workload, setWorkload] = useState<GetStaffWorkloadData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const tokenRef = useRef<string | null>(accessToken);
  const userIdRef = useRef<number | null>(typeof user?.id === "number" ? user.id : null);
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
    userIdRef.current = typeof user?.id === "number" ? user.id : null;
  }, [user?.id]);

  const pushNotification = useCallback((notification: StaffNotification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 20));
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof ChatApiError) {
      if (error.code === "UNAUTHORIZED") {
        clearAuthSession();
        setState("unauthorized");
        setErrorMessage("Your login session has expired. Please login again.");
        return;
      }
      if (error.code === "FORBIDDEN") {
        setState("forbidden");
        setErrorMessage("You are not allowed to access staff support.");
        return;
      }
    }

    setState((prev) => (prev === "loading" ? "error" : prev));
    setErrorMessage(error instanceof Error ? error.message : "Unexpected error");
  }, [clearAuthSession]);

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

  const refreshWorkload = useCallback(async (): Promise<void> => {
    const token = resolveAccessToken();
    if (!token) {
      setState("unauthorized");
      return;
    }

    try {
      const response = await chatApi.getStaffWorkload(token, { limit });
      setWorkload(response.data);
      setState("ready");
      setErrorMessage(null);
    } catch (error) {
      handleApiError(error);
    }
  }, [handleApiError, limit, resolveAccessToken]);

  const setAvailability = useCallback(
    async (isAvailable: boolean): Promise<boolean> => {
      const token = resolveAccessToken();
      if (!token) {
        setState("unauthorized");
        return false;
      }

      setIsUpdatingAvailability(true);
      try {
        const response = await chatApi.setStaffAvailability(token, { isAvailable });
        setWorkload((prev) => {
          if (!prev) return prev;
          return { ...prev, isAvailable: response.data.isAvailable };
        });

        const client = getChatSocketClient();
        if (client.isConnected()) {
          const ack = await client.setAvailability({ isAvailable });
          if (!ack.ok) {
            if (ack.code === "UNAUTHORIZED") {
              await recoverSocketAuth();
              return false;
            }
            setErrorMessage(ack.message || "Failed to sync availability via socket.");
          }
        }

        await refreshWorkload();
        return true;
      } catch (error) {
        handleApiError(error);
        return false;
      } finally {
        setIsUpdatingAvailability(false);
      }
    },
    [handleApiError, recoverSocketAuth, refreshWorkload, resolveAccessToken],
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    const token = resolveAccessToken();
    if (!token) {
      setState("unauthorized");
      setErrorMessage("Login required.");
      return;
    }

    const client = getChatSocketClient();
    const unsubs = [
      client.on("ws:connected", () => {
        setIsConnected(true);
        socketRecoveryAttemptsRef.current = 0;
      }),
      client.on("staff:availability_updated", (payload) => {
        if (userIdRef.current !== payload.staffId) return;
        setWorkload((prev) => {
          if (!prev) return prev;
          return { ...prev, isAvailable: payload.isAvailable };
        });
      }),
      client.on("chat:assigned", (payload) => {
        if (userIdRef.current !== payload.staffId) return;
        pushNotification(
          buildNotification("A chat has been assigned to you.", {
            sessionUuid: payload.sessionUuid,
            timestamp: payload.timestamp,
          }),
        );
        void refreshWorkload();
      }),
      client.on("chat:reassigning", (payload) => {
        pushNotification(
          buildNotification(payload.content || "A chat is being reassigned.", {
            level: "warning",
            sessionUuid: payload.sessionUuid,
            timestamp: payload.timestamp,
          }),
        );
      }),
      client.on("chat:closed", (payload) => {
        pushNotification(
          buildNotification("A chat session has been closed.", {
            sessionUuid: payload.sessionUuid,
            timestamp: payload.timestamp,
          }),
        );
        void refreshWorkload();
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
    }
    void refreshWorkload();

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
      // Keep staff socket alive across route transitions (dashboard <-> room)
      // to avoid backend treating this as a staff disconnect and reassigning sessions.
    };
  }, [pushNotification, recoverSocketAuth, refreshWorkload, resolveAccessToken]);

  useEffect(() => {
    if (!isConnected || state === "unauthorized" || state === "forbidden") return;

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

  return useMemo(
    () => ({
      state,
      workload,
      isConnected,
      errorMessage,
      isUpdatingAvailability,
      notifications,
      refreshWorkload,
      setAvailability,
      clearNotifications,
    }),
    [
      clearNotifications,
      errorMessage,
      isConnected,
      isUpdatingAvailability,
      notifications,
      refreshWorkload,
      setAvailability,
      state,
      workload,
    ],
  );
}
