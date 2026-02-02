import { Router } from "express";
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  resendOtpSchema
} from "../validations/auth.validation.js";
import { validationReq } from "../middlewares/validation.middleware.js";

import { AuthController } from "../controllers/auth.controller.js";
import { AuthMiddleWare } from "../middlewares/auth.middleware.js";

const authRouter = Router();

const authController = new AuthController();
const authMiddleware = new AuthMiddleWare();

// ==================== PUBLIC ROUTES ====================
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
authRouter.post(
  "/register",
  validationReq(registerSchema),
  authController.register
);

/**
 * @route   GET /api/v1/auth/verify-email
 * @desc    Verify user email
 * @access  Public
 */
authRouter.get(
  "/verify-email",
  validationReq(verifyEmailSchema),
  authController.verifyEmail
);
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
authRouter.post("/login", validationReq(loginSchema), authController.login);
authRouter.post(
  "/refresh-token",
  validationReq(refreshTokenSchema),
  authMiddleware.verifyAT,
  authController.refreshToken
);

authRouter.post(
  "/logout",
  validationReq(logoutSchema),
  authMiddleware.verifyAT1,
  authController.logout
);


/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset OTP (if email exists)
 * @access  Public
 */
authRouter.post(
  "/forgot-password",
  validationReq(forgotPasswordSchema),
  authController.forgotPassword
);

authRouter.post(
  "/verify-otp",
  validationReq(verifyOtpSchema),
  authController.verifyOtp
);

authRouter.post(
  "/reset-password",
  validationReq(resetPasswordSchema),
  authController.resetPassword
);

authRouter.post(
  "/resend-otp",
  validationReq(resendOtpSchema),
  authController.resendOtp
);


export default authRouter;
