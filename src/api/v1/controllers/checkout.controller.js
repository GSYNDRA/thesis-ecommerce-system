import { CheckoutService } from "../services/checkout.service.js";
import { SuccessResponse } from "../utils/response.util.js";

export class CheckoutController {
  constructor() {
    this.checkoutService = new CheckoutService();
  }

  previewCheckout = async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      const payload = {
        ...(req.query || {}),
        ...(req.body || {}),
      };

      const previewData = await this.checkoutService.previewCheckout(
        userId,
        payload,
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

  getOrderStatus = async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      const orderId = req.params.orderId;

      const result = await this.checkoutService.getOrderStatus(userId, orderId);

      SuccessResponse.ok(result, "Order status fetched successfully").send(res);
    } catch (error) {
      next(error);
    }
  };
}
