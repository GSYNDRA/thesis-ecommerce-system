// import { CartRepository } from '../repositories/cart.repository.js'
import ProductCatalogRepository from "../reponsitories/product_catalog.repository.js";
import UserRepository from "../reponsitories/user.reponsitory.js";
import UserSessionRepository from "../reponsitories/userSession.reponsitory.js";
import CartProductRepository from "../reponsitories/cartProduct.reponsitory.js";
import CartRepository from "../reponsitories/cart.repository.js";
import OrderRepository from "../reponsitories/order.repository.js";
import {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  ErrorResponse,
  NotFoundError,
} from "../utils/response.util.js";
export class CartService {
  constructor() {
    this.cartRepository = new CartRepository()
    this.productVariationRepository = new ProductCatalogRepository();
    this.cartProductRepository = new CartProductRepository();
    this.userRepository = new UserRepository();
    this.userSessionRepository = new UserSessionRepository();
    this.productCatalogRepository = new ProductCatalogRepository();
    this.orderRepository = new OrderRepository();
  }

  /* ----------------------------------------------------
   * Add item to cart
   * -------------------------------------------------- */
  async addToCart(userId, payload) {
    try {
      // TODO: implement logic
      const { variationId, quantity } = payload;

      /* ----------------------------------------------------
       * 1. Validate user (session already verified)
       * -------------------------------------------------- */
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      /* ----------------------------------------------------
       * 2. Validate product variation (SKU level)
       * 3. Resolve product_item
       * 4. Resolve product
       * -------------------------------------------------- */
      const variantData =
        await this.productCatalogRepository.findPublishedVariationById(
          variationId,
        );

      if (!variantData) {
        throw new NotFoundError("Product variation not found");
      }

      if (!variantData.product_item) {
        throw new InternalServerError(
          "Corrupted variation: missing product_item",
        );
      }

      if (!variantData.product_item.product) {
        throw new InternalServerError("Corrupted variation: missing product");
      }

      if (!variantData.product_item.product.is_published) {
        throw new BadRequestError("Product not available");
      }

      /* ----------------------------------------------------
       * 5. Validate stock
       * -------------------------------------------------- */
      if (quantity > variantData.qty_in_stock) {
        throw new BadRequestError(
          `Only ${variantData.qty_in_stock} items left in stock`,
        );
      }
      // ✅ stop here as requested
      // return variantData;
      /* ----------------------------------------------------
       * 6. Get or create active cart
       * -------------------------------------------------- */
      let cart = await this.cartRepository.findActiveCartByUserId(userId);

      if (!cart) {
        console.log("No active cart found, creating a new one...");
        cart = await this.cartRepository.createCart(userId);

      }

      /* ----------------------------------------------------
       * 6.1 Block cart mutation while checkout order is active
       * -------------------------------------------------- */
      const activeOrder = await this.orderRepository.findOpenOrderByCartId(cart.id);
      if (activeOrder) {
        throw new ConflictError(
          "This cart is locked for checkout on another session. Please complete payment or wait for reservation timeout.",
        );
      }

      /* ----------------------------------------------------
       * 7. Add or update cart product
       * -------------------------------------------------- */
      const cartProduct = await this.cartProductRepository.findByCartAndVariation(
        cart.id,
        variationId,
      );
      // return cartProduct;
      if (cartProduct) {
        const updatedQuantity = cartProduct.quantity + quantity;
        console.log("Updated quantity:", updatedQuantity);
        if (updatedQuantity > variantData.qty_in_stock) {
          throw new BadRequestError(
            `Only ${variantData.qty_in_stock} items left in stock`,
          );
        }
        console.log(cartProduct.id)
        await this.cartProductRepository.updateQuantity(
          cartProduct.id,
          updatedQuantity,
        );
      } else {
        await this.cartProductRepository.createCartProduct({
          cart_id: cart.id,
          variation_id: variationId,
          quantity,
          price: variantData.product_item.price, // snapshot
        });
      }

      /* ----------------------------------------------------
       * 8. Get cart products
       * -------------------------------------------------- */
      const cartProducts = await this.cartProductRepository.findByCartId(cart.id);


      /* ----------------------------------------------------
       * 9. Recalculate cart summary
       * -------------------------------------------------- */
      const cart_total_items = cartProducts.reduce(
        (sum, p) => sum + p.quantity,
        0,
      );

      const cart_subtotal = cartProducts.reduce(
        (sum, p) => sum + p.quantity * p.price,
        0,
      );

      await cart.update({
        cart_total_items,
        cart_count_products: cartProducts.length,
        cart_subtotal,
      });

      /* ----------------------------------------------------
       * 10. Get full variant info for FE
       * -------------------------------------------------- */
      const uniqueVariationIds = [
        ...new Set(cartProducts.map((p) => p.variation_id)),
      ];

      const variants =
        await this.productCatalogRepository.findVariantsFullInfoByIds(
          uniqueVariationIds,
        );

      /* ----------------------------------------------------
       * 11. Merge cart data + variant data
       * -------------------------------------------------- */
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      const cart_items = cartProducts.map((p) => ({
        variation_id: p.variation_id,
        quantity: p.quantity,
        price: p.price,
        variant: variantMap.get(p.variation_id) || null,
      }));

      /* ----------------------------------------------------
       * 12. Response
       * -------------------------------------------------- */
      return {
        cart_id: cart.id,
        cart_total_items,
        cart_subtotal,
        cart_items,
      };
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
      // TODO: implement logic
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
      // TODO: implement logic
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
      // TODO: implement logic
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
