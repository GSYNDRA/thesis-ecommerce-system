import { Router } from "express";

import { validationReq } from "../middlewares/validation.middleware.js";
import { addToCartSchema } from "../validations/cart.validation.js";
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

export default cartRouter;

