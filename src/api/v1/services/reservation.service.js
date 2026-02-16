import redisClient from "../database/init.redis.js";

const RELEASE_RESERVATION_LUA_SCRIPT = `
local itemsKey = KEYS[1]
local vouchersKey = KEYS[2]
local discountsMetaKey = KEYS[3]
local pricesMetaKey = KEYS[4]

local hasItems = redis.call("EXISTS", itemsKey) == 1
local hasVouchers = redis.call("EXISTS", vouchersKey) == 1

if hasItems then
    local items = redis.call("HGETALL", itemsKey)
    for i = 1, #items, 2 do
        local stockKey = items[i]
        local qty = tonumber(items[i + 1]) or 0
        if qty > 0 then
            local current = tonumber(redis.call("GET", stockKey) or "0")
            local nextVal = current - qty
            if nextVal > 0 then
                redis.call("SET", stockKey, tostring(nextVal))
            else
                redis.call("DEL", stockKey)
            end
        end
    end
end

if hasVouchers then
    local vouchers = redis.call("HGETALL", vouchersKey)
    for i = 1, #vouchers, 2 do
        local field = vouchers[i]
        local key = vouchers[i + 1]

        if string.sub(field, 1, 7) == "global:" then
            local current = tonumber(redis.call("GET", key) or "0")
            local nextVal = current - 1
            if nextVal > 0 then
                redis.call("SET", key, tostring(nextVal))
            else
                redis.call("DEL", key)
            end
        elseif string.sub(field, 1, 5) == "user:" then
            redis.call("DEL", key)
        end
    end
end

redis.call("DEL", itemsKey)
redis.call("DEL", vouchersKey)
redis.call("DEL", discountsMetaKey)
redis.call("DEL", pricesMetaKey)

if hasItems or hasVouchers then
    return "RELEASED"
end
return "NOOP"
`;

export class ReservationService {
  getClient() {
    const client = globalThis.redisClient || redisClient;
    if (!client || !client.isOpen) {
      throw new Error("Redis client is not available");
    }
    return client;
  }

  getReservationKeys(orderId) {
    const id = String(orderId);
    return {
      itemsKey: `reservation:${id}:items`,
      vouchersKey: `reservation:${id}:vouchers`,
      discountsMetaKey: `reservation:${id}:discounts`,
      pricesMetaKey: `reservation:${id}:prices`,
      ttlKey: `reservation:${id}:ttl`,
    };
  }

  parseDiscountIdsFromVoucherSnapshot(vouchersSnapshot = {}) {
    const ids = new Set();
    const regex = /^discount:(\d+):reserved$/;

    for (const [field, value] of Object.entries(vouchersSnapshot)) {
      if (!field.startsWith("global:")) continue;
      const match = regex.exec(String(value || ""));
      if (!match) continue;
      ids.add(Number(match[1]));
    }
    return [...ids];
  }

  parseVariantQuantitiesFromItemSnapshot(itemsSnapshot = {}) {
    const map = new Map();
    const regex = /^variant:(\d+):reserved$/;

    for (const [key, qtyRaw] of Object.entries(itemsSnapshot)) {
      const match = regex.exec(String(key || ""));
      if (!match) continue;
      const variationId = Number(match[1]);
      const quantity = Math.max(Number(qtyRaw) || 0, 0);
      if (variationId > 0 && quantity > 0) {
        map.set(variationId, quantity);
      }
    }
    return map;
  }

  async getReservationSnapshot(orderId) {
    const client = this.getClient();
    const { itemsKey, vouchersKey, discountsMetaKey, pricesMetaKey } =
      this.getReservationKeys(orderId);

    const [items, vouchers, discounts, prices] = await Promise.all([
      client.hGetAll(itemsKey),
      client.hGetAll(vouchersKey),
      client.hGetAll(discountsMetaKey),
      client.hGetAll(pricesMetaKey),
    ]);

    return {
      items,
      vouchers,
      discounts,
      prices,
      variantQuantities: this.parseVariantQuantitiesFromItemSnapshot(items),
      discountIds: this.parseDiscountIdsFromVoucherSnapshot(vouchers),
    };
  }

  async releaseReservation(orderId, client = null) {
    const redis = client || this.getClient();
    const { itemsKey, vouchersKey, discountsMetaKey, pricesMetaKey, ttlKey } =
      this.getReservationKeys(orderId);

    const result = await redis.eval(RELEASE_RESERVATION_LUA_SCRIPT, {
      keys: [itemsKey, vouchersKey, discountsMetaKey, pricesMetaKey],
      arguments: [],
    });

    await redis.del(ttlKey);
    return result;
  }
}

