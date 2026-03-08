import { io, type Socket } from "socket.io-client";
import { WS_URL } from "@/lib/api/client";

export type ChatTokenTransport = "auth" | "header" | "query";

export type ChatSocketServerEvent =
  | "ws:connected"
  | "chat:initialized"
  | "chat:new_message"
  | "chat:ai_token"
  | "chat:ai_message_complete"
  | "chat:assigned"
  | "chat:reassigning"
  | "chat:closed"
  | "staff:availability_updated";

export interface ChatSocketAck {
  ok: boolean;
  event: string;
  timestamp: string;
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export interface WsConnectedPayload {
  userId: number | null;
  roleId: number | null;
  isStaff: boolean;
  timestamp: string;
}

export interface ChatMessagePayload {
  sessionUuid: string;
  messageId: number | null;
  senderType: string;
  senderId: number | null;
  messageType: string;
  content: string;
  timestamp: string;
}

export interface ChatInitializedPayload {
  sessionUuid: string;
  mode: string;
  status: string;
  currentStaffId: number | null;
  messages: ChatMessagePayload[];
  timestamp: string;
}

export interface ChatAiTokenPayload {
  sessionUuid: string;
  token: string;
  timestamp: string;
}

export interface ChatAiMessageCompletePayload {
  sessionUuid: string;
  content: string;
  streamMode: string | null;
  timestamp: string;
}

export interface ChatAssignedPayload {
  sessionUuid: string;
  senderType: string;
  content: string;
  staffId: number;
  autoAssigned?: boolean;
  previousStaffId?: number | null;
  timestamp: string;
}

export interface ChatReassigningPayload {
  sessionUuid: string;
  senderType: string;
  content: string;
  reason?: string;
  timestamp: string;
}

export interface ChatClosedPayload {
  sessionUuid: string;
  senderType: string;
  content: string;
  timestamp: string;
}

export interface StaffAvailabilityUpdatedPayload {
  staffId: number;
  isAvailable: boolean;
  timestamp: string;
}

interface ServerEventPayloadMap {
  "ws:connected": WsConnectedPayload;
  "chat:initialized": ChatInitializedPayload;
  "chat:new_message": ChatMessagePayload;
  "chat:ai_token": ChatAiTokenPayload;
  "chat:ai_message_complete": ChatAiMessageCompletePayload;
  "chat:assigned": ChatAssignedPayload;
  "chat:reassigning": ChatReassigningPayload;
  "chat:closed": ChatClosedPayload;
  "staff:availability_updated": StaffAvailabilityUpdatedPayload;
}

type ServerEventListener<K extends ChatSocketServerEvent> = (
  payload: ServerEventPayloadMap[K],
) => void;

export interface ChatInitPayload {
  sessionUuid?: string;
}

export interface ChatSendPayload {
  sessionUuid: string;
  content: string;
}

export interface ChatRequestHumanPayload {
  sessionUuid: string;
  reason?: string;
}

export interface ChatClosePayload {
  sessionUuid: string;
}

export interface StaffAvailabilityPayload {
  isAvailable: boolean;
}

export interface ChatSocketConnectOptions {
  token: string;
  tokenTransport?: ChatTokenTransport;
  url?: string;
}

type SocketConnectErrorListener = (error: Error) => void;
type SocketDisconnectListener = (reason: Socket.DisconnectReason) => void;

const SERVER_EVENTS: ChatSocketServerEvent[] = [
  "ws:connected",
  "chat:initialized",
  "chat:new_message",
  "chat:ai_token",
  "chat:ai_message_complete",
  "chat:assigned",
  "chat:reassigning",
  "chat:closed",
  "staff:availability_updated",
];

export class ChatSocketClient {
  private socket: Socket | null = null;
  private connectionKey: string | null = null;
  private readonly listeners = new Map<
    ChatSocketServerEvent,
    Set<(payload: unknown) => void>
  >();
  private readonly forwarders = new Map<ChatSocketServerEvent, (payload: unknown) => void>();
  private readonly connectErrorListeners = new Set<SocketConnectErrorListener>();
  private readonly disconnectListeners = new Set<SocketDisconnectListener>();

  constructor() {
    SERVER_EVENTS.forEach((event) => {
      this.listeners.set(event, new Set());
    });
  }

  connect(options: ChatSocketConnectOptions): Socket {
    const tokenTransport = options.tokenTransport || "auth";
    const normalizedUrl = (options.url || WS_URL).replace(/\/+$/, "");
    const nextConnectionKey = `${normalizedUrl}|${tokenTransport}|${options.token}`;

    if (this.socket && this.connectionKey === nextConnectionKey) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.disconnect();

    const socketOptions: Parameters<typeof io>[1] = {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      transports: ["websocket", "polling"],
    };

    if (tokenTransport === "auth") {
      socketOptions.auth = { token: options.token };
    } else if (tokenTransport === "header") {
      socketOptions.extraHeaders = {
        Authorization: `Bearer ${options.token}`,
      };
    } else {
      socketOptions.query = { token: options.token };
    }

    const socket = io(normalizedUrl, socketOptions);
    this.socket = socket;
    this.connectionKey = nextConnectionKey;
    this.attachForwarders(socket);
    socket.on("connect_error", this.handleConnectError);
    socket.on("disconnect", this.handleDisconnect);
    socket.connect();
    return socket;
  }

  disconnect(): void {
    if (!this.socket) return;

    SERVER_EVENTS.forEach((event) => {
      const forwarder = this.forwarders.get(event);
      if (forwarder) {
        this.socket?.off(event, forwarder);
      }
    });

    this.socket.off("connect_error", this.handleConnectError);
    this.socket.off("disconnect", this.handleDisconnect);
    this.socket.disconnect();
    this.socket = null;
    this.connectionKey = null;
    this.forwarders.clear();
  }

  destroy(): void {
    this.disconnect();
    this.connectErrorListeners.clear();
    this.disconnectListeners.clear();
    this.listeners.forEach((set) => set.clear());
  }

  isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  on<K extends ChatSocketServerEvent>(
    event: K,
    listener: ServerEventListener<K>,
  ): () => void {
    const set = this.listeners.get(event);
    if (!set) return () => undefined;
    const wrapped = listener as (payload: unknown) => void;
    set.add(wrapped);
    return () => {
      set.delete(wrapped);
    };
  }

  onConnectError(listener: SocketConnectErrorListener): () => void {
    this.connectErrorListeners.add(listener);
    return () => {
      this.connectErrorListeners.delete(listener);
    };
  }

  onDisconnect(listener: SocketDisconnectListener): () => void {
    this.disconnectListeners.add(listener);
    return () => {
      this.disconnectListeners.delete(listener);
    };
  }

  async init(payload: ChatInitPayload = {}): Promise<ChatSocketAck> {
    return this.emitWithAck("chat:init", payload);
  }

  async send(payload: ChatSendPayload): Promise<ChatSocketAck> {
    return this.emitWithAck("chat:send", payload);
  }

  async requestHuman(payload: ChatRequestHumanPayload): Promise<ChatSocketAck> {
    return this.emitWithAck("chat:request_human", payload);
  }

  async close(payload: ChatClosePayload): Promise<ChatSocketAck> {
    return this.emitWithAck("chat:close", payload);
  }

  async setAvailability(payload: StaffAvailabilityPayload): Promise<ChatSocketAck> {
    return this.emitWithAck("staff:availability", payload);
  }

  heartbeat(): void {
    if (!this.socket) {
      throw new Error("Socket is not connected");
    }
    this.socket.emit("ws:heartbeat");
  }

  private attachForwarders(socket: Socket): void {
    SERVER_EVENTS.forEach((event) => {
      const forwarder = (payload: unknown) => {
        const set = this.listeners.get(event);
        if (!set || set.size === 0) return;
        set.forEach((listener) => listener(payload));
      };

      this.forwarders.set(event, forwarder);
      socket.on(event, forwarder);
    });
  }

  private emitWithAck(event: string, payload: Record<string, unknown>): Promise<ChatSocketAck> {
    if (!this.socket) {
      return Promise.reject(new Error("Socket is not connected"));
    }

    return new Promise<ChatSocketAck>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error(`Socket acknowledgement timeout for ${event}`));
      }, 10000);

      this.socket?.emit(event, payload, (ack: ChatSocketAck) => {
        window.clearTimeout(timeout);
        resolve(ack);
      });
    });
  }

  private handleConnectError = (error: Error) => {
    this.connectErrorListeners.forEach((listener) => listener(error));
  };

  private handleDisconnect = (reason: Socket.DisconnectReason) => {
    this.disconnectListeners.forEach((listener) => listener(reason));
  };
}

let chatSocketSingleton: ChatSocketClient | null = null;

export function getChatSocketClient(): ChatSocketClient {
  if (!chatSocketSingleton) {
    chatSocketSingleton = new ChatSocketClient();
  }
  return chatSocketSingleton;
}
