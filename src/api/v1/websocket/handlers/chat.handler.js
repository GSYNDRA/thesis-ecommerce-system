import {
  buildMessagePayload,
  emitAck,
  emitError,
  toIsoTimestamp,
} from "../utils/socketEmit.util.js";

export function registerChatSocketHandlers({ io, socket, chatService }) {
  socket.on("chat:init", async (payload = {}, ack) => {
    try {
      const limit = Number(payload?.limit);
      const offset = Number(payload?.offset) || 0;

      if (socket.user?.isStaff) {
        const sessionUuid = String(payload?.sessionUuid || "").trim();
        if (!sessionUuid) {
          emitError(ack, "chat:init", new Error("sessionUuid is required for staff"));
          return;
        }

        const history = await chatService.getSessionHistoryForActor({
          sessionUuid,
          actorUserId: socket.user.id,
          actorRoleId: socket.user.roleId,
          limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
          offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
        });

        socket.join(`chat:${history.sessionUuid}`);
        socket.emit("chat:initialized", {
          sessionUuid: history.sessionUuid,
          mode: history.mode,
          status: history.status,
          currentStaffId: history.currentStaffId,
          messages: history.messages.map((msg) =>
            buildMessagePayload(msg, history.sessionUuid),
          ),
          timestamp: new Date().toISOString(),
        });
        emitAck(ack, "chat:init", { sessionUuid: history.sessionUuid });
        return;
      }

      const { session } = await chatService.getOrCreateActiveSession(socket.user.id);
      const history = await chatService.getSessionHistory(session.session_uuid, {
        limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
        offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
      });

      socket.join(`chat:${session.session_uuid}`);

      socket.emit("chat:initialized", {
        sessionUuid: history.sessionUuid,
        mode: history.mode,
        status: history.status,
        currentStaffId: history.currentStaffId,
        messages: history.messages.map((msg) =>
          buildMessagePayload(msg, history.sessionUuid),
        ),
        timestamp: new Date().toISOString(),
      });

      emitAck(ack, "chat:init", { sessionUuid: history.sessionUuid });
    } catch (error) {
      emitError(ack, "chat:init", error);
    }
  });

  socket.on("chat:send", async (payload = {}, ack) => {
    try {
      const sessionUuid = String(payload?.sessionUuid || "").trim();
      const content = String(payload?.content || "").trim();

      if (!sessionUuid || !content) {
        throw new Error("sessionUuid and content are required");
      }

      const room = `chat:${sessionUuid}`;
      socket.join(room);

      if (socket.user?.isStaff) {
        const result = await chatService.handleStaffMessage({
          sessionUuid,
          staffId: socket.user.id,
          content,
        });

        io.to(room).emit(
          "chat:new_message",
          buildMessagePayload(result.staffMessage, sessionUuid),
        );
        emitAck(ack, "chat:send", { sessionUuid });
        return;
      }

      const result = await chatService.handleCustomerMessage({
        sessionUuid,
        userId: socket.user.id,
        content,
        stream: true,
        onToken: async (token) => {
          io.to(room).emit("chat:ai_token", {
            sessionUuid,
            token,
            timestamp: new Date().toISOString(),
          });
        },
      });

      io.to(room).emit(
        "chat:new_message",
        buildMessagePayload(result.customerMessage, sessionUuid),
      );

      if (result.aiMessage) {
        io.to(room).emit(
          "chat:new_message",
          buildMessagePayload(result.aiMessage, sessionUuid),
        );

        io.to(room).emit("chat:ai_message_complete", {
          sessionUuid,
          content: result.aiMessage.content,
          streamMode: result?.aiMeta?.streamMode || null,
          timestamp: toIsoTimestamp(result.aiMessage.created_at),
        });
      }

      if (result.transfer) {
        if (result.transfer.assigned) {
          io.in(`user:${result.transfer.staffId}`).socketsJoin(room);
          io.to(room).emit("chat:assigned", {
            sessionUuid,
            senderType: "system",
            content: "You have been connected to a human support agent.",
            staffId: result.transfer.staffId,
            timestamp: new Date().toISOString(),
          });
        } else {
          io.to(room).emit("chat:reassigning", {
            sessionUuid,
            senderType: "system",
            content:
              "No support agent is available right now. Please wait while we keep trying.",
            reason: result.transfer.reason || "NO_STAFF_AVAILABLE",
            timestamp: new Date().toISOString(),
          });
        }
      }

      emitAck(ack, "chat:send", { sessionUuid });
    } catch (error) {
      emitError(ack, "chat:send", error);
    }
  });

  socket.on("chat:request_human", async (payload = {}, ack) => {
    try {
      if (socket.user?.isStaff) {
        throw new Error("Only customers can request human support");
      }

      const sessionUuid = String(payload?.sessionUuid || "").trim();
      const reason = String(payload?.reason || "Customer requested human support");
      if (!sessionUuid) {
        throw new Error("sessionUuid is required");
      }

      const room = `chat:${sessionUuid}`;
      socket.join(room);

      const transfer = await chatService.requestHumanSupport({
        sessionUuid,
        reason,
        requesterUserId: socket.user.id,
      });

      if (transfer.assigned) {
        io.in(`user:${transfer.staffId}`).socketsJoin(room);
        io.to(room).emit("chat:assigned", {
          sessionUuid,
          senderType: "system",
          content: "You have been connected to a human support agent.",
          staffId: transfer.staffId,
          timestamp: new Date().toISOString(),
        });
      } else {
        io.to(room).emit("chat:reassigning", {
          sessionUuid,
          senderType: "system",
          content:
            "No support agent is available right now. Please wait while we keep trying.",
          reason: transfer.reason || "NO_STAFF_AVAILABLE",
          timestamp: new Date().toISOString(),
        });
      }

      emitAck(ack, "chat:request_human", {
        sessionUuid,
        assigned: Boolean(transfer.assigned),
      });
    } catch (error) {
      emitError(ack, "chat:request_human", error);
    }
  });

  socket.on("chat:close", async (payload = {}, ack) => {
    try {
      const sessionUuid = String(payload?.sessionUuid || "").trim();
      if (!sessionUuid) {
        throw new Error("sessionUuid is required");
      }

      const result = await chatService.closeSessionForActor({
        sessionUuid,
        actorUserId: socket.user.id,
        actorRoleId: socket.user.roleId,
      });

      io.to(`chat:${sessionUuid}`).emit("chat:closed", {
        sessionUuid,
        senderType: "system",
        content: "Chat session has been closed.",
        timestamp: new Date().toISOString(),
      });

      emitAck(ack, "chat:close", result);
    } catch (error) {
      emitError(ack, "chat:close", error);
    }
  });
}
