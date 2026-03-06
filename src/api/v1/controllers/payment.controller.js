import { PaymentService } from "../services/payment.service.js";
import config from "../configs/config.sequelize.js";

function buildFrontendRedirectUrl(query = {}) {
  const baseUrl = (config.app?.url || process.env.APP_URL || "http://localhost:5501").replace(/\/+$/, "");
  const target = new URL(`${baseUrl}/checkout/result`);

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => target.searchParams.append(key, String(item)));
      return;
    }

    if (value !== undefined && value !== null) {
      target.searchParams.set(key, String(value));
    }
  });

  return target.toString();
}

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

  momoRedirect = async (req, res) => {
    const redirectUrl = buildFrontendRedirectUrl(req.query || {});
    return res.redirect(302, redirectUrl);
  };
}
