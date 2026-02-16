import DiscountRepository from "../reponsitories/discount.repository.js";
import OrderDiscountRepository from "../reponsitories/orderDiscount.repository.js";
import { BadRequestError } from "../utils/response.util.js";

const SYSTEM_DISCOUNT_TYPES = ["fixed_amount", "percentage"];
const SHIPPING_DISCOUNT_TYPES = ["free_shipping", "shipping"];
const DEFAULT_SHIPPING_FEE = 40000;

export class DiscountService {
  constructor() {
    this.discountRepository = new DiscountRepository();
    this.orderDiscountRepository = new OrderDiscountRepository();
  }

  async applyDiscountsForPreview(userId, payload, pricing) {
    const subtotal = Number(pricing?.subtotal) || 0;
    const shippingFee =
      Number(pricing?.shippingFee) > 0
        ? Number(pricing.shippingFee)
        : DEFAULT_SHIPPING_FEE;
    const isManualVoucher =
      Boolean(payload.system_discount_code) ||
      Boolean(payload.shipping_discount_code);

    if (!isManualVoucher) {
      return this.applyBestDiscounts(userId, subtotal, shippingFee);
    }

    return this.applyManualDiscounts(userId, payload, subtotal, shippingFee);
  }

  async getAvailableSystemVouchers(userId, subtotal) {
    return this.getAvailableVouchersByTypes(
      userId,
      SYSTEM_DISCOUNT_TYPES,
      subtotal,
    );
  }

  async getAvailableShippingVouchers(userId, subtotal) {
    return this.getAvailableVouchersByTypes(
      userId,
      SHIPPING_DISCOUNT_TYPES,
      subtotal,
    );
  }

  async getAvailableVouchersByTypes(userId, discountTypes, orderAmount) {
    const vouchers = await this.discountRepository.findActiveDiscountsByTypes(
      discountTypes,
      orderAmount,
    );
    if (!vouchers || vouchers.length === 0) return [];

    const voucherIds = vouchers.map((voucher) => voucher.id);
    const usedDiscountIds = await this.orderDiscountRepository.getUsedDiscountIdsByUser(
      userId,
      voucherIds,
    );

    return vouchers.filter((voucher) =>
      this.isVoucherEligibleForUser(voucher, orderAmount, usedDiscountIds),
    );
  }

  async applyBestDiscounts(userId, subtotal, shippingFee) {
    const availableSystemVouchers = await this.getAvailableSystemVouchers(
      userId,
      subtotal,
    );
    const availableShippingVouchers = await this.getAvailableShippingVouchers(
      userId,
      subtotal,
    );

    const bestSystemVoucher = this.pickBestVoucher(
      availableSystemVouchers,
      subtotal,
    );
    const shippingVoucherCandidates = bestSystemVoucher
      ? availableShippingVouchers.filter(
          (voucher) => voucher.id !== bestSystemVoucher.id,
        )
      : availableShippingVouchers;

    const bestShippingVoucher = this.pickBestShippingVoucher(
      shippingVoucherCandidates,
      shippingFee,
    );

    const systemDiscount = bestSystemVoucher
      ? this.calculateDiscount(bestSystemVoucher, subtotal)
      : 0;
    const shippingDiscount = bestShippingVoucher
      ? this.calculateDiscount(bestShippingVoucher, shippingFee)
      : 0;

    return this.buildDiscountBreakdown({
      mode: "auto",
      systemVoucher: bestSystemVoucher,
      shippingVoucher: bestShippingVoucher,
      systemDiscount,
      shippingDiscount,
    });
  }

  async applyManualDiscounts(userId, payload, subtotal, shippingFee) {
    let systemVoucher = null;
    let shippingVoucher = null;
    let systemDiscount = 0;
    let shippingDiscount = 0;

    if (payload.system_discount_code) {
      systemVoucher = await this.validateDiscountCode({
        code: payload.system_discount_code,
        allowedTypes: SYSTEM_DISCOUNT_TYPES,
        userId,
        orderAmount: subtotal,
      });
      systemDiscount = this.calculateDiscount(systemVoucher, subtotal);
    }

    if (payload.shipping_discount_code) {
      shippingVoucher = await this.validateDiscountCode({
        code: payload.shipping_discount_code,
        allowedTypes: SHIPPING_DISCOUNT_TYPES,
        userId,
        orderAmount: subtotal,
      });
      shippingDiscount = this.calculateDiscount(shippingVoucher, shippingFee);
    }

    return this.buildDiscountBreakdown({
      mode: "manual",
      systemVoucher,
      shippingVoucher,
      systemDiscount,
      shippingDiscount,
    });
  }

  async validateDiscountCode({ code, allowedTypes, userId, orderAmount }) {
    const voucher = await this.discountRepository.findActiveDiscountByCode(code);

    if (!voucher) {
      throw new BadRequestError("Discount code is invalid or expired");
    }

    if (!allowedTypes.includes(voucher.discount_type)) {
      throw new BadRequestError("Discount code type is not supported here");
    }

    const minOrderValue = Number(voucher.discount_min_order_value) || 0;
    if ((Number(orderAmount) || 0) < minOrderValue) {
      throw new BadRequestError(
        `Order value must be at least ${minOrderValue} to use this discount code`,
      );
    }

    const maxUses = Number(voucher.discount_max_uses) || 0;
    const usersCount = Number(voucher.discount_users_count) || 0;
    if (maxUses > 0 && usersCount >= maxUses) {
      throw new BadRequestError("Discount code has reached maximum usage");
    }

    if (userId) {
      const userUsed = await this.orderDiscountRepository.hasUserUsedDiscount(
        userId,
        voucher.id,
      );
      if (userUsed) {
        throw new BadRequestError("You have already used this discount code");
      }
    }

    return voucher;
  }

  isVoucherEligibleForUser(voucher, orderAmount, usedDiscountIds) {
    const minOrderValue = Number(voucher.discount_min_order_value) || 0;
    const maxUses = Number(voucher.discount_max_uses) || 0;
    const usersCount = Number(voucher.discount_users_count) || 0;
    const isOrderEligible = (Number(orderAmount) || 0) >= minOrderValue;
    const hasRemainingGlobalUses = maxUses <= 0 || usersCount < maxUses;
    const isUnusedByUser = !usedDiscountIds.has(Number(voucher.id));

    return isOrderEligible && hasRemainingGlobalUses && isUnusedByUser;
  }

  pickBestVoucher(vouchers, amount) {
    if (!vouchers || vouchers.length === 0) return null;

    let bestVoucher = null;
    let maxDiscount = 0;

    for (const voucher of vouchers) {
      const discountAmount = this.calculateDiscount(voucher, amount);
      if (discountAmount > maxDiscount) {
        maxDiscount = discountAmount;
        bestVoucher = voucher;
      }
    }

    return bestVoucher;
  }

  pickBestShippingVoucher(vouchers, shippingFee) {
    if (!vouchers || vouchers.length === 0) return null;

    // Business rule: always prefer free_shipping when available.
    const freeShippingVouchers = vouchers.filter(
      (voucher) => voucher.discount_type === "free_shipping",
    );
    if (freeShippingVouchers.length > 0) {
      const randomIndex = Math.floor(Math.random() * freeShippingVouchers.length);
      return freeShippingVouchers[randomIndex];
    }

    // Fallback to normal optimization for non-free-shipping vouchers.
    return this.pickBestVoucher(vouchers, shippingFee);
  }

  calculateDiscount(voucher, amount) {
    const safeAmount = Math.max(Number(amount) || 0, 0);
    const value = Math.max(Number(voucher.discount_value) || 0, 0);

    if (voucher.discount_type === "fixed_amount") {
      return Math.min(value, safeAmount);
    }

    if (voucher.discount_type === "percentage") {
      return Math.min((safeAmount * value) / 100, safeAmount);
    }

    if (voucher.discount_type === "free_shipping") {
      return safeAmount;
    }

    if (voucher.discount_type === "shipping") {
      return Math.min(value, safeAmount);
    }

    return 0;
  }

  buildDiscountBreakdown({
    mode,
    systemVoucher,
    shippingVoucher,
    systemDiscount,
    shippingDiscount,
  }) {
    return {
      mode,
      system_discount: systemVoucher
        ? {
            code: systemVoucher.discount_code,
            type: systemVoucher.discount_type,
            value: Number(systemVoucher.discount_value),
            amount: systemDiscount,
          }
        : null,
      shipping_discount: shippingVoucher
        ? {
            code: shippingVoucher.discount_code,
            type: shippingVoucher.discount_type,
            value: Number(shippingVoucher.discount_value),
            amount: shippingDiscount,
          }
        : null,
      totalDiscount: systemDiscount + shippingDiscount,
    };
  }
}
