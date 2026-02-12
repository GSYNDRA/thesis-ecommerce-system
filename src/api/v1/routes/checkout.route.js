import { Router } from "express";

import { AuthMiddleWare } from "../middlewares/auth.middleware.js";
import { validationReq } from "../middlewares/validation.middleware.js";
import { CheckoutController } from "../controllers/checkout.controller.js";
import { previewCheckoutSchema } from "../validations/checkout.validation.js";

const checkoutRouter = Router();
const checkoutController = new CheckoutController();
const authMiddleWare = new AuthMiddleWare();

// ==================== PROTECTED ROUTES ====================
/**
 * @route   GET /api/v1/checkout/preview
 * @desc    Preview checkout summary for the authenticated user
 * @access  Private
 */
checkoutRouter.get(
  "/preview",
  authMiddleWare.verifyAT1,
  // validationReq(previewCheckoutSchema),
  checkoutController.previewCheckout,
);

export default checkoutRouter;
