import {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  ErrorResponse,
  NotFoundError,
} from "../utils/response.util.js";
import axios from "axios";
import crypto from "crypto";
import UserRepository from "../reponsitories/user.reponsitory.js";
import UserSessionRepository from "../reponsitories/userSession.reponsitory.js";
import CartRepository from "../reponsitories/cart.repository.js";
import CartProductRepository from "../reponsitories/cartProduct.reponsitory.js";
import ProductCatalogRepository from "../reponsitories/product_catalog.repository.js";
import OrderRepository from "../reponsitories/order.repository.js";
import { DiscountService } from "./discount.service.js";

const DEFAULT_SHIPPING_FEE = 40;
const RESERVATION_TTL_SECONDS = 300;
const MOMO_API_ENDPOINT =
  process.env.MOMO_API_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMO";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const MOMO_PARTNER_NAME = process.env.MOMO_PARTNER_NAME || "Thesis Ecommerce";
const MOMO_STORE_ID = process.env.MOMO_STORE_ID || "ThesisStore";
const MOMO_REQUEST_TYPE = process.env.MOMO_REQUEST_TYPE || "captureWallet";
const APP_URL = process.env.APP_URL || "https://semitheatrically-unfascinating-mariam.ngrok-free.dev";
const MOMO_REDIRECT_URL =
  process.env.MOMO_REDIRECT_URL ||
  "https://semitheatrically-unfascinating-mariam.ngrok-free.dev/payment/momo/redirect";
const MOMO_IPN_URL =
  process.env.MOMO_IPN_URL ||
  "https://semitheatrically-unfascinating-mariam.ngrok-free.dev/api/v1/payment/momo/ipn";
const MOMO_PAYMENT_CODE = process.env.MOMO_PAYMENT_CODE || "";
const MOMO_AMOUNT_MULTIPLIER = Number(process.env.MOMO_AMOUNT_MULTIPLIER || 1000);
const MOMO_MIN_AMOUNT = 1000;
const MOMO_MAX_AMOUNT = 50000000;
const RESERVE_ORDER_RESOURCES_LUA_SCRIPT = `
local nStock = tonumber(ARGV[1]) or 0
local nVoucher = tonumber(ARGV[2]) or 0
local orderId = ARGV[3]
local ttl = tonumber(ARGV[4])

if not orderId or not ttl then
    return {err = "INVALID_RESERVATION_ARGS"}
end

local baseArg = 5
local voucherGlobalStartKey = nStock + 1
local voucherUserStartKey = nStock + nVoucher + 1
local voucherMaxUsesStartArg = baseArg + (2 * nStock)
local voucherUsersCountStartArg = voucherMaxUsesStartArg + nVoucher

-- 1) CHECK STOCK
for i = 1, nStock do
    local stockKey = KEYS[i]
    local requested = tonumber(ARGV[baseArg + i - 1]) or 0
    local realStock = tonumber(ARGV[baseArg + nStock + i - 1]) or 0
    local reserved = tonumber(redis.call("GET", stockKey) or "0")

    if requested + reserved > realStock then
        return {err = "INSUFFICIENT_STOCK for " .. stockKey}
    end
end

-- 2) CHECK VOUCHER QUOTA
for i = 1, nVoucher do
    local globalReservedKey = KEYS[voucherGlobalStartKey + i - 1]
    local userReservedKey = KEYS[voucherUserStartKey + i - 1]
    local maxUses = tonumber(ARGV[voucherMaxUsesStartArg + i - 1]) or 0
    local usersCount = tonumber(ARGV[voucherUsersCountStartArg + i - 1]) or 0

    if maxUses > 0 then
        local reservedGlobalCount = tonumber(redis.call("GET", globalReservedKey) or "0")
        if usersCount + reservedGlobalCount >= maxUses then
            return {err = "DISCOUNT_MAX_USES_REACHED for " .. globalReservedKey}
        end
    end

    if redis.call("EXISTS", userReservedKey) == 1 then
        return {err = "DISCOUNT_ALREADY_RESERVED_BY_USER for " .. userReservedKey}
    end
end

-- 3) APPLY STOCK RESERVATION
for i = 1, nStock do
    local stockKey = KEYS[i]
    local requested = tonumber(ARGV[baseArg + i - 1]) or 0
    redis.call("INCRBY", stockKey, requested)
end

-- 4) APPLY VOUCHER RESERVATION
for i = 1, nVoucher do
    local globalReservedKey = KEYS[voucherGlobalStartKey + i - 1]
    local userReservedKey = KEYS[voucherUserStartKey + i - 1]

    -- Keep reserved counters without TTL, same strategy as variant reservation.
    -- Release is expected to happen explicitly in confirm/cancel/expire handlers.
    redis.call("INCRBY", globalReservedKey, 1)
    redis.call("SET", userReservedKey, orderId)
end

-- 5) STORE RESERVATION SNAPSHOT
local stockItemsKey = "reservation:" .. orderId .. ":items"
for i = 1, nStock do
    local stockKey = KEYS[i]
    local requested = ARGV[baseArg + i - 1]
    redis.call("HSET", stockItemsKey, stockKey, requested)
end

local vouchersKey = "reservation:" .. orderId .. ":vouchers"
for i = 1, nVoucher do
    local globalReservedKey = KEYS[voucherGlobalStartKey + i - 1]
    local userReservedKey = KEYS[voucherUserStartKey + i - 1]
    redis.call("HSET", vouchersKey, "global:" .. i, globalReservedKey)
    redis.call("HSET", vouchersKey, "user:" .. i, userReservedKey)
end

local ttlKey = "reservation:" .. orderId .. ":ttl"
redis.call("SET", ttlKey, "1")
redis.call("EXPIRE", ttlKey, ttl)
-- Do NOT set TTL on reservation snapshots.
-- They are consumed and deleted by rollback when ttlKey expires.

return "OK"
`;

export class CheckoutService {
  constructor() {
    this.userRepository = new UserRepository();
    this.userSessionRepository = new UserSessionRepository();
    this.cartRepository = new CartRepository();
    this.cartProductRepository = new CartProductRepository();
    this.productCatalogRepository = new ProductCatalogRepository();
    this.orderRepository = new OrderRepository();
    this.discountService = new DiscountService();
  }

  async previewCheckout(userId, payload) {
    const cartId = payload.cart_id ?? payload.cartId;
    if (!cartId) {
      throw new BadRequestError("cart_id is required");
    }

    const isManualVoucher =
      Boolean(payload.system_discount_code) ||
      Boolean(payload.shipping_discount_code);

    // 1) Validate cart ownership
    const cart = await this.cartRepository.findOne({
      id: cartId,
      user_id: userId,
      status: 1,
    });
    if (!cart) {
      throw new BadRequestError("Invalid cart for this user");
    }

    // 2) Load cart items
    const cartItems = await this.cartProductRepository.findByCartId(cartId);
    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestError("Cart is empty");
    }

    // 3) Load variation info
    const variationIds = cartItems.map((i) => i.variation_id);
    const [variants, reservedVariantMap] = await Promise.all([
      this.productCatalogRepository.findVariantsFullInfoByIds(variationIds),
      this.getVariantReservedMap(variationIds),
    ]);
    if (variants.length !== variationIds.length) {
      throw new NotFoundError("Some product variations do not exist");
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // 4) Validate stock + build item response
    const items = cartItems.map((item) => {
      const variant = variantMap.get(item.variation_id);
      if (!variant) {
        throw new NotFoundError("Some product variations do not exist");
      }
      const realStock = Number(variant.qty_in_stock) || 0;
      const reservedStock = reservedVariantMap.get(Number(item.variation_id)) || 0;
      const availableStock = Math.max(realStock - reservedStock, 0);
      if (Number(item.quantity) > availableStock) {
        throw new BadRequestError(
          `Quantity exceeds available stock for variation ${item.variation_id}. Available: ${availableStock}`,
        );
      }

      const productItem = variant.product_item;
      const product = productItem?.product;

      return {
        variation_id: item.variation_id,
        quantity: Number(item.quantity),
        price: Number(item.price),
        line_total: Number(item.quantity) * Number(item.price),
        stock_remaining: realStock,
        stock_reserved: reservedStock,
        stock_available: availableStock,
        product: product
          ? {
              id: product.id,
              name: product.product_name,
              slug: product.product_slug,
            }
          : null,
        size: variant.size
          ? {
              id: variant.size.id,
              name: variant.size.size_name,
            }
          : null,
        colour: productItem?.colour
          ? {
              id: productItem.colour.id,
              name: productItem.colour.colour_name,
            }
          : null,
        image: productItem?.product_images?.[0] ?? null,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
    const shippingFee =
      Number(payload.shipping_fee) > 0
        ? Number(payload.shipping_fee)
        : DEFAULT_SHIPPING_FEE;

    // 5) Always return full available vouchers for user to choose
    const [availableSystemRaw, availableShippingRaw] = await Promise.all([
      this.discountService.getAvailableSystemVouchers(userId, subtotal),
      this.discountService.getAvailableShippingVouchers(userId, subtotal),
    ]);
    const voucherIds = [
      ...new Set(
        [...availableSystemRaw, ...availableShippingRaw].map((voucher) =>
          Number(voucher.id),
        ),
      ),
    ];
    const reservedVoucherMap = await this.getVoucherReservedMap(voucherIds);
    const availableSystem = availableSystemRaw.filter((voucher) =>
      this.hasVoucherCapacityAfterReservation(voucher, reservedVoucherMap),
    );
    const availableShipping = availableShippingRaw.filter((voucher) =>
      this.hasVoucherCapacityAfterReservation(voucher, reservedVoucherMap),
    );

    // 6) Apply discount flow
    let selectedSystemVoucher = null;
    let selectedShippingVoucher = null;

    if (!isManualVoucher) {
      // AUTO MODE: optimize best voucher
      selectedSystemVoucher = this.discountService.pickBestVoucher(
        availableSystem,
        subtotal,
      );
      selectedShippingVoucher = this.discountService.pickBestShippingVoucher(
        availableShipping,
        shippingFee,
      );
    } else {
      // MANUAL MODE: only validate user-selected codes
      if (payload.system_discount_code) {
        selectedSystemVoucher = await this.discountService.validateDiscountCode({
          code: payload.system_discount_code,
          allowedTypes: ["fixed_amount", "percentage"],
          userId,
          orderAmount: subtotal,
        });
        if (
          !this.hasVoucherCapacityAfterReservation(
            selectedSystemVoucher,
            reservedVoucherMap,
          )
        ) {
          throw new BadRequestError(
            "System discount is temporarily out of quota due to active reservations",
          );
        }
      }

      if (payload.shipping_discount_code) {
        selectedShippingVoucher = await this.discountService.validateDiscountCode({
          code: payload.shipping_discount_code,
          allowedTypes: ["free_shipping", "shipping"],
          userId,
          orderAmount: subtotal,
        });
        if (
          !this.hasVoucherCapacityAfterReservation(
            selectedShippingVoucher,
            reservedVoucherMap,
          )
        ) {
          throw new BadRequestError(
            "Shipping discount is temporarily out of quota due to active reservations",
          );
        }
      }
    }

    const systemDiscount = selectedSystemVoucher
      ? this.discountService.calculateDiscount(selectedSystemVoucher, subtotal)
      : 0;

    const shippingDiscount = selectedShippingVoucher
      ? this.discountService.calculateDiscount(selectedShippingVoucher, shippingFee)
      : 0;

      // console.log("Selected System Voucher:", selectedSystemVoucher);
      console.log("Selected Shipping Voucher:", selectedShippingVoucher);

    const discountBreakdown = this.discountService.buildDiscountBreakdown({
      mode: isManualVoucher ? "manual" : "auto",
      systemVoucher: selectedSystemVoucher,
      shippingVoucher: selectedShippingVoucher,
      systemDiscount,
      shippingDiscount,
    });

    const selectedSystemCode = discountBreakdown.system_discount?.code ?? null;
    const selectedShippingCode = discountBreakdown.shipping_discount?.code ?? null;

    const available_vouchers = {
      system: availableSystem.map((v) =>
        this.toVoucherResponse(v, subtotal, selectedSystemCode),
      ),
      shipping: availableShipping.map((v) =>
        this.toVoucherResponse(v, shippingFee, selectedShippingCode),
      ),
    };

    const checkout_order = {
      totalPrice: subtotal,
      feeShip: shippingFee,
      totalDiscount: discountBreakdown.totalDiscount,
      totalCheckout: Math.max(subtotal + shippingFee - discountBreakdown.totalDiscount, 0),
    };

    return {
      cart_id: cart.id,
      discount_mode: isManualVoucher ? "manual" : "auto",
      items,
      checkout_order,
      applied_discounts: discountBreakdown,
      available_vouchers,
    };
  }

  toVoucherResponse(voucher, amount, selectedCode = null) {
    return {
      id: voucher.id,
      code: voucher.discount_code,
      name: voucher.discount_name,
      description: voucher.discount_description,
      type: voucher.discount_type,
      value: Number(voucher.discount_value),
      valid_from: voucher.discount_start,
      valid_to: voucher.discount_end,
      estimated_discount: this.discountService.calculateDiscount(voucher, amount),
      is_selected: voucher.discount_code === selectedCode,
    };
  }

  hasVoucherCapacityAfterReservation(voucher, reservedVoucherMap) {
    const maxUses = Number(voucher.discount_max_uses) || 0;
    if (maxUses <= 0) return true;

    const usersCount = Number(voucher.discount_users_count) || 0;
    const reservedCount = reservedVoucherMap.get(Number(voucher.id)) || 0;
    return usersCount + reservedCount < maxUses;
  }

  async getVariantReservedMap(variationIds) {
    const uniqueVariantIds = [...new Set((variationIds || []).map(Number))];
    if (uniqueVariantIds.length === 0) return new Map();

    const keys = uniqueVariantIds.map(
      (variantId) => `variant:${variantId}:reserved`,
    );
    const reservedByKey = await this.getReservedCountersByKeys(keys);

    return new Map(
      uniqueVariantIds.map((variantId) => [
        variantId,
        reservedByKey.get(`variant:${variantId}:reserved`) || 0,
      ]),
    );
  }

  async getVoucherReservedMap(voucherIds) {
    const uniqueVoucherIds = [...new Set((voucherIds || []).map(Number))];
    if (uniqueVoucherIds.length === 0) return new Map();

    const keys = uniqueVoucherIds.map(
      (voucherId) => `discount:${voucherId}:reserved`,
    );
    const reservedByKey = await this.getReservedCountersByKeys(keys);

    return new Map(
      uniqueVoucherIds.map((voucherId) => [
        voucherId,
        reservedByKey.get(`discount:${voucherId}:reserved`) || 0,
      ]),
    );
  }

  async getReservedCountersByKeys(keys) {
    const uniqueKeys = [...new Set(keys || [])];
    if (uniqueKeys.length === 0) return new Map();

    const redisClient = this.getRedisClient();
    const values = await Promise.all(uniqueKeys.map((key) => redisClient.get(key)));

    const result = new Map();
    uniqueKeys.forEach((key, index) => {
      result.set(key, Math.max(Number(values[index]) || 0, 0));
    });
    return result;
  }
  
  async placeOrder(userId, payload) {
    // Step 1: Re-run checkout preview to lock in pricing and discount snapshot
    const checkoutData = await this.previewCheckout(userId, payload);

    // Step 2: Idempotency check - return existing open order for this cart
    const existingOrder = await this.orderRepository.findOpenOrderByCartId(
      checkoutData.cart_id,
    );
    if (existingOrder) {
      return {
        is_idempotent: true,
        order: existingOrder,
        checkout: checkoutData,
      };
    }

    // Step 3: Create order (pending) only, without creating order_items
    const checkoutOrder = checkoutData.checkout_order;
    let order;
    try {
      order = await this.orderRepository.create({
        order_number: this.generateOrderNumber(),
        total_price: checkoutOrder.totalPrice,
        total_discount_amount: checkoutOrder.totalDiscount,
        actual_shipping_fee: checkoutOrder.feeShip,
        tax_amount: 0,
        net_amount: checkoutOrder.totalCheckout,
        order_status: "pending",
        customer_id: userId,
        cart_id: checkoutData.cart_id,
      });
    } catch (error) {
      this.logDbError("[CheckoutService.placeOrder] Failed to create order", error);
      throw error;
    }

    // Step 4: Re-check selected vouchers at order time
    let reservedVouchers = [];
    try {
      reservedVouchers = await this.recheckAppliedVouchers({
        userId,
        subtotal: checkoutOrder.totalPrice,
        appliedDiscounts: checkoutData.applied_discounts,
      });
    } catch (error) {
      await this.updateOrderStatus(order.id, "cancelled", {
        suppressError: true,
        context: "voucher_recheck_failed",
      });
      throw error;
    }

    // Step 5: Read latest stock from DB for all variants in checkout snapshot
    const variantIds = checkoutData.items.map((item) => item.variation_id);
    const quantities = checkoutData.items.map((item) => Number(item.quantity));
    console.log("Variant IDs:", variantIds);
    console.log("Quantities:", quantities);

    const variants = await this.productCatalogRepository.findVariantsFullInfoByIds(
      variantIds,
    );
    if (variants.length !== variantIds.length) {
      await this.updateOrderStatus(order.id, "cancelled", {
        suppressError: true,
        context: "variants_not_found",
      });
      throw new BadRequestError("Some product variations do not exist");
    }

    const stockMap = new Map(
      variants.map((variant) => [variant.id, Number(variant.qty_in_stock)]),
    );
    const realStocks = variantIds.map((variantId) => stockMap.get(variantId) ?? 0);
    console.log("Real Stocks:", realStocks);
    const reservedStockKeys = variantIds.map(
      (variantId) => `variant:${variantId}:reserved`,
    );

    // Step 6: Atomic reserve stock + voucher in Redis by Lua script
    let reservationResult;
    try {
      reservationResult = await this.executeReserveOrderResourcesLua({
        stockKeys: reservedStockKeys,
        quantities,
        realStocks,
        vouchers: reservedVouchers,
        userId,
        orderId: order.id,
        ttlSeconds: RESERVATION_TTL_SECONDS,
      });
    } catch (error) {
      await this.updateOrderStatus(order.id, "cancelled", {
        suppressError: true,
        context: "reserve_order_resources_exception",
      });
      throw new BadRequestError(error.message || "Failed to reserve order resources");
    }

    if (
      typeof reservationResult === "object" &&
      reservationResult !== null &&
      reservationResult.err
    ) {
      await this.updateOrderStatus(order.id, "cancelled", {
        suppressError: true,
        context: "reserve_order_resources_result_error",
      });
      throw new BadRequestError(reservationResult.err);
    }

    try {
      await this.cacheReservationMetadata({
        orderId: order.id,
        checkoutData,
        reservedVouchers,
      });
    } catch (error) {
      await this.updateOrderStatus(order.id, "cancelled", {
        suppressError: true,
        context: "cache_reservation_metadata_failed",
      });
      throw new BadRequestError(
        error?.message || "Failed to cache reservation metadata",
      );
    }

    let momoPayment = null;
    try {
      momoPayment = await this.createMoMoPayment({
        order,
        amount: checkoutOrder.totalCheckout,
      });
      await this.orderRepository.update(
        { id: order.id },
        {
          payment_method: "momo",
          payment_provider: "momo",
          payment_status: "pending",
          payment_transaction_id: momoPayment.requestId ?? null,
        },
      );
    } catch (error) {
      await this.updateOrderStatus(order.id, "cancelled", {
        suppressError: true,
        context: "momo_create_payment_failed",
      });
      throw new BadRequestError(
        error?.message || "Failed to create MoMo payment request",
      );
    }

    await this.updateOrderStatus(order.id, "confirmed");

    return {
      order_id: order.id,
      status: "confirmed",
      expires_in: RESERVATION_TTL_SECONDS,
      payment: {
        provider: "momo",
        request_id: momoPayment?.requestId ?? null,
        order_id: momoPayment?.orderId ?? String(order.id),
        amount: Math.max(
          Math.round((Number(checkoutOrder.totalCheckout) || 0) * MOMO_AMOUNT_MULTIPLIER),
          0,
        ),
        pay_url: momoPayment?.payUrl ?? null,
        deeplink: momoPayment?.deeplink ?? null,
        qr_code_url: momoPayment?.qrCodeUrl ?? null,
        result_code: momoPayment?.resultCode ?? null,
        message: momoPayment?.message ?? null,
      },
    };
  }

  getRedisClient() {
    const redisClient = globalThis.redisClient;
    if (!redisClient) {
      throw new InternalServerError("Redis client is not configured");
    }
    return redisClient;
  }

  async executeReserveOrderResourcesLua({
    stockKeys,
    quantities,
    realStocks,
    vouchers,
    userId,
    orderId,
    ttlSeconds,
  }) {
    const redisClient = this.getRedisClient();
    const safeVouchers = Array.isArray(vouchers) ? vouchers : [];
    const voucherGlobalKeys = safeVouchers.map(
      (voucher) => `discount:${voucher.id}:reserved`,
    );
    const voucherUserKeys = safeVouchers.map(
      (voucher) => `discount:${voucher.id}:user:${userId}:reserved`,
    );
    const allKeys = [...stockKeys, ...voucherGlobalKeys, ...voucherUserKeys];

    const luaArgs = [
      String(stockKeys.length),
      String(safeVouchers.length),
      String(orderId),
      String(ttlSeconds),
      ...quantities.map((value) => String(value)),
      ...realStocks.map((value) => String(value)),
      ...safeVouchers.map((voucher) =>
        String(Number(voucher.discount_max_uses) || 0),
      ),
      ...safeVouchers.map((voucher) =>
        String(Number(voucher.discount_users_count) || 0),
      ),
    ];

    const expectedArgLength = 4 + stockKeys.length * 2 + safeVouchers.length * 2;
    const expectedKeyLength = stockKeys.length + safeVouchers.length * 2;
    if (luaArgs.length !== expectedArgLength || allKeys.length !== expectedKeyLength) {
      throw new InternalServerError("Invalid reservation arguments");
    }

    // node-redis (redis package) style
    try {
      return await redisClient.eval(RESERVE_ORDER_RESOURCES_LUA_SCRIPT, {
        keys: allKeys,
        arguments: luaArgs,
      });
    } catch (error) {
      throw new BadRequestError(error.message || "Failed to reserve order resources");
    }
  }

  async recheckAppliedVouchers({ userId, subtotal, appliedDiscounts }) {
    const appliedSystemCode = appliedDiscounts?.system_discount?.code ?? null;
    const appliedShippingCode = appliedDiscounts?.shipping_discount?.code ?? null;
    const voucherTasks = [];

    if (appliedSystemCode) {
      voucherTasks.push(
        this.discountService.validateDiscountCode({
          code: appliedSystemCode,
          allowedTypes: ["fixed_amount", "percentage"],
          userId,
          orderAmount: subtotal,
        }),
      );
    }

    if (appliedShippingCode) {
      voucherTasks.push(
        this.discountService.validateDiscountCode({
          code: appliedShippingCode,
          allowedTypes: ["free_shipping", "shipping"],
          userId,
          orderAmount: subtotal,
        }),
      );
    }

    if (voucherTasks.length === 0) return [];

    const vouchers = await Promise.all(voucherTasks);
    const uniqueVouchers = [];
    const seen = new Set();

    for (const voucher of vouchers) {
      const voucherId = Number(voucher.id);
      if (seen.has(voucherId)) continue;
      seen.add(voucherId);
      uniqueVouchers.push(voucher);
    }

    return uniqueVouchers;
  }

  async createMoMoPayment({ order, amount }) {
    const normalizedAmount = Math.max(
      Math.round((Number(amount) || 0) * MOMO_AMOUNT_MULTIPLIER),
      0,
    );
    if (normalizedAmount <= 0) {
      throw new BadRequestError("Invalid order amount for MoMo payment");
    }
    if (normalizedAmount < MOMO_MIN_AMOUNT || normalizedAmount > MOMO_MAX_AMOUNT) {
      throw new BadRequestError(
        `Order amount for MoMo must be between ${MOMO_MIN_AMOUNT} and ${MOMO_MAX_AMOUNT} VND`,
      );
    }

    const orderId = String(order.order_number || order.id);
    const requestId = `${MOMO_PARTNER_CODE}-${orderId}-${Date.now()}`;
    const orderInfo = `Pay order #${orderId}`;
    const extraData = Buffer.from(
      JSON.stringify({
        system_order_id: String(order.id),
        order_number: order.order_number ?? null,
      }),
      "utf8",
    ).toString("base64");
    const autoCapture = true;
    const lang = "vi";
    const orderGroupId = "";

    const rawSignature =
      `accessKey=${MOMO_ACCESS_KEY}` +
      `&amount=${normalizedAmount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${MOMO_IPN_URL}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${MOMO_PARTNER_CODE}` +
      `&redirectUrl=${MOMO_REDIRECT_URL}` +
      `&requestId=${requestId}` +
      `&requestType=${MOMO_REQUEST_TYPE}`;

    const signature = crypto
      .createHmac("sha256", MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode: MOMO_PARTNER_CODE,
      partnerName: MOMO_PARTNER_NAME,
      storeId: MOMO_STORE_ID,
      requestId,
      amount: String(normalizedAmount),
      orderId,
      orderInfo,
      redirectUrl: MOMO_REDIRECT_URL,
      ipnUrl: MOMO_IPN_URL,
      lang,
      requestType: MOMO_REQUEST_TYPE,
      autoCapture,
      extraData,
      orderGroupId,
      signature,
    };
    if (MOMO_PAYMENT_CODE) {
      requestBody.paymentCode = MOMO_PAYMENT_CODE;
    }

    let response;
    try {
      response = await axios.post(MOMO_API_ENDPOINT, requestBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      });
    } catch (error) {
      const momoError = error?.response?.data;
      const status = error?.response?.status;
      if (momoError) {
        console.error("[MoMo] create payment failed", {
          status,
          resultCode: momoError?.resultCode,
          message: momoError?.message,
          orderId,
          requestId,
          requestType: MOMO_REQUEST_TYPE,
          redirectUrl: MOMO_REDIRECT_URL,
          ipnUrl: MOMO_IPN_URL,
        });
        throw new BadRequestError(
          `MoMo error (${momoError?.resultCode ?? status ?? "unknown"}): ${
            momoError?.message || "Create payment failed"
          }`,
        );
      }
      throw new BadRequestError(error?.message || "Failed to call MoMo API");
    }

    const momoData = response?.data || {};
    if (Number(momoData.resultCode) !== 0) {
      throw new BadRequestError(
        momoData.message || "MoMo rejected payment request",
      );
    }

    return momoData;
  }

  async cacheReservationMetadata({ orderId, checkoutData, reservedVouchers }) {
    const redisClient = this.getRedisClient();
    const reservationId = String(orderId);
    const pricesKey = `reservation:${reservationId}:prices`;
    const discountsKey = `reservation:${reservationId}:discounts`;

    const pricePayload = {};
    for (const item of checkoutData?.items || []) {
      const variationId = Number(item?.variation_id);
      if (!variationId) continue;
      pricePayload[String(variationId)] = String(Number(item?.price) || 0);
    }
    if (Object.keys(pricePayload).length > 0) {
      await redisClient.hSet(pricesKey, pricePayload);
    }

    const amountByCode = new Map();
    const systemDiscount = checkoutData?.applied_discounts?.system_discount;
    const shippingDiscount = checkoutData?.applied_discounts?.shipping_discount;
    if (systemDiscount?.code) {
      amountByCode.set(
        String(systemDiscount.code),
        Math.max(Number(systemDiscount.amount) || 0, 0),
      );
    }
    if (shippingDiscount?.code) {
      amountByCode.set(
        String(shippingDiscount.code),
        Math.max(Number(shippingDiscount.amount) || 0, 0),
      );
    }

    const discountPayload = {};
    for (const voucher of reservedVouchers || []) {
      const voucherId = Number(voucher?.id);
      if (!voucherId) continue;
      const amount = amountByCode.get(String(voucher?.discount_code)) || 0;
      discountPayload[String(voucherId)] = String(amount);
    }
    if (Object.keys(discountPayload).length > 0) {
      await redisClient.hSet(discountsKey, discountPayload);
    }
  }

  generateOrderNumber() {
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const rand = String(Math.floor(Math.random() * 1000)).padStart(3, "0");

    // Format: OR + yymmddhhmmss + rand(3) => 17 chars, fits VARCHAR(20)
    return `OR${y}${m}${d}${hh}${mm}${ss}${rand}`;
  }

  async updateOrderStatus(orderId, status, options = {}) {
    const { suppressError = false, context = "" } = options;
    try {
      await this.orderRepository.update(
        { id: orderId },
        { order_status: status },
      );
    } catch (error) {
      const suffix = context ? ` (${context})` : "";
      this.logDbError(
        `[CheckoutService.placeOrder] Failed to update order status to '${status}'${suffix}`,
        error,
      );
      if (!suppressError) {
        throw error;
      }
    }
  }

  logDbError(context, error) {
    console.error(context);
    console.error("name:", error?.name);
    console.error("message:", error?.message);
    console.error("detail:", error?.parent?.detail ?? null);
    console.error("constraint:", error?.parent?.constraint ?? null);
    console.error("column:", error?.parent?.column ?? null);
    console.error("table:", error?.parent?.table ?? null);
    console.error("sql:", error?.sql ?? null);
  }
}
