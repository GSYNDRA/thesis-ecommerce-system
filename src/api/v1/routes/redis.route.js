import { Router } from "express";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { RedisController } from "../controllers/redis.controller.js";

const redisRouter = Router();
const authMiddleWare = new AuthMiddleWare();
const redisController = new RedisController();

/**
 * @route   GET /api/v1/redis/full-data
 * @desc    Get full Redis data (keys + values)
 * @access  Private
 */
redisRouter.get(
  "/full-data",
  authMiddleWare.verifyAT1,
  redisController.getFullData,
);

export default redisRouter;

