import { Op } from "sequelize";
import BaseRepository from "./base.reponsitory.js";
import ChatSessionModel from "../models/chat_sessions.js";

export default class ChatSessionRepository extends BaseRepository {
  constructor() {
    super(ChatSessionModel);
  }

  async createSession(payload, options = {}) {
    return this.create(payload, options);
  }

  async findBySessionUuid(sessionUuid, options = {}) {
    return this.getModel().findOne({
      where: { session_uuid: sessionUuid },
      ...options,
    });
  }

  async findOpenByUserId(userId, options = {}) {
    return this.getModel().findOne({
      where: {
        user_id: userId,
        status: { [Op.in]: ["active", "escalation_pending"] },
      },
      order: [["updated_at", "DESC"]],
      ...options,
    });
  }

  async findOpenByStaffId(staffId, options = {}) {
    return this.getModel().findAll({
      where: {
        current_staff_id: staffId,
        status: { [Op.in]: ["active", "escalation_pending"] },
      },
      order: [["updated_at", "DESC"]],
      ...options,
    });
  }

  async updateBySessionUuid(sessionUuid, updates, options = {}) {
    return this.getModel().update(
      { ...updates, updated_at: new Date() },
      {
        where: { session_uuid: sessionUuid },
        ...options,
      },
    );
  }

  async assignStaff(sessionUuid, staffId, options = {}) {
    return this.updateBySessionUuid(
      sessionUuid,
      {
        mode: "human",
        status: "active",
        current_staff_id: staffId,
      },
      options,
    );
  }

  async markEscalationPending(sessionUuid, options = {}) {
    return this.updateBySessionUuid(
      sessionUuid,
      {
        status: "escalation_pending",
        current_staff_id: null,
      },
      options,
    );
  }

  async closeSession(sessionUuid, options = {}) {
    const now = new Date();
    return this.getModel().update(
      {
        mode: "ai",
        status: "closed",
        current_staff_id: null,
        closed_at: now,
        updated_at: now,
      },
      {
        where: { session_uuid: sessionUuid },
        ...options,
      },
    );
  }
}
