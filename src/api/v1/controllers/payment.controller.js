import { PaymentService } from "../services/payment.service.js";

export class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
  }

  momoIpn = async (req, res) => {
    try {
      const data = await this.paymentService.handleMoMoIpn(req.body || {});
      return res.status(200).json(data);
    } catch (error) {
      console.error("[PaymentController.momoIpn] Error:", error?.message || error);
      return res.status(200).json({
        resultCode: 99,
        message: error?.message || "IPN handling failed",
      });
    }
  };
}

