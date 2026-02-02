import { AuthService } from "../services/auth.service.js";
import { SuccessResponse } from "../utils/response.util.js";

// route -> validate (zod) -> middleware -> controller -> service -> model
export class AuthController {
  constructor() {
    this.authServices = new AuthService();
  }

  getDeviceInfo(req) {
    return {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection?.remoteAddress,
    };
  }

  register = async (req, res, next) => {
    try {
      const user = req.body;

      // const deviceInfo = this.getDeviceInfo(req)

      const result = await this.authServices.register(user);

      const successResponse = SuccessResponse.created(
        result,
        "User register successfully"
      );

      successResponse.send(res);
    } catch (error) {
      next(error);
    }
  };
  verifyEmail = async (req, res, next) => {
    try {
      const { token } = req.query;
      const deviceInfo = this.getDeviceInfo(req);

      const result = await this.authServices.verifyEmail(token, deviceInfo);

      SuccessResponse.ok(result, "Email verified successfully").send(res);
    } catch (error) {
      next(error);
    }
  };
    login = async (req, res, next) => {
    try {
      const creds = req.body;
      const deviceInfo = this.getDeviceInfo(req);

      const result = await this.authServices.login(creds, deviceInfo);

      SuccessResponse.ok(result, "Login successful").send(res);
    } catch (error) {
      next(error);
    }
  };

    refreshToken = async (req, res, next) => {
  try {
    const deviceInfo = this.getDeviceInfo(req);
    const result = await this.authServices.refreshToken(
      { ...req.auth, refreshToken: req.body.refreshToken },
      deviceInfo
    );
    SuccessResponse.ok(result, "Token refreshed").send(res);
  } catch (error) {
    next(error);
  }
};
logout = async (req, res, next) => {
  try {
    // const deviceInfo = this.getDeviceInfo(req); // if you want to log it
    const result = await this.authServices.logout(req.auth, req.body.refreshToken);
    SuccessResponse.ok(result, "Logged out").send(res);
  } catch (err) {
    next(err);
  }
};

forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await this.authServices.forgotPassword(email);
      SuccessResponse.ok(result, "If the email exists, a password reset OTP has been sent.").send(res);
    } catch (error) {
      next(error);
    }
  };
verifyOtp = async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const result = await this.authServices.verifyOtp({ email, otp });
      SuccessResponse.ok(result, "OTP verified").send(res);
    } catch (error) {
      next(error);
    }
  };
resetPassword = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : null;

      const result = await this.authServices.resetPassword({
        resetToken: token,
        newPassword: req.body.new_password,
      });

      SuccessResponse.ok(result, "Password has been reset successfully.").send(res);
    } catch (error) {
      next(error);
    }
  };

    resendOtp = async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await this.authServices.resendOtp(email);
      SuccessResponse.ok(result, "If the email exists, a new OTP has been sent.").send(res);
    } catch (error) {
      next(error);
    }
  };


}
