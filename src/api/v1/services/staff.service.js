import { BadRequestError } from "../utils/response.util.js";
import config from "../configs/config.sequelize.js";
import ChatSessionRepository from "../reponsitories/chatSession.repository.js";
import ChatTransferRepository from "../reponsitories/chatTransfer.repository.js";
import StaffAvailabilityRepository from "../reponsitories/staffAvailability.repository.js";
import { ChatRedisService } from "./chatRedis.service.js";

export class StaffService {
  constructor() {
    this.chatSessionRepository = new ChatSessionRepository();
    this.chatTransferRepository = new ChatTransferRepository();
    this.staffAvailabilityRepository = new StaffAvailabilityRepository();
    this.chatRedisService = new ChatRedisService();
  }

  normalizeStaffId(staffId, fieldName = "staffId") {
    const parsed = Number(staffId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestError(`${fieldName} must be a positive integer`);
    }
    return parsed;
  }

  normalizeSessionUuid(sessionUuid) {
    const normalized = String(sessionUuid || "").trim();
    if (!normalized) {
      throw new BadRequestError("sessionUuid is required");
    }
    return normalized;
  }

  async safeSetChatState(sessionUuid, state) {
    try {
      await this.chatRedisService.setChatState(sessionUuid, state);
    } catch (error) {
      console.warn(
        `[StaffService] Failed to sync Redis chat state for ${sessionUuid}:`,
        error?.message || error,
      );
    }
  }

  async markOnline(staffId) {
    const normalizedStaffId = this.normalizeStaffId(staffId);
    const now = new Date();

    await this.staffAvailabilityRepository.upsertStaffStatus(normalizedStaffId, {
      is_online: true,
      is_available: true,
      last_heartbeat: now,
      updated_at: now,
    });

    await this.chatRedisService.markStaffOnline(normalizedStaffId);

    return {
      staffId: normalizedStaffId,
      isOnline: true,
      isAvailable: true,
    };
  }

  async markOffline(staffId) {
    const normalizedStaffId = this.normalizeStaffId(staffId);
    const now = new Date();

    await this.staffAvailabilityRepository.upsertStaffStatus(normalizedStaffId, {
      is_online: false,
      is_available: false,
      updated_at: now,
    });

    await this.chatRedisService.markStaffOffline(normalizedStaffId);

    return {
      staffId: normalizedStaffId,
      isOnline: false,
      isAvailable: false,
    };
  }

  async heartbeat(staffId) {
    const normalizedStaffId = this.normalizeStaffId(staffId);
    const now = new Date();

    await this.staffAvailabilityRepository.upsertStaffStatus(normalizedStaffId, {
      is_online: true,
      last_heartbeat: now,
      updated_at: now,
    });

    await this.chatRedisService.touchStaffHeartbeat(normalizedStaffId);

    return {
      staffId: normalizedStaffId,
      lastHeartbeat: now.toISOString(),
    };
  }

  async setAvailability(staffId, isAvailable) {
    const normalizedStaffId = this.normalizeStaffId(staffId);
    const available = Boolean(isAvailable);
    const now = new Date();

    await this.staffAvailabilityRepository.upsertStaffStatus(normalizedStaffId, {
      is_available: available,
      updated_at: now,
    });

    return {
      staffId: normalizedStaffId,
      isAvailable: available,
    };
  }

  async pickAvailableStaff({ excludeStaffIds = [] } = {}, options = {}) {
    const normalizedExcludeIds = excludeStaffIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    const dbCandidates = await this.staffAvailabilityRepository.findAvailableStaff(
      {
        maxConcurrent: config.chat.maxConcurrentPerStaff,
        excludeStaffIds: normalizedExcludeIds,
      },
      options,
    );

    if (!dbCandidates || dbCandidates.length === 0) {
      return null;
    }

    // Prefer IDs that are currently in Redis online set.
    try {
      const onlineIds = await this.chatRedisService.getOnlineStaffIds();
      const onlineSet = new Set((onlineIds || []).map((id) => String(id)));
      const filtered = dbCandidates.filter((row) =>
        onlineSet.has(String(row.staff_id)),
      );

      if (filtered.length > 0) {
        return filtered[0];
      }
    } catch (error) {
      console.warn(
        "[StaffService] Redis online set check failed, fallback to DB candidates:",
        error?.message || error,
      );
    }

    return dbCandidates[0];
  }

  async assignSessionToStaff({
    sessionUuid,
    reason = "Customer requested human support",
    excludeStaffIds = [],
  }) {
    const normalizedSessionUuid = this.normalizeSessionUuid(sessionUuid);
    const sequelize = this.chatSessionRepository.sequelize;
    const tx = await sequelize.transaction();

    try {
      const session = await this.chatSessionRepository.findBySessionUuid(
        normalizedSessionUuid,
        { transaction: tx, lock: tx.LOCK.UPDATE },
      );

      if (!session) {
        await tx.rollback();
        return { assigned: false, reason: "SESSION_NOT_FOUND" };
      }

      if (session.status === "closed") {
        await tx.rollback();
        return { assigned: false, reason: "SESSION_CLOSED" };
      }

      if (session.mode === "human" && session.current_staff_id) {
        await tx.rollback();
        return {
          assigned: true,
          alreadyAssigned: true,
          staffId: session.current_staff_id,
          sessionUuid: normalizedSessionUuid,
        };
      }

      await this.chatSessionRepository.updateBySessionUuid(
        normalizedSessionUuid,
        {
          mode: "ai",
          status: "escalation_pending",
          current_staff_id: null,
        },
        { transaction: tx },
      );

      const staff = await this.pickAvailableStaff(
        { excludeStaffIds },
        { transaction: tx, lock: tx.LOCK.UPDATE },
      );

      if (!staff) {
        await tx.commit();
        await this.safeSetChatState(normalizedSessionUuid, {
          mode: "ai",
          status: "escalation_pending",
          staffId: null,
          updatedAt: new Date().toISOString(),
        });
        return { assigned: false, reason: "NO_STAFF_AVAILABLE" };
      }

      const targetStaffId = this.normalizeStaffId(staff.staff_id, "targetStaffId");

      await this.chatSessionRepository.assignStaff(
        normalizedSessionUuid,
        targetStaffId,
        { transaction: tx },
      );
      await this.staffAvailabilityRepository.incrementCurrentChats(targetStaffId, {
        transaction: tx,
      });

      const transfer = await this.chatTransferRepository.createPendingTransfer(
        {
          session_id: session.id,
          from_staff_id: session.current_staff_id || null,
          to_staff_id: targetStaffId,
          reason,
          status: "pending",
        },
        { transaction: tx },
      );

      await this.chatTransferRepository.resolveTransfer(transfer.id, "accepted", {
        transaction: tx,
      });

      await tx.commit();

      await this.safeSetChatState(normalizedSessionUuid, {
        mode: "human",
        status: "active",
        staffId: targetStaffId,
        updatedAt: new Date().toISOString(),
      });

      return {
        assigned: true,
        alreadyAssigned: false,
        sessionUuid: normalizedSessionUuid,
        staffId: targetStaffId,
        transferRequestId: transfer.id,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async reassignOnStaffDisconnect({
    sessionUuid,
    disconnectedStaffId,
    reason = "Assigned staff disconnected",
  }) {
    const normalizedSessionUuid = this.normalizeSessionUuid(sessionUuid);
    const parsedDisconnectedId =
      disconnectedStaffId === null || disconnectedStaffId === undefined
        ? null
        : this.normalizeStaffId(disconnectedStaffId, "disconnectedStaffId");

    const sequelize = this.chatSessionRepository.sequelize;
    const tx = await sequelize.transaction();

    try {
      const session = await this.chatSessionRepository.findBySessionUuid(
        normalizedSessionUuid,
        { transaction: tx, lock: tx.LOCK.UPDATE },
      );

      if (!session) {
        await tx.rollback();
        return { reassigned: false, reason: "SESSION_NOT_FOUND" };
      }

      if (session.status === "closed") {
        await tx.rollback();
        return { reassigned: false, reason: "SESSION_CLOSED" };
      }

      const previousStaffId =
        session.current_staff_id || parsedDisconnectedId || null;

      await this.chatSessionRepository.updateBySessionUuid(
        normalizedSessionUuid,
        {
          mode: "ai",
          status: "escalation_pending",
          current_staff_id: null,
        },
        { transaction: tx },
      );

      if (previousStaffId) {
        await this.staffAvailabilityRepository.decrementCurrentChats(previousStaffId, {
          transaction: tx,
        });
      }

      const staff = await this.pickAvailableStaff(
        {
          excludeStaffIds: previousStaffId ? [previousStaffId] : [],
        },
        { transaction: tx, lock: tx.LOCK.UPDATE },
      );

      if (!staff) {
        await tx.commit();
        await this.safeSetChatState(normalizedSessionUuid, {
          mode: "ai",
          status: "escalation_pending",
          staffId: null,
          updatedAt: new Date().toISOString(),
        });
        return {
          reassigned: false,
          reason: "NO_STAFF_AVAILABLE",
          sessionUuid: normalizedSessionUuid,
        };
      }

      const newStaffId = this.normalizeStaffId(staff.staff_id, "newStaffId");

      await this.chatSessionRepository.assignStaff(normalizedSessionUuid, newStaffId, {
        transaction: tx,
      });
      await this.staffAvailabilityRepository.incrementCurrentChats(newStaffId, {
        transaction: tx,
      });

      const transfer = await this.chatTransferRepository.createPendingTransfer(
        {
          session_id: session.id,
          from_staff_id: previousStaffId,
          to_staff_id: newStaffId,
          reason,
          status: "pending",
        },
        { transaction: tx },
      );

      await this.chatTransferRepository.resolveTransfer(transfer.id, "accepted", {
        transaction: tx,
      });

      await tx.commit();

      await this.safeSetChatState(normalizedSessionUuid, {
        mode: "human",
        status: "active",
        staffId: newStaffId,
        updatedAt: new Date().toISOString(),
      });

      return {
        reassigned: true,
        sessionUuid: normalizedSessionUuid,
        previousStaffId,
        newStaffId,
        transferRequestId: transfer.id,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async closeStaffWorkOnSession({ sessionUuid, staffId = null }) {
    const normalizedSessionUuid = this.normalizeSessionUuid(sessionUuid);
    const parsedStaffId =
      staffId === null || staffId === undefined
        ? null
        : this.normalizeStaffId(staffId, "staffId");

    const session = await this.chatSessionRepository.findBySessionUuid(
      normalizedSessionUuid,
    );

    if (!session) {
      return { updated: false, reason: "SESSION_NOT_FOUND" };
    }

    if (!session.current_staff_id) {
      return { updated: false, reason: "NO_STAFF_ASSIGNED" };
    }

    if (parsedStaffId && parsedStaffId !== session.current_staff_id) {
      return { updated: false, reason: "STAFF_MISMATCH" };
    }

    await this.staffAvailabilityRepository.decrementCurrentChats(
      session.current_staff_id,
    );
    await this.chatSessionRepository.updateBySessionUuid(normalizedSessionUuid, {
      mode: "ai",
      current_staff_id: null,
    });

    await this.safeSetChatState(normalizedSessionUuid, {
      mode: "ai",
      status: session.status,
      staffId: null,
      updatedAt: new Date().toISOString(),
    });

    return {
      updated: true,
      sessionUuid: normalizedSessionUuid,
      releasedStaffId: session.current_staff_id,
    };
  }

  async getOpenSessionsByStaff(staffId, options = {}) {
    const normalizedStaffId = this.normalizeStaffId(staffId);
    return this.chatSessionRepository.findOpenByStaffId(normalizedStaffId, options);
  }

  async handleStaffDisconnect(staffId) {
    const normalizedStaffId = this.normalizeStaffId(staffId);

    await this.markOffline(normalizedStaffId);

    const sessions = await this.getOpenSessionsByStaff(normalizedStaffId);
    const results = [];

    for (const session of sessions) {
      const result = await this.reassignOnStaffDisconnect({
        sessionUuid: session.session_uuid,
        disconnectedStaffId: normalizedStaffId,
      });
      results.push(result);
    }

    return {
      staffId: normalizedStaffId,
      reassignCount: results.length,
      sessions: results,
    };
  }
}
