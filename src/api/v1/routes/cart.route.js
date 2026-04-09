import { Router } from "express";

import { validationReq } from "../middlewares/validation.middleware.js";
import {
  addToCartSchema,
  removeCartItemSchema,
  updateCartItemQuantitySchema,
} from "../validations/cart.validation.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { CartController} from "../controllers/cart.controller.js";
const cartRouter = Router();

const cartController = new CartController();
const authMiddleWare = new AuthMiddleWare();
// ==================== PUBLIC ROUTES ====================
/**
 * @route   POST /api/v1/cart/add
 * @desc    Add an item to the cart
 * @access  Public
 */
cartRouter.post(
  "/add",
  authMiddleWare.verifyAT1,
  validationReq(addToCartSchema),
  cartController.addItemToCart,
);

/**
 * @route   GET /api/v1/cart
 * @desc    Get authenticated user's active cart
 * @access  Private
 */
cartRouter.get(
  "/",
  authMiddleWare.verifyAT1,
  cartController.getUserCart,
);

/**
 * @route   PATCH /api/v1/cart/items/:cartItemId
 * @desc    Update quantity for a cart item
 * @access  Private
 */
cartRouter.patch(
  "/items/:cartItemId",
  authMiddleWare.verifyAT1,
  validationReq(updateCartItemQuantitySchema),
  cartController.updateCartItemQuantity,
);

/**
 * @route   DELETE /api/v1/cart/items/:cartItemId
 * @desc    Remove an item from cart
 * @access  Private
 */
cartRouter.delete(
  "/items/:cartItemId",
  authMiddleWare.verifyAT1,
  validationReq(removeCartItemSchema),
  cartController.removeCartItem,
);

export default cartRouter;

