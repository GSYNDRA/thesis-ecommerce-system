import { Op } from "sequelize";
import BaseRepository from "./base.reponsitory.js";
import UserSessionModel from "../models/user_sessions.js";

export default class UserSessionRepository extends BaseRepository {
  constructor() {
    super(UserSessionModel);
  }

  async findActiveSessionsByUser(userId) {
    return this.getModel().findAll({
      where: { user_id: userId, revoked: false },
      order: [["createdAt", "ASC"]],
    });
  }

  async revokeSessions(ids, reason = "admin_action") {
    if (!ids?.length) return;
    return this.getModel().update(
      { revoked: true, revoked_reason: reason, revoked_at: new Date() },
      { where: { id: { [Op.in]: ids } } }
    );
  }
  async enforceLimit(userId, maxSessions) {
    const sessions = await this.findActiveSessionsByUser(userId);
    const overflow = sessions.length - (maxSessions - 1);
    if (overflow > 0) {
      const toRevoke = sessions.slice(0, overflow).map((s) => s.id);
      await this.revokeSessions(toRevoke, "logout");
    }
    return sessions;
  }
  
  async revokeAllSessionsForUser(userId, reason = "password_change") {
    return this.getModel().update(
      { revoked: true, revoked_reason: reason, revoked_at: new Date() },
      { where: { user_id: userId, revoked: false } }
    );
  }

}
