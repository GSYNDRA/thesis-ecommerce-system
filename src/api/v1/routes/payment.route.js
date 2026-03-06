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

/**
 * @route   GET /api/v1/payment/momo/redirect
 * @desc    Relay MoMo redirect to frontend route
 * @access  Public
 */
paymentRouter.get("/momo/redirect", paymentController.momoRedirect);

export default paymentRouter;
