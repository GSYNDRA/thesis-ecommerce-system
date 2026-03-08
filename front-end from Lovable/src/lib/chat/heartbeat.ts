const DEFAULT_HEARTBEAT_INTERVAL_MS = 5000;
const MIN_HEARTBEAT_INTERVAL_MS = 1000;

export function getHeartbeatIntervalMs(): number {
  const raw = import.meta.env.VITE_CHAT_HEARTBEAT_INTERVAL_MS;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed >= MIN_HEARTBEAT_INTERVAL_MS) {
    return parsed;
  }
  return DEFAULT_HEARTBEAT_INTERVAL_MS;
}

