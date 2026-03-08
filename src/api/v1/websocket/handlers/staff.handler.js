import { emitAck, emitError } from "../utils/socketEmit.util.js";

const AUTO_ASSIGN_CONNECTED_MESSAGE =
  "You have been connected to a human support agent.";
const DISCONNECT_GRACE_MS = 2000;

export async function tryAutoAssignPendingSession({
  io,
  socket,
  staffService,
  chatService,
  reason = "Staff became available",
}) {
  const staffId = socket.user?.id;
  if (!staffId) {
    return { assigned: false, reason: "STAFF_NOT_AUTHENTICATED" };
  }

  const assignment = await staffService.assignPendingSessionToStaff(staffId, {
    reason,
  });

  if (!assignment.assigned || !assignment.sessionUuid) {
    return assignment;
  }

  const room = `chat:${assignment.sessionUuid}`;
  io.in(`user:${assignment.staffId}`).socketsJoin(room);

  if (chatService?.createSystemMessage) {
    await chatService.createSystemMessage(
      assignment.sessionUuid,
      AUTO_ASSIGN_CONNECTED_MESSAGE,
    );
  }

  io.to(room).emit("chat:assigned", {
    sessionUuid: assignment.sessionUuid,
    senderType: "system",
    content: AUTO_ASSIGN_CONNECTED_MESSAGE,
    staffId: assignment.staffId,
    autoAssigned: true,
    timestamp: new Date().toISOString(),
  });

  return assignment;
}

export function registerStaffSocketHandlers({
  io,
  socket,
  staffService,
  chatService,
}) {
  socket.on("staff:availability", async (payload = {}, ack) => {
    try {
      if (!socket.user?.isStaff) {
        throw new Error("Only staff can update availability");
      }

      const isAvailable = Boolean(payload?.isAvailable);
      const result = await staffService.setAvailability(socket.user.id, isAvailable);
      let autoAssignResult = null;
      if (result.isAvailable) {
        autoAssignResult = await tryAutoAssignPendingSession({
          io,
          socket,
          staffService,
          chatService,
          reason: "Staff set availability to online",
        });
      }

      io.to("staff:online").emit("staff:availability_updated", {
        staffId: socket.user.id,
        isAvailable: result.isAvailable,
        timestamp: new Date().toISOString(),
      });

      emitAck(ack, "staff:availability", {
        staffId: socket.user.id,
        isAvailable: result.isAvailable,
        autoAssignedSessionUuid: autoAssignResult?.assigned
          ? autoAssignResult.sessionUuid
          : null,
      });
    } catch (error) {
      emitError(ack, "staff:availability", error);
    }
  });
}

export function emitStaffReassignmentEvents({ io, result }) {
  for (const item of result?.sessions || []) {
    if (!item?.sessionUuid) continue;

    const room = `chat:${item.sessionUuid}`;
    io.to(room).emit("chat:reassigning", {
      sessionUuid: item.sessionUuid,
      senderType: "system",
      content: "Your support agent disconnected. Reassigning your chat now.",
      timestamp: new Date().toISOString(),
    });

    if (item.reassigned) {
      io.in(`user:${item.newStaffId}`).socketsJoin(room);
      io.to(room).emit("chat:assigned", {
        sessionUuid: item.sessionUuid,
        senderType: "system",
        content: "Your chat has been reassigned to another support agent.",
        staffId: item.newStaffId,
        previousStaffId: item.previousStaffId || null,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export async function handleStaffSocketDisconnect({ io, chatService, socket }) {
  if (!socket.user?.isStaff) return;

  try {
    // Give a short grace window for fast reconnects.
    await new Promise((resolve) => setTimeout(resolve, DISCONNECT_GRACE_MS));

    const staffId = Number(socket.user.id);
    if (Number.isInteger(staffId) && staffId > 0) {
      const stillConnected = await hasAnyActiveStaffSocket(io, staffId);
      if (stillConnected) {
        return;
      }
    }

    const result = await chatService.handleStaffDisconnect(socket.user.id);
    emitStaffReassignmentEvents({ io, result });
  } catch (error) {
    console.warn(
      `[Socket] Staff disconnect handling failed for ${socket.user.id}:`,
      error?.message || error,
    );
  }
}

async function hasAnyActiveStaffSocket(io, staffId) {
  try {
    const sockets = await io.in(`user:${staffId}`).fetchSockets();
    return sockets.some(
      (staffSocket) =>
        Boolean(staffSocket?.user?.isStaff) &&
        Number(staffSocket?.user?.id) === Number(staffId),
    );
  } catch (error) {
    console.warn(
      `[Socket] Failed to check active sockets for staff ${staffId}:`,
      error?.message || error,
    );
    return false;
  }
}
