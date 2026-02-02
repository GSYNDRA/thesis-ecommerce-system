import UserRepository from "../reponsitories/user.reponsitory.js";
import UserSessionRepository from "../reponsitories/userSession.reponsitory.js";
import jwt from "jsonwebtoken";
import { JWTServices } from "./jwt.service.js";
import { BcryptServices } from "../utils/bcrypt.util.js";
// import { JWTServices } from '~/api/v1/services/jwt.service'
import {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError ,
  ErrorResponse
} from "../utils/response.util.js";
import { EmailServices } from "./email.service.js";
import { USER_ROLE } from "../constants/common.constant.js";
import crypto from "crypto";
import envConfig from "../configs/config.sequelize.js";
import { Op } from "sequelize";

// Email verification token expiry (in minutes)
const EMAIL_VERIFY_EXPIRES_MINUTES = 30;
const MAX_ACTIVE_SESSIONS = 3;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

const MAX_RESET_ATTEMPTS = 5;
const RESET_LOCK_MINUTES = 15;

const RESEND_COOLDOWN_MS = 30_000; // 30 seconds
const OTP_EXPIRES_MS = 5 * 60 * 1000;
// import { UserMessage } from '~/api/v1/constants/messages.constant'
// import {
//   RefreshTokenRepository,
//   TokenCleanUpScheduler
// } from '~/api/v1/repositories/refreshToken.repository'
// import { TokenBlacklistRepository } from '~/api/v1/repositories/tokenBlacklist.repository'

export class AuthService {
  // constructor() {
  //   this.userRepository = new UserRepository()
  //   this.refreshTokenRepository = new RefreshTokenRepository()
  //   this.tokenCleanUpScheduler = new TokenCleanUpScheduler()
  //   this.tokenBlacklistRepository = new TokenBlacklistRepository()

  //   // Run cleanup weekly after AuthService starts
  //   this.tokenCleanUpScheduler.startWeeklyCleanup()
  // }
  constructor() {
    this.userRepository = new UserRepository();
    this.userSessionRepository = new UserSessionRepository();

    // this.emailService = new EmailService()
  }

  getDateForToken() {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(now.getDate() + 30); // 30 days

    return {
      iat: now,
      exp: expiresAt,
    };
  }

  // Register new user
  async register(user) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        gender,
      } = user;

      /* ----------------------------------------------------
       * 1. Normalize email & validate inputs
       * -------------------------------------------------- */
      if (!email) {
        throw new BadRequestError("Email is required");
      }
      if (!password) {
        throw new BadRequestError("Password is required");
      }

      const normalizedEmail = email.toLowerCase().trim();
      const trimmedPassword = password.trim();

      /* ----------------------------------------------------
       * 2. Check existing user
       * -------------------------------------------------- */
      const existingUser = await this.userRepository.findByEmail(
        normalizedEmail
      );

      if (existingUser) {
        if (existingUser.is_email_verified) {
          throw new ConflictError('Email already registered')
        }

        // Existing but unverified → resend verification
        await this.resendVerification(existingUser);
        return {
          message: "Verification email has been resent",
        };
      }

      /* ----------------------------------------------------
       * 3. Hash password
       * -------------------------------------------------- */
      const hashPassword = await BcryptServices.hashPassword(trimmedPassword);

      /* ----------------------------------------------------
       * 4. Generate email verification token
       * -------------------------------------------------- */

      // Raw token sent to user (URL-safe)
      const rawEmailVerificationToken = crypto.randomBytes(32).toString("hex"); // 64-char token

      // Hash token before storing (prevents DB leaks)
      const hashedEmailVerificationToken = crypto
        .createHash("sha256")
        .update(rawEmailVerificationToken)
        .digest("hex");

      const emailVerificationExpires = new Date(
        Date.now() + EMAIL_VERIFY_EXPIRES_MINUTES * 60 * 1000
      );

      /* ----------------------------------------------------
       * 5. Create user (unverified)
       * -------------------------------------------------- */
      await this.userRepository.create({
        email: normalizedEmail,
        hash_password: hashPassword,
        first_name: firstName?.trim() || "",
        last_name: lastName?.trim() || "",
        phone_number: phoneNumber || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || "other",
        role_id: USER_ROLE.CUSTOMER,

        is_email_verified: false,
        is_phone_verified: false,
        status: "active",

        email_verification_token: hashedEmailVerificationToken,
        email_verification_expires: emailVerificationExpires,
      });

      /* ----------------------------------------------------
       * 6. Send verification email
       * -------------------------------------------------- */

      const verifyUrl = `${envConfig.app.url}/verify-email?token=${rawEmailVerificationToken}`;

      const sent = await EmailServices.sendVerifyEmail(
        normalizedEmail,
        verifyUrl
      );
      if (!sent) {
        throw new Error("Failed to send verification email");
      }

      /* ----------------------------------------------------
       * 7. Response
       * -------------------------------------------------- */
      return {
        message: "Registration successful. Please verify your email.",
      };
    } catch (err) {
      console.error(
        "Register failed:",
        err.message,
        err.parent?.detail || err.original
      );
      throw err; // ném lại để middleware error xử lý
    }
  }

  /* ----------------------------------------------------
   * Resend verification
   * -------------------------------------------------- */
  async resendVerification(user) {
    // Raw token sent to user (URL-safe)
    const rawEmailVerificationToken = crypto.randomBytes(32).toString("hex"); // 64-char token
    const hashedEmailVerificationToken = crypto
      .createHash("sha256")
      .update(rawEmailVerificationToken)
      .digest("hex");

    const emailVerificationExpires = new Date(
      Date.now() + EMAIL_VERIFY_EXPIRES_MINUTES * 60 * 1000
    );

    await this.userRepository.update(
      { id: user.id },
      {
        email_verification_token: hashedEmailVerificationToken,
        email_verification_expires: emailVerificationExpires,
      }
    );

    const verifyUrl = `${envConfig.app.url}/verify-email?token=${rawEmailVerificationToken}`;

    await EmailServices.sendVerifyEmail(user.email, verifyUrl);
  }

  // inside AuthService
  async verifyEmail(rawToken, deviceInfo = {}) {
    if (!rawToken) throw new BadRequestError("Verification token is required");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // STEP 1 + 2: find by token & ensure not expired
    const user = await this.userRepository.findOne({
      email_verification_token: hashedToken,
      email_verification_expires: { [Op.gt]: new Date() },
    });
    if (!user) {
      throw new BadRequestError("Verification token is invalid or has expired");
    }

    // STEP 3: mark verified & clear token
    await this.userRepository.update(
      { id: user.id },
      {
        is_email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
        login_attempts: 0,
        account_locked_until: null,
        last_login: new Date(),
      }
    );

    // STEP 4: session identifiers
    const jti = crypto.randomUUID();
    const ait = Date.now();

    // STEP 5: tokens via JWTServices
    const { accessToken, refreshToken } = JWTServices.generateTokens(
      { id: user.id, email: user.email, role: user.role_id },
      { jti, ait }
    );

    // derive refresh expiry for session record
    const refreshExp =
      JWTServices.getTokenExpired(refreshToken) ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // STEP 6: persist session
    await this.userSessionRepository.create({
      user_id: user.id,
      jti,
      ait,
      device_user_agent: deviceInfo.userAgent || null,
      device_ip: deviceInfo.ip || null,
      revoked: false,
      expires_at: refreshExp,
      last_activity_at: new Date(),
    });

    // STEP 7: enforce max sessions
    await this.userSessionRepository.enforceLimit(user.id, MAX_ACTIVE_SESSIONS);

    // STEP 8 + 9: respond
    return {
      message: "Email verified successfully",
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, is_email_verified: true },
    };
  }

  async login(credentials, deviceInfo = {}) {
    try {
      const { email, password } = credentials || {};
      if (!email || !password)
        throw new BadRequestError("Email and password are required");

      const normalizedEmail = email.toLowerCase().trim();
      const trimmedPassword = password.trim();

      // Fetch user
      const user = await this.userRepository.findByEmail(normalizedEmail);
      if (!user) throw new UnauthorizedError("Invalid credentials");

      // Status checks
      if (["deleted", "suspended"].includes(user.status)) {
        throw new UnauthorizedError("Account is not active");
      }
      const now = new Date();
      if (
        user.account_locked_until &&
        new Date(user.account_locked_until) > now
      ) {
        throw new UnauthorizedError("Account locked. Please try again later");
      }

      // Email verification
      if (!user.is_email_verified) {
        throw new UnauthorizedError("Please verify your email");
      }

      // Password check
      const isMatch = await BcryptServices.comparePassword(
        trimmedPassword,
        user.hash_password
      );
      if (!isMatch) {
        await this.handleFailedLogin(user);
        throw new UnauthorizedError("Invalid credentials");
      }

      // Reset attempts & update last login
      await this.userRepository.update(
        { id: user.id },
        {
          login_attempts: 0,
          account_locked_until: null,
          last_login: now,
        }
      );

      // Enforce max sessions (revoke oldest to make room for new one)
      await this.userSessionRepository.enforceLimit(
        user.id,
        MAX_ACTIVE_SESSIONS
      );
      // Session identifiers
      const jti = crypto.randomUUID();
      const ait = Date.now();

      // Tokens
      const { accessToken, refreshToken } = JWTServices.generateTokens(
        { id: user.id, email: user.email, role: user.role_id },
        { jti, ait }
      );

      const refreshExp =
        JWTServices.getTokenExpired(refreshToken) ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Persist new session
      await this.userSessionRepository.create({
        user_id: user.id,
        jti,
        ait,
        device_user_agent: deviceInfo.userAgent || null,
        device_ip: deviceInfo.ip || null,
        revoked: false,
        expires_at: refreshExp,
        last_activity_at: now,
      });

      return {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email },
      };
    } catch (err) {
      // console.error(
      //   "Login failed:",
      //   err.message,
      //   err.parent?.detail || err.original
      // );
      throw err; // ném lại để middleware error xử lý
    }
  }

  async handleFailedLogin(user) {
    const attempts = (user.login_attempts || 0) + 1;
    const update = { login_attempts: attempts };
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      update.account_locked_until = new Date(
        Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
      );
    }
    await this.userRepository.update({ id: user.id }, update);
  }

  async refreshToken(authContext, deviceInfo = {}) {
    const { userId, jti, ait, refreshToken } = authContext;
    const now = new Date();

    // 1) Verify RT signature/expiry/type
    const decoded = JWTServices.verifyRefreshToken(refreshToken);
    if (decoded.type && decoded.type !== "refresh") {
      throw new UnauthorizedError("Invalid token type");
    }
    if (decoded.sub !== userId || decoded.jti !== jti || decoded.ait !== ait) {
      throw new UnauthorizedError("Refresh token payload mismatch");
    }

    // 2) User check
    const user = await this.userRepository.findById(userId);
    if (!user || user.status !== "active") {
      throw new UnauthorizedError("User not active");
    }

    // 3) Session check (not revoked, not expired, ait match)
    const session = await this.userSessionRepository.getModel().findOne({
      where: {
        user_id: userId,
        jti,
        ait,
        revoked: false,
        expires_at: { [Op.gt]: now },
      },
    });
    if (!session) throw new UnauthorizedError("Session is no longer valid");

    // 4) Rotate tokens with same jti, new ait
    const newAit = Date.now();
    const { accessToken, refreshToken: newRefresh } =
      JWTServices.generateTokens(
        { id: user.id, email: user.email, role: user.role_id },
        { jti, ait: newAit }
      );

    const newRefreshExp =
      JWTServices.getTokenExpired(newRefresh) ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 5) Update session
    await this.userSessionRepository.update(
      { id: session.id },
      {
        ait: newAit,
        expires_at: newRefreshExp,
        device_user_agent: deviceInfo.userAgent || session.device_user_agent,
        device_ip: deviceInfo.ip || session.device_ip,
        last_activity_at: now,
      }
    );

    return {
      accessToken,
      refreshToken: newRefresh,
      user: { id: user.id, email: user.email },
    };
  }
  async logout(authContext, refreshToken) {
    const { userId, jti, ait } = authContext;
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    // 1) Verify refresh token signature/expiry/type
    const decodedRT = JWTServices.verifyRefreshToken(refreshToken);
    if (decodedRT.type && decodedRT.type !== "refresh") {
      throw new UnauthorizedError("Invalid token type");
    }

    // 2) AT & RT must belong to the same session/user
    if (decodedRT.sub !== userId || decodedRT.jti !== jti) {
      throw new UnauthorizedError(
        "Token mismatch - AT and RT belong to different sessions"
      );
    }

    // 3) Ensure session exists and is active
    const session = await this.userSessionRepository.getModel().findOne({
      where: {
        user_id: userId,
        jti,
        revoked: false,
        expires_at: { [Op.gt]: new Date() },
        ait: ait ?? { [Op.not]: null },
      },
    });
    if (!session) {
      throw new UnauthorizedError("Session is no longer valid");
    }

    // 4) Revoke session
    await this.userSessionRepository.revokeSessions([session.id], "logout");

    // (Optional) If you add a token blacklist table later, you can store accessToken/refreshToken expiry there.

    return { message: "Logout user success" };
  }

  async forgotPassword(email) {
    if (!email) throw new BadRequestError("Email is required");

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const user = await this.userRepository.findOne({
        email: normalizedEmail,
        is_email_verified: true,
      });

      const genericResponse = {
        message: "If the email exists, a password reset OTP has been sent.",
      };

      // Silent exits (enumeration-safe)
      if (
        !user ||
        ["deleted", "suspended", "inactive"].includes(user.status) ||
        (user.account_locked_until &&
          new Date(user.account_locked_until) > new Date())
      ) {
        return genericResponse;
      }

      // Generate OTP and hash
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Reset password-reset state
      await this.userRepository.update(
        { id: user.id },
        {
          password_reset_otp_hash: otpHash,
          password_reset_otp_expires: expiresAt,
          password_reset_attempts: 0,
          password_reset_last_attempt: null,
          is_otp_verified: false,
          password_reset_token: null,
        }
      );

      // Send OTP (don’t leak failures)
      try {
        await EmailServices.sendPasswordResetOTP(user.email, otp);
      } catch (err) {
        // swallow to avoid leaking existence
      }

      return genericResponse;
    } catch (err) {
      console.error("Forgot password error:", err);
      // Unexpected errors -> throw a typed error (pattern like your UnauthorizedError example)
      throw new InternalServerError(
        "Unable to process forgot password request"
      );
    }
  }

  async verifyOtp({ email, otp }) {
    if (!email || !otp) throw new BadRequestError("Email and OTP are required");

    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    // Prevent enumeration: if not found, behave like invalid OTP
    if (!user) throw new BadRequestError("Invalid OTP");

    const now = new Date();

    // Hard gates
    if (["suspended", "deleted", "inactive"].includes(user.status)) {
      throw new ForbiddenError("Account is not allowed");
    }
    if (user.account_locked_until && new Date(user.account_locked_until) > now) {
      throw new ErrorResponse("Account locked", 423, "ACCOUNT_LOCKED", true);
    }

    // OTP presence/expiry
    if (!user.password_reset_otp_hash) {
      throw new BadRequestError("Invalid OTP");
    }
    if (!user.password_reset_otp_expires || new Date(user.password_reset_otp_expires) < now) {
      throw new ErrorResponse("OTP expired", 410, "OTP_EXPIRED", true);
    }

    // Check OTP
    const inputHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    if (inputHash !== user.password_reset_otp_hash) {
      const attempts = (user.password_reset_attempts || 0) + 1;
      const update = {
        password_reset_attempts: attempts,
        password_reset_last_attempt: now,
      };
      if (attempts >= MAX_RESET_ATTEMPTS) {
        update.account_locked_until = new Date(
          now.getTime() + RESET_LOCK_MINUTES * 60 * 1000
        );
      }
      await this.userRepository.update({ id: user.id }, update);

      if (update.account_locked_until) {
        throw new ErrorResponse("Account locked due to too many attempts", 423, "ACCOUNT_LOCKED", true);
      }
      throw new BadRequestError("Invalid OTP");
    }

    // OTP is correct: issue reset token
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(rawResetToken).digest("hex");

    await this.userRepository.update(
      { id: user.id },
      {
        is_otp_verified: true,
        password_reset_token: hashedResetToken,
        password_reset_attempts: 0,
        password_reset_last_attempt: null,
      }
    );

    return { reset_token: rawResetToken };
  }

  async resetPassword({ resetToken, newPassword }) {
    if (!resetToken) throw new UnauthorizedError("Reset token is required");
    if (!newPassword) throw new BadRequestError("New password is required");

    // Hash incoming reset token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    const user = await this.userRepository.findOne({
      password_reset_token: hashedToken,
    });

    if (!user) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    const now = new Date();

    // Hard gates
    if (user.account_locked_until && new Date(user.account_locked_until) > now) {
      throw new UnauthorizedError("Account locked");
    }
    if (!user.is_otp_verified) {
      throw new ForbiddenError("OTP verification required");
    }
    if (["suspended", "deleted", "inactive"].includes(user.status)) {
      throw new ForbiddenError("Account is not allowed");
    }

    // Optional: reject if same as old password
    const sameAsOld = await BcryptServices.comparePassword(newPassword, user.hash_password);
    if (sameAsOld) {
      throw new BadRequestError("New password must differ from current password");
    }

    // Hash new password
    const newHash = await BcryptServices.hashPassword(newPassword);

    // Update password and clear reset state
    await this.userRepository.update(
      { id: user.id },
      {
        hash_password: newHash,
        password_changed_at: now,
        password_reset_otp_hash: null,
        password_reset_otp_expires: null,
        password_reset_token: null,
        password_reset_attempts: 0,
        password_reset_last_attempt: null,
        is_otp_verified: false,
        account_locked_until: null,
      }
    );

    // Revoke all sessions (recommended)
    await this.userSessionRepository.revokeAllSessionsForUser(user.id, "password_change");

    return { message: "Password has been reset successfully." };
  }

  async resendOtp(email) {
    if (!email) throw new BadRequestError("Email is required");

    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    const genericResponse = {
      message: "If the email exists, a new OTP has been sent.",
    };

    // Silent exits (enumeration-safe)
    if (
      !user ||
      ["deleted", "suspended", "inactive"].includes(user.status) ||
      (user.account_locked_until && new Date(user.account_locked_until) > new Date())
    ) {
      return genericResponse;
    }

    // Cooldown check
    if (
      user.password_reset_last_attempt &&
      new Date(user.password_reset_last_attempt).getTime() > Date.now() - RESEND_COOLDOWN_MS
    ) {
      return genericResponse;
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MS);

    // Reset OTP state (invalidate old OTP/reset token)
    await this.userRepository.update(
      { id: user.id },
      {
        password_reset_otp_hash: otpHash,
        password_reset_otp_expires: expiresAt,
        password_reset_attempts: 0,
        password_reset_last_attempt: new Date(),
        is_otp_verified: false,
        password_reset_token: null,
      }
    );

    // Send OTP (do not leak failures)
    try {
      await EmailServices.sendPasswordResetOTP(user.email, otp);
    } catch {
      // swallow to avoid leaking existence
    }

    return genericResponse;
  }
}
