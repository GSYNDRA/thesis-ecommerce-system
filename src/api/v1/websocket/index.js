import { Server } from "socket.io";
import config from "../configs/config.sequelize.js";
import { authenticateSocket } from "./middleware/auth.socket.js";
import { ChatService } from "../services/chat.service.js";
import { StaffService } from "../services/staff.service.js";
import { registerChatSocketHandlers } from "./handlers/chat.handler.js";
import {
  handleStaffSocketDisconnect,
  registerStaffSocketHandlers,
  tryAutoAssignPendingSession,
} from "./handlers/staff.handler.js";

let ioInstance = null;

function getCorsOrigin() {
  return config.app.url || "*";
}

export function initSocketServer(httpServer) {
  if (ioInstance) {
    return ioInstance;
  }

  const staffService = new StaffService();
  const chatService = new ChatService();

  ioInstance = new Server(httpServer, {
    cors: {
      origin: getCorsOrigin(),
      methods: ["GET", "POST"],
    },
  });

  ioInstance.use(authenticateSocket);

  ioInstance.on("connection", async (socket) => {
    const userId = socket.user?.id;
    const isStaff = Boolean(socket.user?.isStaff);

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (isStaff) {
      socket.join("staff:online");
      try {
        await staffService.markOnline(userId);
        await tryAutoAssignPendingSession({
          io: ioInstance,
          socket,
          staffService,
          chatService,
          reason: "Staff connected to socket",
        });
      } catch (error) {
        console.warn(
          `[Socket] Failed to mark staff ${userId} online:`,
          error?.message || error,
        );
      }
    }

    socket.emit("ws:connected", {
      userId,
      roleId: socket.user?.roleId || null,
      isStaff,
      timestamp: new Date().toISOString(),
    });

    socket.on("ws:heartbeat", async () => {
      if (!socket.user?.isStaff) return;
      try {
        const result = await staffService.heartbeat(socket.user.id);
        console.log(
          `[Socket] Staff heartbeat received: staffId=${result.staffId}, at=${result.lastHeartbeat}`,
        );
      } catch (error) {
        console.warn(
          `[Socket] Staff heartbeat failed for ${socket.user.id}:`,
          error?.message || error,
        );
      }
    });

    registerChatSocketHandlers({ io: ioInstance, socket, chatService });
    registerStaffSocketHandlers({
      io: ioInstance,
      socket,
      staffService,
      chatService,
    });

    socket.on("disconnect", async () => {
      await handleStaffSocketDisconnect({ io: ioInstance, chatService, socket });
    });
  });

  return ioInstance;
}

export function getSocketServer() {
  return ioInstance;
}
