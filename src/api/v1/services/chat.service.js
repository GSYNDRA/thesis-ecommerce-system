import { randomUUID } from "crypto";
import config from "../configs/config.sequelize.js";
import { USER_ROLE } from "../constants/common.constant.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/response.util.js";
import ChatSessionRepository from "../reponsitories/chatSession.repository.js";
import ChatMessageRepository from "../reponsitories/chatMessage.repository.js";
import { AIService } from "./ai.service.js";
import { StaffService } from "./staff.service.js";
import { ChatRedisService } from "./chatRedis.service.js";
import { ChatIntentService } from "./chatIntent.service.js";
import { ChatProductToolService } from "./chatProductTool.service.js";

const HARD_HANDOFF_NOTICE =
  "I'm transferring you to a human support specialist for this request.";

export class ChatService {
  constructor() {
    this.chatSessionRepository = new ChatSessionRepository();
    this.chatMessageRepository = new ChatMessageRepository();
    this.aiService = new AIService();
    this.staffService = new StaffService();
    this.chatRedisService = new ChatRedisService();
    this.chatIntentService = new ChatIntentService();
    this.chatProductToolService = new ChatProductToolService();
  }

  normalizeUserId(userId, fieldName = "userId") {
    const parsed = Number(userId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestError(`${fieldName} must be a positive integer`);
    }
    return parsed;
  }

  normalizeStaffId(staffId, fieldName = "staffId") {
    return this.normalizeUserId(staffId, fieldName);
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
        `[ChatService] Failed to sync Redis chat state for ${sessionUuid}:`,
        error?.message || error,
      );
    }
  }

  async safeClearChatState(sessionUuid) {
    try {
      await this.chatRedisService.clearChatState(sessionUuid);
    } catch (error) {
      console.warn(
        `[ChatService] Failed to clear Redis chat state for ${sessionUuid}:`,
        error?.message || error,
      );
    }
  }

  async getSessionByUuid(sessionUuid) {
    const normalizedSessionUuid = this.normalizeSessionUuid(sessionUuid);
    const session = await this.chatSessionRepository.findBySessionUuid(
      normalizedSessionUuid,
    );
    if (!session) {
      throw new NotFoundError("Chat session not found");
    }
    return session;
  }

  async assertCustomerOwnsSession(sessionUuid, userId) {
    const session = await this.getSessionByUuid(sessionUuid);
    const normalizedUserId = this.normalizeUserId(userId);
    if (session.user_id !== normalizedUserId) {
      throw new ForbiddenError("You are not allowed to access this chat session");
    }
    return session;
  }

  async createMessage({
    sessionId,
    senderType,
    senderId = null,
    content,
    messageType = "text",
  }) {
    const text = String(content || "").trim();
    if (!text) {
      throw new BadRequestError("Message content is required");
    }

    return this.chatMessageRepository.createMessage({
      session_id: sessionId,
      sender_type: senderType,
      sender_id: senderId,
      message_type: messageType,
      content: text,
    });
  }

  async createSystemMessage(sessionUuid, content) {
    const session = await this.getSessionByUuid(sessionUuid);
    return this.createMessage({
      sessionId: session.id,
      senderType: "system",
      senderId: null,
      messageType: "system",
      content,
    });
  }

  async getOrCreateActiveSession(userId) {
    const normalizedUserId = this.normalizeUserId(userId);

    let session = await this.chatSessionRepository.findOpenByUserId(normalizedUserId);
    let created = false;

    if (!session) {
      session = await this.chatSessionRepository.createSession({
        session_uuid: randomUUID(),
        user_id: normalizedUserId,
        mode: "ai",
        status: "active",
      });
      created = true;
    }

    await this.safeSetChatState(session.session_uuid, {
      mode: session.mode,
      status: session.status,
      staffId: session.current_staff_id,
      updatedAt: new Date().toISOString(),
    });

    return {
      session,
      created,
    };
  }

  async getSessionHistory(sessionUuid, { limit, offset } = {}) {
    const session = await this.getSessionByUuid(sessionUuid);
    const safeLimit =
      Number.isInteger(limit) && limit > 0 ? limit : config.chat.historyLimit;
    const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

    const messages = await this.chatMessageRepository.getSessionHistory(
      session.id,
      { limit: safeLimit, offset: safeOffset },
    );

    return {
      sessionUuid: session.session_uuid,
      mode: session.mode,
      status: session.status,
      currentStaffId: session.current_staff_id,
      messages,
    };
  }

  async getSessionHistoryForActor({
    sessionUuid,
    actorUserId,
    actorRoleId,
    limit,
    offset,
  }) {
    const session = await this.getSessionByUuid(sessionUuid);
    const normalizedActorId = this.normalizeUserId(actorUserId, "actorUserId");
    const isStaff = Number(actorRoleId) !== USER_ROLE.CUSTOMER;

    if (!isStaff && session.user_id !== normalizedActorId) {
      throw new ForbiddenError("You are not allowed to access this chat session");
    }

    if (isStaff && session.current_staff_id !== normalizedActorId) {
      throw new ForbiddenError("You are not assigned to this chat session");
    }

    return this.getSessionHistory(session.session_uuid, { limit, offset });
  }

  async requestHumanSupport({
    sessionUuid,
    reason = "Customer requested human support",
    requesterUserId = null,
  }) {
    const session = requesterUserId
      ? await this.assertCustomerOwnsSession(sessionUuid, requesterUserId)
      : await this.getSessionByUuid(sessionUuid);

    if (session.status === "closed") {
      return {
        requested: false,
        reason: "SESSION_CLOSED",
      };
    }

    const assignResult = await this.staffService.assignSessionToStaff({
      sessionUuid: session.session_uuid,
      reason,
    });

    if (assignResult.assigned) {
      await this.createSystemMessage(
        session.session_uuid,
        "You have been connected to a human support agent.",
      );
      return {
        requested: true,
        assigned: true,
        ...assignResult,
      };
    }

    await this.createSystemMessage(
      session.session_uuid,
      "No support agent is available right now. Please wait while we keep trying.",
    );

    return {
      requested: true,
      assigned: false,
      ...assignResult,
    };
  }

  async handleCustomerMessage({
    sessionUuid,
    userId,
    content,
    stream = false,
    onToken = null,
    onCustomerMessage = null,
  }) {
    const session = await this.assertCustomerOwnsSession(sessionUuid, userId);
    if (session.status === "closed") {
      throw new BadRequestError("Chat session is closed");
    }

    const customerMessage = await this.createMessage({
      sessionId: session.id,
      senderType: "customer",
      senderId: this.normalizeUserId(userId),
      content,
    });

    if (typeof onCustomerMessage === "function") {
      try {
        await onCustomerMessage(customerMessage, session.session_uuid);
      } catch (error) {
        console.warn(
          `[ChatService] Failed to emit customer message early for ${session.session_uuid}:`,
          error?.message || error,
        );
      }
    }

    if (session.mode === "human") {
      return {
        mode: "human",
        sessionUuid: session.session_uuid,
        customerMessage,
        aiMessage: null,
        transfer: null,
      };
    }

    const normalizedUserMessage = String(content || "");
    const routedIntent = this.chatIntentService.detectIntent(normalizedUserMessage);

    if (routedIntent?.route === "hard_handoff") {
      const transferReason = this.chatIntentService.buildAutoHandoffReason(
        routedIntent.intent,
      );
      const handoffNoticeMessage = await this.createSystemMessage(
        session.session_uuid,
        HARD_HANDOFF_NOTICE,
      );
      const transfer = await this.requestHumanSupport({
        sessionUuid: session.session_uuid,
        reason: transferReason,
      });

      return {
        mode: "ai",
        sessionUuid: session.session_uuid,
        customerMessage,
        aiMessage: handoffNoticeMessage,
        transfer,
        aiMeta: {
          transferReason,
          streamMode: null,
          intent: routedIntent.intent,
          route: routedIntent.route,
        },
      };
    }

    if (routedIntent?.route === "product_tool") {
      try {
        const toolResult = await this.chatProductToolService.handleIntent({
          intent: routedIntent.intent,
          message: normalizedUserMessage,
        });

        if (toolResult?.handled && toolResult?.content) {
          const toolMessage = await this.createMessage({
            sessionId: session.id,
            senderType: "ai",
            senderId: null,
            content: toolResult.content,
          });

          return {
            mode: "ai",
            sessionUuid: session.session_uuid,
            customerMessage,
            aiMessage: toolMessage,
            transfer: null,
            aiMeta: {
              transferReason: null,
              streamMode: "product_tool",
              intent: routedIntent.intent,
              route: routedIntent.route,
            },
          };
        }
      } catch (error) {
        const toolErrorMessage = await this.createMessage({
          sessionId: session.id,
          senderType: "ai",
          senderId: null,
          content:
            "I couldn't retrieve product details right now. Please try again with the product name or slug.",
        });

        return {
          mode: "ai",
          sessionUuid: session.session_uuid,
          customerMessage,
          aiMessage: toolErrorMessage,
          transfer: null,
          aiMeta: {
            transferReason: `PRODUCT_TOOL_ERROR:${error?.message || "unknown_error"}`,
            streamMode: "product_tool_error",
            intent: routedIntent.intent,
            route: routedIntent.route,
          },
        };
      }
    }

    const historyRows = await this.chatMessageRepository.getSessionHistory(
      session.id,
      { limit: config.chat.historyLimit, offset: 0 },
    );
    const historyForAI = historyRows.filter((row) => row.id !== customerMessage.id);

    const aiReply = await this.aiService.generateReply({
      userMessage: normalizedUserMessage,
      history: historyForAI,
      stream,
      onToken,
    });

    const aiMessage = await this.createMessage({
      sessionId: session.id,
      senderType: "ai",
      senderId: null,
      content: aiReply.content,
    });

    let transfer = null;
    if (aiReply.shouldTransferToStaff) {
      transfer = await this.requestHumanSupport({
        sessionUuid: session.session_uuid,
        reason: aiReply.transferReason || "AI requested human support",
      });
    }

    return {
      mode: "ai",
      sessionUuid: session.session_uuid,
      customerMessage,
      aiMessage,
      aiMeta: {
        transferReason: aiReply.transferReason,
        streamMode: aiReply.streamMode || null,
      },
      transfer,
    };
  }

  async handleStaffMessage({ sessionUuid, staffId, content }) {
    const normalizedStaffId = this.normalizeStaffId(staffId);
    const session = await this.getSessionByUuid(sessionUuid);

    if (session.status === "closed") {
      throw new BadRequestError("Chat session is closed");
    }

    if (session.mode !== "human" || !session.current_staff_id) {
      throw new ForbiddenError("This session is not assigned to any staff");
    }

    if (session.current_staff_id !== normalizedStaffId) {
      throw new ForbiddenError("You are not assigned to this chat session");
    }

    const staffMessage = await this.createMessage({
      sessionId: session.id,
      senderType: "staff",
      senderId: normalizedStaffId,
      content,
    });

    return {
      sessionUuid: session.session_uuid,
      staffMessage,
    };
  }

  async handleStaffDisconnect(staffId) {
    const normalizedStaffId = this.normalizeStaffId(staffId);
    const result = await this.staffService.handleStaffDisconnect(normalizedStaffId);

    for (const item of result.sessions || []) {
      if (!item?.sessionUuid) continue;

      if (item.reassigned) {
        await this.createSystemMessage(
          item.sessionUuid,
          "Your previous support agent disconnected. You have been reassigned to another agent.",
        );
      } else {
        await this.createSystemMessage(
          item.sessionUuid,
          "Your support agent disconnected. We are finding another available agent.",
        );
      }
    }

    return result;
  }

  async closeSession({ sessionUuid, closedBy = "customer" }) {
    const session = await this.getSessionByUuid(sessionUuid);
    if (session.status === "closed") {
      return {
        closed: true,
        alreadyClosed: true,
        sessionUuid: session.session_uuid,
      };
    }

    if (session.current_staff_id) {
      await this.staffService.closeStaffWorkOnSession({
        sessionUuid: session.session_uuid,
        staffId: session.current_staff_id,
      });
    }

    await this.chatSessionRepository.closeSession(session.session_uuid);
    await this.createSystemMessage(
      session.session_uuid,
      `Chat closed by ${closedBy}.`,
    );

    await this.safeClearChatState(session.session_uuid);

    return {
      closed: true,
      alreadyClosed: false,
      sessionUuid: session.session_uuid,
    };
  }

  async closeSessionForActor({ sessionUuid, actorUserId, actorRoleId }) {
    const session = await this.getSessionByUuid(sessionUuid);
    const normalizedActorId = this.normalizeUserId(actorUserId, "actorUserId");
    const isStaff = Number(actorRoleId) !== USER_ROLE.CUSTOMER;

    if (!isStaff && session.user_id !== normalizedActorId) {
      throw new ForbiddenError("You are not allowed to close this chat session");
    }

    if (isStaff && session.current_staff_id !== normalizedActorId) {
      throw new ForbiddenError("You are not assigned to this chat session");
    }

    return this.closeSession({
      sessionUuid: session.session_uuid,
      closedBy: isStaff ? "staff" : "customer",
    });
  }
}
