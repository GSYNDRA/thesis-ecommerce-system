import { USER_ROLE } from "../constants/common.constant.js";
import { ChatService } from "../services/chat.service.js";
import { StaffService } from "../services/staff.service.js";
import { ForbiddenError, SuccessResponse } from "../utils/response.util.js";

function toIsoTimestamp(value) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function formatMessage(message, sessionUuid) {
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

export class ChatController {
  constructor() {
    this.chatService = new ChatService();
    this.staffService = new StaffService();
  }

  isStaffRole(roleId) {
    return Number(roleId) !== USER_ROLE.CUSTOMER;
  }

  ensureCustomer(req) {
    if (this.isStaffRole(req.auth?.role)) {
      throw new ForbiddenError("Only customers can use this endpoint");
    }
  }

  ensureStaff(req) {
    if (!this.isStaffRole(req.auth?.role)) {
      throw new ForbiddenError("Only staff can use this endpoint");
    }
  }

  getActiveSession = async (req, res, next) => {
    try {
      this.ensureCustomer(req);

      const { session, created } = await this.chatService.getOrCreateActiveSession(
        req.auth.userId,
      );

      SuccessResponse.ok(
        {
          created,
          session: {
            sessionUuid: session.session_uuid,
            mode: session.mode,
            status: session.status,
            currentStaffId: session.current_staff_id,
            createdAt: toIsoTimestamp(session.created_at || session.createdAt),
            updatedAt: toIsoTimestamp(session.updated_at || session.updatedAt),
          },
        },
        "Active chat session fetched successfully",
      ).send(res);
    } catch (error) {
      next(error);
    }
  };

  getSessionHistory = async (req, res, next) => {
    try {
      const limit = Number(req.query?.limit);
      const offset = Number(req.query?.offset);

      const history = await this.chatService.getSessionHistoryForActor({
        sessionUuid: req.params.sessionUuid,
        actorUserId: req.auth.userId,
        actorRoleId: req.auth.role,
        limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
        offset: Number.isInteger(offset) && offset >= 0 ? offset : undefined,
      });

      SuccessResponse.ok(
        {
          sessionUuid: history.sessionUuid,
          mode: history.mode,
          status: history.status,
          currentStaffId: history.currentStaffId,
          messages: history.messages.map((message) =>
            formatMessage(message, history.sessionUuid),
          ),
        },
        "Chat history fetched successfully",
      ).send(res);
    } catch (error) {
      next(error);
    }
  };

  requestHumanSupport = async (req, res, next) => {
    try {
      this.ensureCustomer(req);

      const sessionUuid = req.params.sessionUuid;
      const reason =
        req.body?.reason || "Customer requested human support via HTTP API";

      const result = await this.chatService.requestHumanSupport({
        sessionUuid,
        reason,
        requesterUserId: req.auth.userId,
      });

      SuccessResponse.ok(result, "Human support request processed").send(res);
    } catch (error) {
      next(error);
    }
  };

  closeSession = async (req, res, next) => {
    try {
      const result = await this.chatService.closeSessionForActor({
        sessionUuid: req.params.sessionUuid,
        actorUserId: req.auth.userId,
        actorRoleId: req.auth.role,
      });

      SuccessResponse.ok(result, "Chat session closed successfully").send(res);
    } catch (error) {
      next(error);
    }
  };

  setStaffAvailability = async (req, res, next) => {
    try {
      this.ensureStaff(req);

      const result = await this.staffService.setAvailability(
        req.auth.userId,
        req.body.isAvailable,
      );
      let autoAssignResult = null;

      if (result.isAvailable) {
        autoAssignResult = await this.staffService.assignPendingSessionToStaff(
          req.auth.userId,
          {
            reason: "Staff set availability to online via HTTP API",
          },
        );

        if (autoAssignResult?.assigned && autoAssignResult?.sessionUuid) {
          const room = `chat:${autoAssignResult.sessionUuid}`;
          const io = globalThis.io;

          await this.chatService.createSystemMessage(
            autoAssignResult.sessionUuid,
            "You have been connected to a human support agent.",
          );

          if (io) {
            io.in(`user:${autoAssignResult.staffId}`).socketsJoin(room);
            io.to(room).emit("chat:assigned", {
              sessionUuid: autoAssignResult.sessionUuid,
              senderType: "system",
              content: "You have been connected to a human support agent.",
              staffId: autoAssignResult.staffId,
              autoAssigned: true,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      SuccessResponse.ok(
        {
          ...result,
          autoAssignedSessionUuid: autoAssignResult?.assigned
            ? autoAssignResult.sessionUuid
            : null,
        },
        "Staff availability updated successfully",
      ).send(res);
    } catch (error) {
      next(error);
    }
  };

  getStaffWorkload = async (req, res, next) => {
    try {
      this.ensureStaff(req);
      const sessionLimit = Number(req.query?.limit);
      const result = await this.staffService.getStaffWorkload(req.auth.userId, {
        sessionLimit: Number.isInteger(sessionLimit) && sessionLimit > 0
          ? sessionLimit
          : undefined,
      });

      SuccessResponse.ok(result, "Staff workload fetched successfully").send(res);
    } catch (error) {
      next(error);
    }
  };
}
