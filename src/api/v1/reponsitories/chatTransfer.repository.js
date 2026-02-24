import BaseRepository from "./base.reponsitory.js";
import ChatTransferModel from "../models/chat_transfer_requests.js";

export default class ChatTransferRepository extends BaseRepository {
  constructor() {
    super(ChatTransferModel);
  }

  async createPendingTransfer(payload, options = {}) {
    return this.create(
      {
        ...payload,
        status: payload.status || "pending",
        created_at: payload.created_at || new Date(),
      },
      options,
    );
  }

  async getPendingBySessionId(sessionId, options = {}) {
    return this.getModel().findOne({
      where: {
        session_id: sessionId,
        status: "pending",
      },
      order: [["created_at", "DESC"]],
      ...options,
    });
  }

  async getById(id, options = {}) {
    return this.getModel().findByPk(id, options);
  }

  async resolveTransfer(id, status, options = {}) {
    return this.getModel().update(
      {
        status,
        responded_at: new Date(),
      },
      {
        where: { id },
        ...options,
      },
    );
  }

  async listBySessionId(sessionId, options = {}) {
    return this.getModel().findAll({
      where: { session_id: sessionId },
      order: [["created_at", "DESC"]],
      ...options,
    });
  }
}

