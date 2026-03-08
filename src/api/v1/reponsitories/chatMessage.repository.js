import BaseRepository from "./base.reponsitory.js";
import ChatMessageModel from "../models/chat_messages.js";

export default class ChatMessageRepository extends BaseRepository {
  constructor() {
    super(ChatMessageModel);
  }

  async createMessage(payload, options = {}) {
    return this.create(
      {
        ...payload,
        created_at: payload.created_at || new Date(),
      },
      options,
    );
  }

  async getSessionHistory(
    sessionId,
    { limit = 30, offset = 0, fromLatest = true } = {},
    options = {},
  ) {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 30;
    const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

    if (!fromLatest) {
      return this.getModel().findAll({
        where: { session_id: sessionId },
        order: [["created_at", "ASC"]],
        limit: safeLimit,
        offset: safeOffset,
        ...options,
      });
    }

    const total = await this.getModel().count({
      where: { session_id: sessionId },
    });

    const remaining = Math.max(total - safeOffset, 0);
    const windowSize = Math.min(safeLimit, remaining);
    if (windowSize <= 0) return [];

    const windowOffset = Math.max(total - safeOffset - windowSize, 0);

    return this.getModel().findAll({
      where: { session_id: sessionId },
      order: [["created_at", "ASC"]],
      limit: windowSize,
      offset: windowOffset,
      ...options,
    });
  }

  async getLatestMessage(sessionId, options = {}) {
    return this.getModel().findOne({
      where: { session_id: sessionId },
      order: [["created_at", "DESC"]],
      ...options,
    });
  }

  async countBySession(sessionId, options = {}) {
    return this.getModel().count({
      where: { session_id: sessionId },
      ...options,
    });
  }
}
