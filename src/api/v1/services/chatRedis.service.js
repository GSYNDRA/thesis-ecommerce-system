import redisClient from "../database/init.redis.js";
import config from "../configs/config.sequelize.js";
import { BadRequestError, InternalServerError } from "../utils/response.util.js";

export class ChatRedisService {
  constructor() {
    this.prefix = config.chat.redisPrefix;
    this.typingTtlSeconds = config.chat.typingTtlSeconds;
    this.heartbeatTimeoutSeconds = config.chat.heartbeatTimeoutSeconds;
  }

  getClient() {
    const client = globalThis.redisClient || redisClient;
    if (!client || !client.isOpen) {
      throw new InternalServerError("Redis client is not available");
    }
    return client;
  }

  normalizeId(value, fieldName = "id") {
    if (value === null || value === undefined) {
      throw new BadRequestError(`${fieldName} is required`);
    }

    const normalized = String(value).trim();
    if (!normalized) {
      throw new BadRequestError(`${fieldName} is invalid`);
    }

    return normalized;
  }

  keyStaffOnline() {
    return `${this.prefix}:staff:online`;
  }

  keyStaffHeartbeat(staffId) {
    return `${this.prefix}:staff:${staffId}:hb`;
  }

  keyChatState(sessionUuid) {
    return `${this.prefix}:session:${sessionUuid}:state`;
  }

  keyTyping(sessionUuid, userId) {
    return `${this.prefix}:typing:${sessionUuid}:${userId}`;
  }

  async markStaffOnline(staffId) {
    const client = this.getClient();
    const normalizedStaffId = this.normalizeId(staffId, "staffId");

    await client.sAdd(this.keyStaffOnline(), normalizedStaffId);
    await this.touchStaffHeartbeat(normalizedStaffId);

    return { staffId: normalizedStaffId, isOnline: true };
  }

  async markStaffOffline(staffId) {
    const client = this.getClient();
    const normalizedStaffId = this.normalizeId(staffId, "staffId");

    await Promise.all([
      client.sRem(this.keyStaffOnline(), normalizedStaffId),
      client.del(this.keyStaffHeartbeat(normalizedStaffId)),
    ]);

    return { staffId: normalizedStaffId, isOnline: false };
  }

  async getOnlineStaffIds() {
    const client = this.getClient();
    return client.sMembers(this.keyStaffOnline());
  }

  async isStaffOnline(staffId) {
    const client = this.getClient();
    const normalizedStaffId = this.normalizeId(staffId, "staffId");
    const isMember = await client.sIsMember(
      this.keyStaffOnline(),
      normalizedStaffId,
    );
    return Boolean(isMember);
  }

  async touchStaffHeartbeat(staffId) {
    const client = this.getClient();
    const normalizedStaffId = this.normalizeId(staffId, "staffId");

    await client.set(this.keyStaffHeartbeat(normalizedStaffId), "1", {
      EX: this.heartbeatTimeoutSeconds,
    });

    return {
      staffId: normalizedStaffId,
      ttlSeconds: this.heartbeatTimeoutSeconds,
    };
  }

  async getStaffHeartbeatTtl(staffId) {
    const client = this.getClient();
    const normalizedStaffId = this.normalizeId(staffId, "staffId");
    return client.ttl(this.keyStaffHeartbeat(normalizedStaffId));
  }

  async setChatState(sessionUuid, state = {}) {
    const client = this.getClient();
    const normalizedSessionUuid = this.normalizeId(sessionUuid, "sessionUuid");
    const key = this.keyChatState(normalizedSessionUuid);

    const payload = {
      updatedAt: state.updatedAt || new Date().toISOString(),
    };

    if (state.mode !== undefined) payload.mode = String(state.mode);
    if (state.status !== undefined) payload.status = String(state.status);
    if (Object.prototype.hasOwnProperty.call(state, "staffId")) {
      payload.staffId =
        state.staffId === null || state.staffId === undefined
          ? ""
          : this.normalizeId(state.staffId, "staffId");
    }

    await client.hSet(key, payload);

    return {
      sessionUuid: normalizedSessionUuid,
      ...payload,
      staffId:
        payload.staffId === undefined || payload.staffId === ""
          ? null
          : payload.staffId,
    };
  }

  async getChatState(sessionUuid) {
    const client = this.getClient();
    const normalizedSessionUuid = this.normalizeId(sessionUuid, "sessionUuid");
    const key = this.keyChatState(normalizedSessionUuid);

    const state = await client.hGetAll(key);
    if (!state || Object.keys(state).length === 0) {
      return null;
    }

    return {
      mode: state.mode || null,
      staffId: state.staffId ? state.staffId : null,
      status: state.status || null,
      updatedAt: state.updatedAt || null,
    };
  }

  async clearChatState(sessionUuid) {
    const client = this.getClient();
    const normalizedSessionUuid = this.normalizeId(sessionUuid, "sessionUuid");
    await client.del(this.keyChatState(normalizedSessionUuid));
    return { sessionUuid: normalizedSessionUuid, cleared: true };
  }

  async setTyping(sessionUuid, userId) {
    const client = this.getClient();
    const normalizedSessionUuid = this.normalizeId(sessionUuid, "sessionUuid");
    const normalizedUserId = this.normalizeId(userId, "userId");

    await client.set(this.keyTyping(normalizedSessionUuid, normalizedUserId), "1", {
      EX: this.typingTtlSeconds,
    });

    return {
      sessionUuid: normalizedSessionUuid,
      userId: normalizedUserId,
      ttlSeconds: this.typingTtlSeconds,
    };
  }

  async clearTyping(sessionUuid, userId) {
    const client = this.getClient();
    const normalizedSessionUuid = this.normalizeId(sessionUuid, "sessionUuid");
    const normalizedUserId = this.normalizeId(userId, "userId");

    await client.del(this.keyTyping(normalizedSessionUuid, normalizedUserId));
    return { sessionUuid: normalizedSessionUuid, userId: normalizedUserId, cleared: true };
  }

  async isTyping(sessionUuid, userId) {
    const client = this.getClient();
    const normalizedSessionUuid = this.normalizeId(sessionUuid, "sessionUuid");
    const normalizedUserId = this.normalizeId(userId, "userId");
    const exists = await client.exists(
      this.keyTyping(normalizedSessionUuid, normalizedUserId),
    );
    return exists === 1;
  }
}

