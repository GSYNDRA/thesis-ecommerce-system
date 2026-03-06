export function toIsoTimestamp(value) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export function buildMessagePayload(message, sessionUuid) {
  return {
    sessionUuid,
    messageId: message?.id ?? null,
    senderType: message?.sender_type || "system",
    senderId: message?.sender_id ?? null,
    messageType: message?.message_type || "text",
    content: message?.content || "",
    timestamp: toIsoTimestamp(message?.created_at),
  };
}

export function emitAck(ack, event, data = {}) {
  if (typeof ack !== "function") return;
  ack({
    ok: true,
    event,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export function emitError(ack, event, error, fallbackCode = "SOCKET_ERROR") {
  if (typeof ack !== "function") return;
  ack({
    ok: false,
    event,
    code: error?.errorType || fallbackCode,
    message: error?.message || "Unexpected socket error",
    timestamp: new Date().toISOString(),
  });
}

