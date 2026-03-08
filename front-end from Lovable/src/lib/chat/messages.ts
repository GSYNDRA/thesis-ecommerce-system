import type { ChatMessagePayload } from "@/lib/chat/chat.socket";

export function createEventSystemMessage(
  sessionUuid: string,
  content: string,
): ChatMessagePayload {
  return {
    sessionUuid,
    messageId: null,
    senderType: "system",
    senderId: null,
    messageType: "system",
    content,
    timestamp: new Date().toISOString(),
  };
}

function messageKey(message: ChatMessagePayload): string {
  if (message.messageId !== null && message.messageId !== undefined) {
    return `id:${message.messageId}`;
  }

  return [
    message.sessionUuid,
    message.senderType,
    message.messageType,
    message.content,
    message.timestamp,
  ].join("|");
}

export function mergeMessages(
  current: ChatMessagePayload[],
  incoming: ChatMessagePayload[],
): ChatMessagePayload[] {
  const byKey = new Map<string, ChatMessagePayload>();

  [...current, ...incoming].forEach((message) => {
    byKey.set(messageKey(message), message);
  });

  return Array.from(byKey.values()).sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime;
    return a.timestamp.localeCompare(b.timestamp);
  });
}

