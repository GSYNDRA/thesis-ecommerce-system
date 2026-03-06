import redisClient from "../database/init.redis.js";
import config from "../configs/config.sequelize.js";
import { ChatRedisService } from "./chatRedis.service.js";
import { ChatService } from "./chat.service.js";

const EXPIRED_EVENT_PATTERN = "__keyevent@0__:expired";

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class StaffHeartbeatExpirySubscriber {
  constructor() {
    this.subscriber = null;
    this.worker = null;
    this.started = false;
    this.chatRedisService = new ChatRedisService();
    this.chatService = new ChatService();
    const prefix = escapeRegex(config.chat.redisPrefix);
    this.heartbeatKeyRegex = new RegExp(`^${prefix}:staff:(\\d+):hb$`);
  }

  async start() {
    if (this.started) return;

    this.worker = redisClient.duplicate();
    this.subscriber = redisClient.duplicate();

    await Promise.all([this.worker.connect(), this.subscriber.connect()]);
    await this.ensureKeyspaceNotificationConfig();

    await this.subscriber.pSubscribe(EXPIRED_EVENT_PATTERN, (message, channel) => {
      this.handleExpiredEvent(channel, message).catch((error) => {
        console.error(
          "[StaffHeartbeatExpirySubscriber] handleExpiredEvent error:",
          error?.message || error,
        );
      });
    });

    this.started = true;
    console.log(
      `[StaffHeartbeatExpirySubscriber] Listening on pattern: ${EXPIRED_EVENT_PATTERN}`,
    );
  }

  async stop() {
    if (!this.started) return;

    try {
      if (this.subscriber?.isOpen) {
        await this.subscriber.pUnsubscribe(EXPIRED_EVENT_PATTERN);
        await this.subscriber.quit();
      }
    } catch (error) {
      console.error(
        "[StaffHeartbeatExpirySubscriber] Failed to stop subscriber:",
        error?.message || error,
      );
    }

    try {
      if (this.worker?.isOpen) {
        await this.worker.quit();
      }
    } catch (error) {
      console.error(
        "[StaffHeartbeatExpirySubscriber] Failed to stop worker:",
        error?.message || error,
      );
    }

    this.subscriber = null;
    this.worker = null;
    this.started = false;
  }

  async ensureKeyspaceNotificationConfig() {
    try {
      const configMap = await this.worker.configGet("notify-keyspace-events");
      const current = configMap?.["notify-keyspace-events"] || "";
      if (current.includes("E") && current.includes("x")) return;

      const merged = Array.from(new Set(`${current}Ex`.split(""))).join("");
      await this.worker.configSet("notify-keyspace-events", merged);
      console.log(
        `[StaffHeartbeatExpirySubscriber] notify-keyspace-events updated: ${merged}`,
      );
    } catch (error) {
      console.warn(
        "[StaffHeartbeatExpirySubscriber] Could not auto-configure notify-keyspace-events. Set manually to include Ex.",
      );
      console.warn(error?.message || error);
    }
  }

  extractStaffIdFromHeartbeatKey(key) {
    const match = this.heartbeatKeyRegex.exec(String(key || ""));
    if (!match?.[1]) return null;
    const staffId = Number(match[1]);
    return Number.isInteger(staffId) && staffId > 0 ? staffId : null;
  }

  async handleExpiredEvent(channel, key) {
    if (channel !== EXPIRED_EVENT_PATTERN) return;

    const staffId = this.extractStaffIdFromHeartbeatKey(key);
    if (!staffId) return;

    // Guard against race: ignore stale event if heartbeat has already been renewed.
    const ttl = await this.chatRedisService.getStaffHeartbeatTtl(staffId);
    if (Number(ttl) > 0) return;

    const result = await this.chatService.handleStaffDisconnect(staffId);
    this.emitReassignmentEvents(result);

    console.log(
      `[StaffHeartbeatExpirySubscriber] Staff ${staffId} marked offline due to heartbeat expiration`,
    );
  }

  emitReassignmentEvents(result) {
    const io = globalThis.io;
    if (!io) return;

    for (const item of result?.sessions || []) {
      if (!item?.sessionUuid) continue;

      const room = `chat:${item.sessionUuid}`;
      io.to(room).emit("chat:reassigning", {
        sessionUuid: item.sessionUuid,
        senderType: "system",
        content: "Your support agent disconnected. Reassigning your chat now.",
        timestamp: new Date().toISOString(),
      });

      if (item.reassigned) {
        io.in(`user:${item.newStaffId}`).socketsJoin(room);
        io.to(room).emit("chat:assigned", {
          sessionUuid: item.sessionUuid,
          senderType: "system",
          content: "Your chat has been reassigned to another support agent.",
          staffId: item.newStaffId,
          previousStaffId: item.previousStaffId || null,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}

const staffHeartbeatExpirySubscriber = new StaffHeartbeatExpirySubscriber();
export default staffHeartbeatExpirySubscriber;

