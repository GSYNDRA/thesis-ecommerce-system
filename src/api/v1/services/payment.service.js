import crypto from "crypto";
import { Op } from "sequelize";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../utils/response.util.js";
import OrderRepository from "../reponsitories/order.repository.js";
import CartProductRepository from "../reponsitories/cartProduct.reponsitory.js";
import CartRepository from "../reponsitories/cart.repository.js";
import ProductCatalogRepository from "../reponsitories/product_catalog.repository.js";
import OrderProductRepository from "../reponsitories/orderProduct.repository.js";
import OrderDiscountRepository from "../reponsitories/orderDiscount.repository.js";
import DiscountRepository from "../reponsitories/discount.repository.js";
import { ReservationService } from "./reservation.service.js";

const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const MOMO_AMOUNT_MULTIPLIER = Number(process.env.MOMO_AMOUNT_MULTIPLIER || 1000);

export class PaymentService {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.cartProductRepository = new CartProductRepository();
    this.cartRepository = new CartRepository();
    this.productCatalogRepository = new ProductCatalogRepository();
    this.orderProductRepository = new OrderProductRepository();
    this.orderDiscountRepository = new OrderDiscountRepository();
    this.discountRepository = new DiscountRepository();
    this.reservationService = new ReservationService();
  }

  buildMoMoResponseSignatureCandidates(payload) {
    const baseValues = {
      accessKey: MOMO_ACCESS_KEY,
      amount: payload.amount ?? "",
      extraData: payload.extraData ?? "",
      message: payload.message ?? "",
      orderId: payload.orderId ?? "",
      orderInfo: payload.orderInfo ?? "",
      orderType: payload.orderType ?? "",
      partnerCode: payload.partnerCode ?? "",
      payType: payload.payType ?? "",
      requestId: payload.requestId ?? "",
      responseTime: payload.responseTime ?? "",
      resultCode: payload.resultCode ?? "",
      transId: payload.transId ?? "",
      requestType: payload.requestType ?? "",
    };

    const fieldSets = [
      [
        "accessKey",
        "amount",
        "extraData",
        "message",
        "orderId",
        "orderInfo",
        "orderType",
        "partnerCode",
        "payType",
        "requestId",
        "responseTime",
        "resultCode",
        "transId",
      ],
      [
        "accessKey",
        "amount",
        "extraData",
        "message",
        "orderId",
        "orderInfo",
        "partnerCode",
        "requestId",
        "requestType",
        "responseTime",
        "resultCode",
        "transId",
      ],
    ];

    return fieldSets.map((fields) =>
      fields.map((field) => `${field}=${baseValues[field] ?? ""}`).join("&"),
    );
  }

  verifyMoMoSignature(payload) {
    const signature = String(payload?.signature || "");
    if (!signature) {
      throw new BadRequestError("Missing MoMo signature");
    }

    const candidates = this.buildMoMoResponseSignatureCandidates(payload);
    const isValid = candidates.some((raw) => {
      const expected = crypto
        .createHmac("sha256", MOMO_SECRET_KEY)
        .update(raw)
        .digest("hex");
      return expected === signature;
    });

    if (!isValid) {
      throw new BadRequestError("Invalid MoMo signature");
    }
  }

  normalizeMoMoAmount(amount) {
    return Math.max(Math.round((Number(amount) || 0) * MOMO_AMOUNT_MULTIPLIER), 0);
  }

  async findOrderForMoMo(orderId, options = {}) {
    if (!orderId) return null;

    const orderByNumber = await this.orderRepository.findByOrderNumber(orderId, options);
    if (orderByNumber) return orderByNumber;

    const numericId = Number(orderId);
    if (Number.isInteger(numericId) && numericId > 0) {
      return this.orderRepository.findById(numericId);
    }
    return null;
  }

  buildOrderProductRows({
    order,
    reservationVariantQtyMap,
    priceByVariationMap,
    cartItemsMap,
    variantsById,
  }) {
    const rows = [];
    const variationIds =
      reservationVariantQtyMap.size > 0
        ? [...reservationVariantQtyMap.keys()]
        : [...cartItemsMap.keys()];

    for (const variationId of variationIds) {
      const variant = variantsById.get(Number(variationId));
      if (!variant) continue;

      const cartItem = cartItemsMap.get(Number(variationId));
      const quantity =
        reservationVariantQtyMap.get(Number(variationId)) ||
        Math.max(Number(cartItem?.quantity) || 0, 0);
      if (quantity <= 0) continue;

      const unitPrice =
        priceByVariationMap.get(Number(variationId)) ??
        Number(cartItem?.price) ??
        Number(variant.product_item?.price) ??
        0;

      rows.push({
        order_id: order.id,
        product_id: variant.product_item?.product_id ?? null,
        product_item_id: variant.product_item_id ?? variant.product_item?.id ?? null,
        variation_id: Number(variationId),
        quantity,
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
      });
    }

    return rows;
  }

  calculateDiscountAmount(discount, order) {
    const amountForSystem = Math.max(Number(order.total_price) || 0, 0);
    const amountForShipping = Math.max(Number(order.actual_shipping_fee) || 0, 0);
    const value = Math.max(Number(discount.discount_value) || 0, 0);

    if (discount.discount_type === "fixed_amount") {
      return Math.min(value, amountForSystem);
    }
    if (discount.discount_type === "percentage") {
      return Math.min((amountForSystem * value) / 100, amountForSystem);
    }
    if (discount.discount_type === "free_shipping") {
      return amountForShipping;
    }
    if (discount.discount_type === "shipping") {
      return Math.min(value, amountForShipping);
    }
    return 0;
  }

  async upsertOrderProducts(order, reservationSnapshot, transaction) {
    const existingRows = await this.orderProductRepository.findByOrderId(order.id, {
      attributes: ["id"],
      transaction,
      raw: true,
    });
    if (existingRows.length > 0) return;

    const cartItems = await this.cartProductRepository.getModel().findAll({
      where: { cart_id: order.cart_id },
      attributes: ["variation_id", "quantity", "price"],
      transaction,
      raw: true,
    });

    const cartItemsMap = new Map(
      cartItems.map((item) => [Number(item.variation_id), item]),
    );
    const reservationVariantQtyMap = reservationSnapshot.variantQuantities || new Map();
    const priceByVariationMap = new Map(
      Object.entries(reservationSnapshot.prices || {}).map(([variationId, price]) => [
        Number(variationId),
        Number(price),
      ]),
    );

    const variationIds =
      reservationVariantQtyMap.size > 0
        ? [...reservationVariantQtyMap.keys()]
        : [...cartItemsMap.keys()];
    if (variationIds.length === 0) return;

    const variants = await this.productCatalogRepository.findVariantsFullInfoByIds(
      variationIds,
    );
    const variantsById = new Map(variants.map((variant) => [Number(variant.id), variant]));

    const rows = this.buildOrderProductRows({
      order,
      reservationVariantQtyMap,
      priceByVariationMap,
      cartItemsMap,
      variantsById,
    });
    if (rows.length === 0) return;

    await this.orderProductRepository.bulkCreate(rows, { transaction });
  }

  async upsertOrderDiscounts(order, reservationSnapshot, transaction) {
    const existingRows = await this.orderDiscountRepository.findByOrderId(order.id, {
      attributes: ["id"],
      transaction,
      raw: true,
    });
    if (existingRows.length > 0) return;

    const discountIds = reservationSnapshot.discountIds || [];
    if (discountIds.length === 0) return;

    const discounts = await this.discountRepository.findByIds(discountIds, {
      transaction,
    });
    if (!discounts.length) return;

    const discountMeta = reservationSnapshot.discounts || {};
    for (const discount of discounts) {
      const alreadyUsed = await this.orderDiscountRepository.hasUserUsedDiscount(
        order.customer_id,
        discount.id,
        { transaction },
      );
      if (alreadyUsed) continue;

      const amountFromMeta = Number(discountMeta[String(discount.id)]);
      const discountAmount =
        Number.isFinite(amountFromMeta) && amountFromMeta >= 0
          ? amountFromMeta
          : this.calculateDiscountAmount(discount, order);

      await this.orderDiscountRepository.create(
        {
          order_id: order.id,
          customer_id: order.customer_id,
          discount_id: discount.id,
          discount_amount: discountAmount,
        },
        { transaction },
      );

      await this.discountRepository.getModel().increment(
        { discount_users_count: 1 },
        { where: { id: discount.id }, transaction },
      );
    }
  }

  async clearCartAfterPayment(order, transaction) {
    if (!order?.cart_id) return;

    await this.cartProductRepository.getModel().destroy({
      where: { cart_id: order.cart_id },
      transaction,
    });

    await this.cartRepository.getModel().update(
      {
        cart_count_products: 0,
        cart_total_items: 0,
        cart_subtotal: 0,
      },
      {
        where: { id: order.cart_id },
        transaction,
      },
    );
  }

  async decrementVariationStockAfterPayment(order, transaction) {
    const orderProducts = await this.orderProductRepository.findByOrderId(order.id, {
      attributes: ["variation_id", "quantity"],
      transaction,
      raw: true,
    });
    if (!orderProducts.length) {
      throw new InternalServerError("No order items found to finalize stock update");
    }

    const qtyByVariation = new Map();
    for (const item of orderProducts) {
      const variationId = Number(item.variation_id);
      const quantity = Math.max(Number(item.quantity) || 0, 0);
      if (!variationId || quantity <= 0) continue;
      qtyByVariation.set(variationId, (qtyByVariation.get(variationId) || 0) + quantity);
    }

    const Variation = this.productCatalogRepository.models.product_variation;
    for (const [variationId, quantity] of qtyByVariation.entries()) {
      const [affectedCount] = await Variation.update(
        {
          qty_in_stock: this.orderRepository.sequelize.literal(`qty_in_stock - ${quantity}`),
        },
        {
          where: {
            id: variationId,
            qty_in_stock: { [Op.gte]: quantity },
          },
          transaction,
        },
      );

      if (affectedCount !== 1) {
        throw new BadRequestError(
          `Insufficient stock when finalizing paid order for variation ${variationId}`,
        );
      }
    }
  }

  async handleMoMoIpn(payload) {
    this.verifyMoMoSignature(payload);

    const orderIdFromMoMo = String(payload?.orderId || "");
    const order = await this.findOrderForMoMo(orderIdFromMoMo);
    if (!order) {
      throw new NotFoundError("Order not found for MoMo callback");
    }

    const callbackResultCode = Number(payload?.resultCode);
    if (!Number.isFinite(callbackResultCode)) {
      throw new BadRequestError("Invalid MoMo resultCode");
    }

    const transId = payload?.transId ? String(payload.transId) : null;
    const paidAmount = Math.max(Number(payload?.amount) || 0, 0);

    const reservationSnapshot = await this.reservationService.getReservationSnapshot(order.id);

    let finalState = "ignored";
    await this.orderRepository.sequelize.transaction(async (transaction) => {
      const lockedOrder = await this.orderRepository.getModel().findOne({
        where: { id: order.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!lockedOrder) {
        throw new InternalServerError("Order disappeared during MoMo callback handling");
      }

      if (lockedOrder.payment_status === "paid") {
        finalState = "already_paid";
        return;
      }

      if (lockedOrder.order_status === "cancelled") {
        finalState = "already_cancelled";
        return;
      }

      if (callbackResultCode !== 0) {
        await lockedOrder.update(
          {
            payment_status: "failed",
            order_status: "cancelled",
            payment_transaction_id: transId ?? lockedOrder.payment_transaction_id,
            payment_provider: "momo",
            payment_method: "momo",
          },
          { transaction },
        );
        finalState = "failed";
        return;
      }

      const expectedAmount = this.normalizeMoMoAmount(lockedOrder.net_amount);
      if (paidAmount !== expectedAmount) {
        throw new BadRequestError(
          `MoMo amount mismatch. Expected ${expectedAmount}, got ${paidAmount}`,
        );
      }

      await this.upsertOrderProducts(lockedOrder, reservationSnapshot, transaction);
      await this.decrementVariationStockAfterPayment(lockedOrder, transaction);
      await this.upsertOrderDiscounts(lockedOrder, reservationSnapshot, transaction);

      await lockedOrder.update(
        {
          payment_status: "paid",
          order_status: "processing",
          payment_transaction_id: transId ?? lockedOrder.payment_transaction_id,
          payment_provider: "momo",
          payment_method: "momo",
        },
        { transaction },
      );

      await this.clearCartAfterPayment(lockedOrder, transaction);
      finalState = "paid";
    });

    if (["paid", "failed", "already_paid", "already_cancelled"].includes(finalState)) {
      await this.reservationService.releaseReservation(order.id);
    }

    return {
      resultCode: 0,
      message: "IPN processed",
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        state: finalState,
      },
    };
  }
}
