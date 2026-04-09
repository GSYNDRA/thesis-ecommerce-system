import ProductCatalogRepository from "../reponsitories/product_catalog.repository.js";
import UserRepository from "../reponsitories/user.reponsitory.js";
import CartProductRepository from "../reponsitories/cartProduct.reponsitory.js";
import CartRepository from "../reponsitories/cart.repository.js";
import OrderRepository from "../reponsitories/order.repository.js";
import {
  ConflictError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../utils/response.util.js";

export class CartService {
  constructor() {
    this.cartRepository = new CartRepository();
    this.cartProductRepository = new CartProductRepository();
    this.userRepository = new UserRepository();
    this.productCatalogRepository = new ProductCatalogRepository();
    this.orderRepository = new OrderRepository();
  }

  normalizePositiveInteger(value, fieldName) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestError(`${fieldName} must be a positive integer`);
    }
    return parsed;
  }

  async assertUserExists(userId) {
    const normalizedUserId = this.normalizePositiveInteger(userId, "userId");
    const user = await this.userRepository.findById(normalizedUserId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return normalizedUserId;
  }

  async validateVariantForCart(variationId) {
    const normalizedVariationId = this.normalizePositiveInteger(
      variationId,
      "variationId",
    );

    const variantData =
      await this.productCatalogRepository.findPublishedVariationById(
        normalizedVariationId,
      );

    if (!variantData) {
      throw new NotFoundError("Product variation not found");
    }

    if (!variantData.product_item) {
      throw new InternalServerError("Corrupted variation: missing product_item");
    }

    if (!variantData.product_item.product) {
      throw new InternalServerError("Corrupted variation: missing product");
    }

    if (!variantData.product_item.product.is_published) {
      throw new BadRequestError("Product not available");
    }

    return variantData;
  }

  assertStockAvailable(quantity, stock) {
    const normalizedQuantity = this.normalizePositiveInteger(quantity, "quantity");
    const safeStock = Number(stock || 0);

    if (normalizedQuantity > safeStock) {
      throw new BadRequestError(`Only ${safeStock} items left in stock`);
    }

    return normalizedQuantity;
  }

  async ensureCartUnlocked(cartId) {
    const activeOrder = await this.orderRepository.findOpenOrderByCartId(cartId);
    if (activeOrder) {
      throw new ConflictError(
        "This cart is locked for checkout on another session. Please complete payment or wait for reservation timeout.",
      );
    }
  }

  async getOrCreateActiveCart(userId) {
    let cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.createCart(userId);
    }
    return cart;
  }

  async getActiveCartOrThrow(userId) {
    const cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      throw new NotFoundError("Cart not found");
    }
    return cart;
  }

  async buildCartSnapshot(cart) {
    const cartProducts = await this.cartProductRepository.findByCartId(cart.id);

    const cart_total_items = cartProducts.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    const cart_subtotal = cartProducts.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
      0,
    );

    await cart.update({
      cart_total_items,
      cart_count_products: cartProducts.length,
      cart_subtotal,
    });

    const variationIds = [...new Set(cartProducts.map((item) => item.variation_id))];
    const variants =
      variationIds.length > 0
        ? await this.productCatalogRepository.findVariantsFullInfoByIds(variationIds)
        : [];
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    const cart_items = cartProducts.map((item) => ({
      cart_item_id: item.id,
      variation_id: item.variation_id,
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      variant: variantMap.get(item.variation_id) || null,
    }));

    return {
      cart_id: cart.id,
      cart_total_items,
      cart_subtotal,
      cart_items,
    };
  }

  /* ----------------------------------------------------
   * Add item to cart
   * -------------------------------------------------- */
  async addToCart(userId, payload) {
    try {
      const { variationId, quantity } = payload;

      const normalizedUserId = await this.assertUserExists(userId);
      const variantData = await this.validateVariantForCart(variationId);
      const normalizedQuantity = this.assertStockAvailable(
        quantity,
        variantData.qty_in_stock,
      );

      const cart = await this.getOrCreateActiveCart(normalizedUserId);
      await this.ensureCartUnlocked(cart.id);

      const cartProduct = await this.cartProductRepository.findByCartAndVariation(
        cart.id,
        variantData.id,
      );

      if (cartProduct) {
        const updatedQuantity = Number(cartProduct.quantity || 0) + normalizedQuantity;
        this.assertStockAvailable(updatedQuantity, variantData.qty_in_stock);
        await this.cartProductRepository.updateQuantity(cartProduct.id, updatedQuantity);
      } else {
        await this.cartProductRepository.createCartProduct({
          cart_id: cart.id,
          variation_id: variantData.id,
          quantity: normalizedQuantity,
          price: variantData.product_item.price,
        });
      }

      return this.buildCartSnapshot(cart);
    } catch (err) {
      console.error(
        "AddToCart failed:",
        err.message,
        err.parent?.detail || err.original,
      );
      throw err;
    }
  }

  /* ----------------------------------------------------
   * Get user cart
   * -------------------------------------------------- */
  async getUserCart(userId) {
    try {
      const normalizedUserId = await this.assertUserExists(userId);
      const cart = await this.cartRepository.findActiveCartByUserId(normalizedUserId);

      if (!cart) {
        return {
          cart_id: null,
          cart_total_items: 0,
          cart_subtotal: 0,
          cart_items: [],
        };
      }

      return this.buildCartSnapshot(cart);
    } catch (err) {
      console.error(
        "GetUserCart failed:",
        err.message,
        err.parent?.detail || err.original,
      );
      throw err;
    }
  }

  /* ----------------------------------------------------
   * Update cart item quantity
   * -------------------------------------------------- */
  async updateCartItemQuantity(userId, cartItemId, payload) {
    try {
      const normalizedUserId = await this.assertUserExists(userId);
      const normalizedCartItemId = this.normalizePositiveInteger(
        cartItemId,
        "cartItemId",
      );
      const normalizedQuantity = this.normalizePositiveInteger(
        payload?.quantity,
        "quantity",
      );

      const cart = await this.getActiveCartOrThrow(normalizedUserId);
      await this.ensureCartUnlocked(cart.id);

      const cartItem = await this.cartProductRepository.findByIdAndCart(
        normalizedCartItemId,
        cart.id,
      );
      if (!cartItem) {
        throw new NotFoundError("Cart item not found");
      }

      const variantData = await this.validateVariantForCart(cartItem.variation_id);
      this.assertStockAvailable(normalizedQuantity, variantData.qty_in_stock);

      await this.cartProductRepository.updateQuantity(
        normalizedCartItemId,
        normalizedQuantity,
      );

      return this.buildCartSnapshot(cart);
    } catch (err) {
      console.error(
        "UpdateCartItemQuantity failed:",
        err.message,
        err.parent?.detail || err.original,
      );
      throw err;
    }
  }

  /* ----------------------------------------------------
   * Remove item from cart
   * -------------------------------------------------- */
  async removeCartItem(userId, cartItemId) {
    try {
      const normalizedUserId = await this.assertUserExists(userId);
      const normalizedCartItemId = this.normalizePositiveInteger(
        cartItemId,
        "cartItemId",
      );

      const cart = await this.getActiveCartOrThrow(normalizedUserId);
      await this.ensureCartUnlocked(cart.id);

      const cartItem = await this.cartProductRepository.findByIdAndCart(
        normalizedCartItemId,
        cart.id,
      );
      if (!cartItem) {
        throw new NotFoundError("Cart item not found");
      }

      await this.cartProductRepository.removeById(normalizedCartItemId);

      return this.buildCartSnapshot(cart);
    } catch (err) {
      console.error(
        "RemoveCartItem failed:",
        err.message,
        err.parent?.detail || err.original,
      );
      throw err;
    }
  }
}
