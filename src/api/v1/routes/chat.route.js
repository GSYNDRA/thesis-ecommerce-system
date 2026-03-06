import { Router } from "express";
import { ChatController } from "../controllers/chat.controller.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validationReq } from "../middlewares/validation.middleware.js";
import {
  closeChatSessionSchema,
  getSessionHistorySchema,
  getStaffWorkloadSchema,
  requestHumanSupportSchema,
  updateStaffAvailabilitySchema,
} from "../validations/chat.validation.js";

const chatRouter = Router();
const chatController = new ChatController();
const authMiddleWare = new AuthMiddleWare();

chatRouter.get(
  "/session/active",
  authMiddleWare.verifyAT1,
  chatController.getActiveSession,
);

chatRouter.get(
  "/session/:sessionUuid/history",
  authMiddleWare.verifyAT1,
  validationReq(getSessionHistorySchema),
  chatController.getSessionHistory,
);

chatRouter.post(
  "/session/:sessionUuid/request-human",
  authMiddleWare.verifyAT1,
  validationReq(requestHumanSupportSchema),
  chatController.requestHumanSupport,
);

chatRouter.post(
  "/session/:sessionUuid/close",
  authMiddleWare.verifyAT1,
  validationReq(closeChatSessionSchema),
  chatController.closeSession,
);

chatRouter.post(
  "/staff/availability",
  authMiddleWare.verifyAT1,
  validationReq(updateStaffAvailabilitySchema),
  chatController.setStaffAvailability,
);

chatRouter.get(
  "/staff/workload",
  authMiddleWare.verifyAT1,
  validationReq(getStaffWorkloadSchema),
  chatController.getStaffWorkload,
);

export default chatRouter;

