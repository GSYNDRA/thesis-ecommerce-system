import { CartService } from "../services/cart.service.js";
import { SuccessResponse } from "../utils/response.util.js";

export class CartController {
  constructor() {
    this.cartServices = new CartService();
  }

  addItemToCart = async (req, res, next) => {
    try {
      const userId = req.auth.userId; // from auth middleware
      const body = req.body;

      const result = await this.cartServices.addToCart(userId, body);

      const successResponse = SuccessResponse.created(
        result,
        "Item added to cart successfully",
      );

      successResponse.send(res);
    } catch (error) {
      next(error);
    }
  };

  getUserCart = async (req, res, next) => {
    try {
      const userId = req.user.id;

      const result = await this.cartServices.getUserCart(userId);

      const successResponse = SuccessResponse.ok(
        result,
        "Get cart successfully",
      );

      successResponse.send(res);
    } catch (error) {
      next(error);
    }
  };

  updateCartItemQuantity = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { cartItemId } = req.params;
      const body = req.body;

      const result = await this.cartServices.updateCartItemQuantity(
        userId,
        cartItemId,
        body,
      );

      const successResponse = SuccessResponse.ok(
        result,
        "Cart item updated successfully",
      );

      successResponse.send(res);
    } catch (error) {
      next(error);
    }
  };

  removeCartItem = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { cartItemId } = req.params;

      const result = await this.cartServices.removeCartItem(userId, cartItemId);

      const successResponse = SuccessResponse.ok(
        result,
        "Cart item removed successfully",
      );

      successResponse.send(res);
    } catch (error) {
      next(error);
    }
  };
}
