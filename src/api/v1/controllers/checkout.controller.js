import { CheckoutService } from "../services/checkout.service.js";
import { SuccessResponse } from "../utils/response.util.js";

export class CheckoutController {
  constructor() {
    this.checkoutService = new CheckoutService();
  }

  previewCheckout = async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      const body = req.body;

      const previewData = await this.checkoutService.previewCheckout(
        userId,
        body,
      );

      const successResponse = SuccessResponse.ok(
        previewData,
        "Checkout preview generated successfully",
      );

      successResponse.send(res);
    } catch (error) {
      next(error);
    }
  };
  placeOrder = async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      const body = req.body;

      const orderData = await this.checkoutService.placeOrder(userId, body);

      const successResponse = SuccessResponse.created(
        orderData,
        "Order placed successfully",
      );

      successResponse.send(res);
    } catch (error) {
      next(error);
    }
  };
}
