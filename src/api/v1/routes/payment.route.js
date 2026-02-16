import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";

const paymentRouter = Router();
const paymentController = new PaymentController();

/**
 * @route   POST /api/v1/payment/momo/ipn
 * @desc    MoMo IPN callback
 * @access  Public
 */
paymentRouter.post("/momo/ipn", paymentController.momoIpn);

export default paymentRouter;

