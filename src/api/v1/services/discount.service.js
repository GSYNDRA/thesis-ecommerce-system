import DiscountRepository from "../reponsitories/discount.repository.js";
import { BadRequestError } from "../utils/response.util.js";

const SYSTEM_DISCOUNT_TYPES = ["fixed_amount", "percentage"];
const SHIPPING_DISCOUNT_TYPES = ["free_shipping", "shipping"];
const DEFAULT_SHIPPING_FEE = 40000;

export class DiscountService {
  constructor() {
    this.discountRepository = new DiscountRepository();
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

  async getAvailableVouchersByTypes(_userId, discountTypes, orderAmount) {
    const vouchers = await this.discountRepository.findActiveDiscountsByTypes(
      discountTypes,
      orderAmount,
    );
    return vouchers;
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

  async applyManualDiscounts(_userId, payload, subtotal, shippingFee) {
    let systemVoucher = null;
    let shippingVoucher = null;
    let systemDiscount = 0;
    let shippingDiscount = 0;

    if (payload.system_discount_code) {
      systemVoucher = await this.validateDiscountCode({
        code: payload.system_discount_code,
        allowedTypes: SYSTEM_DISCOUNT_TYPES,
      });
      systemDiscount = this.calculateDiscount(systemVoucher, subtotal);
    }

    if (payload.shipping_discount_code) {
      shippingVoucher = await this.validateDiscountCode({
        code: payload.shipping_discount_code,
        allowedTypes: SHIPPING_DISCOUNT_TYPES,
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

  async validateDiscountCode({ code, allowedTypes }) {
    const voucher = await this.discountRepository.findActiveDiscountByCode(code);

    if (!voucher) {
      throw new BadRequestError("Discount code is invalid or expired");
    }

    if (!allowedTypes.includes(voucher.discount_type)) {
      throw new BadRequestError("Discount code type is not supported here");
    }

    return voucher;
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
