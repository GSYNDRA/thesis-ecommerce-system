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
    { limit = 30, offset = 0 } = {},
    options = {},
  ) {
    return this.getModel().findAll({
      where: { session_id: sessionId },
      order: [["created_at", "ASC"]],
      limit,
      offset,
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

