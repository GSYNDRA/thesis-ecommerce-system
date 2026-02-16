import { BadRequestError, InternalServerError } from "../utils/response.util.js";

export class RedisService {
  getClient() {
    const redisClient = globalThis.redisClient;
    if (!redisClient || !redisClient.isOpen) {
      throw new InternalServerError("Redis client is not available");
    }
    return redisClient;
  }

  async getFullData(options = {}) {
    const redisClient = this.getClient();

    const match = options.match || "*";
    const count = Number(options.count) > 0 ? Number(options.count) : 100;
    const limit = Number(options.limit) > 0 ? Number(options.limit) : null;

    if (!Number.isInteger(count) || count <= 0) {
      throw new BadRequestError("count must be a positive integer");
    }
    if (limit !== null && (!Number.isInteger(limit) || limit <= 0)) {
      throw new BadRequestError("limit must be a positive integer");
    }

    let cursor = "0";
    const keysData = [];

    do {
      const scanResult = await redisClient.scan(cursor, {
        MATCH: match,
        COUNT: count,
      });

      cursor = String(scanResult.cursor);
      const keys = scanResult.keys || [];

      for (const key of keys) {
        const item = await this.readKey(redisClient, key);
        keysData.push(item);

        if (limit !== null && keysData.length >= limit) {
          return {
            total: keysData.length,
            match,
            count,
            limit,
            has_more: cursor !== "0",
            data: keysData,
          };
        }
      }
    } while (cursor !== "0");

    return {
      total: keysData.length,
      match,
      count,
      limit,
      has_more: false,
      data: keysData,
    };
  }

  async readKey(redisClient, key) {
    try {
      const [type, ttl] = await Promise.all([
        redisClient.type(key),
        redisClient.ttl(key),
      ]);

      let value = null;

      switch (type) {
        case "string":
          value = await redisClient.get(key);
          break;
        case "hash":
          value = await redisClient.hGetAll(key);
          break;
        case "list":
          value = await redisClient.lRange(key, 0, -1);
          break;
        case "set":
          value = await redisClient.sMembers(key);
          break;
        case "zset":
          value = await redisClient.zRangeWithScores(key, 0, -1);
          break;
        case "stream":
          value = await redisClient.xRange(key, "-", "+");
          break;
        default:
          value = `[unsupported_type:${type}]`;
      }

      return { key, type, ttl, value };
    } catch (error) {
      return {
        key,
        type: "unknown",
        ttl: null,
        value: null,
        error: error?.message || "Failed to read key",
      };
    }
  }
}

