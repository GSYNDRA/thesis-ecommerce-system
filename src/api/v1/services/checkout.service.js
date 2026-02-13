import {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  ErrorResponse,
  NotFoundError,
} from "../utils/response.util.js";
import UserRepository from "../reponsitories/user.reponsitory.js";
import UserSessionRepository from "../reponsitories/userSession.reponsitory.js";
import CartRepository from "../reponsitories/cart.repository.js";
import CartProductRepository from "../reponsitories/cartProduct.reponsitory.js";
import ProductCatalogRepository from "../reponsitories/product_catalog.repository.js";
import { DiscountService } from "./discount.service.js";

const DEFAULT_SHIPPING_FEE = 40000;

export class CheckoutService {
  constructor() {
    this.userRepository = new UserRepository();
    this.userSessionRepository = new UserSessionRepository();
    this.cartRepository = new CartRepository();
    this.cartProductRepository = new CartProductRepository();
    this.productCatalogRepository = new ProductCatalogRepository();
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
    const variants = await this.productCatalogRepository.findVariantsFullInfoByIds(
      variationIds,
    );
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
      if (item.quantity > variant.qty_in_stock) {
        throw new BadRequestError("Quantity exceeds available stock");
      }

      const productItem = variant.product_item;
      const product = productItem?.product;

      return {
        variation_id: item.variation_id,
        quantity: Number(item.quantity),
        price: Number(item.price),
        line_total: Number(item.quantity) * Number(item.price),
        stock_remaining: Number(variant.qty_in_stock),
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

    // 6) Apply discount flow
    let selectedSystemVoucher = null;
    let selectedShippingVoucher = null;

    if (!isManualVoucher) {
      // AUTO MODE: optimize best voucher
      selectedSystemVoucher = this.discountService.pickBestVoucher(
        availableSystemRaw,
        subtotal,
      );
      selectedShippingVoucher = this.discountService.pickBestShippingVoucher(
        availableShippingRaw,
        shippingFee,
      );
    } else {
      // MANUAL MODE: only validate user-selected codes
      if (payload.system_discount_code) {
        selectedSystemVoucher = await this.discountService.validateDiscountCode({
          code: payload.system_discount_code,
          allowedTypes: ["fixed_amount", "percentage"],
        });
      }

      if (payload.shipping_discount_code) {
        selectedShippingVoucher = await this.discountService.validateDiscountCode({
          code: payload.shipping_discount_code,
          allowedTypes: ["free_shipping", "shipping"],
        });
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
      system: availableSystemRaw.map((v) =>
        this.toVoucherResponse(v, subtotal, selectedSystemCode),
      ),
      shipping: availableShippingRaw.map((v) =>
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
}
