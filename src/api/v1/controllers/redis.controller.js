import { RedisService } from "../services/redis.service.js";
import { SuccessResponse } from "../utils/response.util.js";

export class RedisController {
  constructor() {
    this.redisService = new RedisService();
  }

  getFullData = async (req, res, next) => {
    try {
      const data = await this.redisService.getFullData({
        match: req.query.match,
        count: req.query.count,
        limit: req.query.limit,
      });

      SuccessResponse.ok(data, "Redis full data fetched successfully").send(res);
    } catch (error) {
      next(error);
    }
  };
}

