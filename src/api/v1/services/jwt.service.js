import jwt from "jsonwebtoken";
import envConfig from "../configs/config.sequelize.js";
import { UnauthorizedError, BadRequestError } from "../utils/response.util.js";

/**
 * @typedef {Object} JWTPayload
 * @property {number|string} sub
 * @property {string} [email]
 * @property {string|number} [role]
 * @property {string} [jti]
 * @property {number} [ait] // auth issued at (ms)
 * @property {"access"|"refresh"|string} [type]
 * @property {number} [exp]
 */
export class JWTServices {
  static ACCESS_EXPIRES_IN = envConfig.jwt.accessTokenExpiresIn;
  static REFRESH_EXPIRES_IN = envConfig.jwt.refreshTokenExpiresIn;
  static ACCESS_SECRET = envConfig.jwt.accessTokenSecret;
  static REFRESH_SECRET = envConfig.jwt.refreshTokenSecret;
  static ALGORITHM = envConfig.jwt.algorithm;

  // generate AccessToken
  static generateAccessToken(payload) {
    return jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: this.ACCESS_EXPIRES_IN,
      algorithm: this.ALGORITHM,
    });
  }

  // generate RefreshToken
  static generateRefreshToken(payload) {
    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRES_IN,
      algorithm: this.ALGORITHM,
    });
  }

  // verify Access Token
  static verifyAccessToken(accessToken) {
    try {
      return jwt.verify(accessToken, this.ACCESS_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedError("Access token expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new UnauthorizedError("Invalid access token");
      } else if (error.name === "NotBeforeError") {
        throw new UnauthorizedError("Access token not active yet");
      }
      throw new UnauthorizedError("Access token verification failed");
    }
  }

  // verify Refresh Token
  static verifyRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.REFRESH_SECRET);
      if (!decoded?.sub) {
        throw new UnauthorizedError("Invalid token payload");
      }
      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedError("Refresh token expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new UnauthorizedError("Invalid refresh token");
      } else if (error.name === "NotBeforeError") {
        throw new UnauthorizedError("Refresh token not active yet");
      }
      throw new UnauthorizedError("Refresh token verification failed");
    }
  }

  // decode Token (no signature check)
  static decodedToken(token) {
    try {
      const decoded = jwt.decode(token);
      return typeof decoded === "object" ? decoded : undefined;
    } catch {
      throw new BadRequestError("Invalid token");
    }
  }

  // Get token expiry as Date
  static getTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && typeof decoded === "object" && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }

  // Check Token is expired
  static isTokenExpired(token) {
    const expiredAt = this.getTokenExpired(token);
    if (!expiredAt) return true;
    return expiredAt < new Date();
  }

  // validate JWT format => header.payload.signature
  static validateJWTFormat(token) {
    const parts = token.split(".");
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  // generate AT & RT
  static generateTokens(user, { jti, ait, extra = {} } = {}) {
    const userId = user.id ?? user.sub ?? user._id;
    const accessToken = this.generateAccessToken({
      sub: userId,
      email: user.email,
      role: user.role,
      jti,
      ait,
      type: "access",
      ...extra,
    });

    const refreshToken = this.generateRefreshToken({
      sub: userId,
      jti,
      ait,
      type: "refresh",
    });

    return { accessToken, refreshToken };
  }
}
