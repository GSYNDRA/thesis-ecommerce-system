// src/api/v1/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { JWTServices } from "../services/jwt.service.js";
import { UnauthorizedError } from "../utils/response.util.js";
import UserRepository from "../reponsitories/user.reponsitory.js";
import UserSessionRepository from "../reponsitories/userSession.reponsitory.js";

export class AuthMiddleWare {
  constructor() {
    this.userRepository = new UserRepository();
    this.userSessionRepository = new UserSessionRepository();
  }

  validateAccessTokenSession = async (
    accessToken,
    { allowExpiredAccessToken = false, requireAitMatch = true } = {},
  ) => {
    if (!accessToken) {
      throw new UnauthorizedError("Authorization header missing");
    }

    let decoded;
    let tokenExpired = false;

    try {
      decoded = JWTServices.verifyAccessToken(accessToken);
    } catch (error) {
      const isExpiredError =
        error instanceof UnauthorizedError &&
        error.message === "Access token expired";

      if (!allowExpiredAccessToken || !isExpiredError) {
        throw error;
      }

      tokenExpired = true;
      try {
        decoded = jwt.verify(accessToken, JWTServices.ACCESS_SECRET, {
          algorithms: [JWTServices.ALGORITHM],
          ignoreExpiration: true,
        });
      } catch {
        throw new UnauthorizedError("Invalid access token");
      }
    }

    if (decoded.type && decoded.type !== "access") {
      throw new UnauthorizedError("Invalid token type");
    }

    const { sub: userId, jti, ait } = decoded;
    if (!userId || !jti) {
      throw new UnauthorizedError("Invalid token payload");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedError("User not found");
    if (user.status !== "active") {
      throw new UnauthorizedError("User account is not active");
    }

    const where = {
      user_id: userId,
      jti,
      revoked: false,
      expires_at: { [Op.gt]: new Date() },
    };

    if (requireAitMatch) {
      where.ait = ait ?? { [Op.not]: null };
    }

    const session = await this.userSessionRepository.getModel().findOne({ where });
    if (!session) {
      throw new UnauthorizedError("Session is no longer valid");
    }

    return {
      auth: {
        userId: user.id,
        email: user.email,
        role: user.role_id,
        jti,
        ait,
        accessToken,
      },
      accessToken,
      accessTokenExpired: tokenExpired,
      user,
      session,
    };
  };

  verifyAT = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization; // Bearer <token>
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Authorization header missing");
      }

      const accessToken = authHeader.split(" ")[1];
      const verification = await this.validateAccessTokenSession(accessToken, {
        allowExpiredAccessToken: true,
        requireAitMatch: false,
      });

      req.auth = {
        userId: verification.auth.userId,
        email: verification.auth.email,
        role: verification.auth.role,
        jti: verification.auth.jti,
        ait: verification.auth.ait,
      };
      req.accessToken = verification.accessToken;
      req.accessTokenExpired = verification.accessTokenExpired;
      next();
    } catch (error) {
      next(error);
    }
  };

  verifyAT1 = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization; // Bearer <accessToken>
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Authorization header missing");
      }

      const accessToken = authHeader.split(" ")[1];
      const verification = await this.validateAccessTokenSession(accessToken, {
        allowExpiredAccessToken: false,
        requireAitMatch: true,
      });

      req.auth = verification.auth;
      next();
    } catch (err) {
      next(err);
    }
  };
}
