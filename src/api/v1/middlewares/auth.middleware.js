// src/api/v1/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import { JWTServices } from "../services/jwt.service.js";
import { UnauthorizedError } from "../utils/response.util.js";
import UserRepository from "../reponsitories/user.reponsitory.js";
import UserSessionRepository from "../reponsitories/userSession.reponsitory.js";
import { Op } from "sequelize";

export class AuthMiddleWare {
  constructor() {
    this.userRepository = new UserRepository();
    this.userSessionRepository = new UserSessionRepository();
  }

  verifyAT = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization; // Bearer <token>
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Authorization header missing");
      }

      const accessToken = authHeader.split(" ")[1];
      let decoded;
      let tokenExpired = false;

      try {
        decoded = JWTServices.verifyAccessToken(accessToken);
      } catch (error) {
        const isExpiredError =
          error instanceof UnauthorizedError &&
          error.message === "Access token expired";

        if (!isExpiredError) {
          throw error;
        }

        tokenExpired = true;
        try {
          decoded = jwt.verify(accessToken, JWTServices.ACCESS_SECRET, {
            algorithms: [JWTServices.ALGORITHM],
            ignoreExpiration: true, // allow expired AT for refresh/logout paths
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

      // user check
      const user = await this.userRepository.findById(userId);
      if (!user) throw new UnauthorizedError("User not found");
      if (user.status !== "active") {
        throw new UnauthorizedError("User account is not active");
      }

      // session check: active, not revoked, not expired
      const session = await this.userSessionRepository.getModel().findOne({
        where: {
          user_id: userId,
          jti,
          revoked: false,
          expires_at: {[Op.gt]: new Date() }, // if you use Sequelize Op.gt import Op and use { [Op.gt]: new Date() }
        },
      });
      if (!session) {
        throw new UnauthorizedError("Session is no longer valid");
      }

      // attach to request for controller
      req.auth = {
        userId: user.id,
        email: user.email,
        role: user.role_id,
        jti,
        ait,
      };
      req.accessToken = accessToken;
      req.accessTokenExpired = tokenExpired;
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

      const decoded = JWTServices.verifyAccessToken(accessToken);
      if (decoded.type && decoded.type !== "access") {
        throw new UnauthorizedError("Invalid token type");
      }

      const { sub: userId, jti, ait } = decoded;
      if (!userId || !jti) {
        throw new UnauthorizedError("Invalid token payload");
      }

      // user check
      const user = await this.userRepository.findById(userId);
      if (!user) throw new UnauthorizedError("User not found");
      if (user.status !== "active") throw new UnauthorizedError("User account is not active");

      // session check
      const session = await this.userSessionRepository.getModel().findOne({
        where: {
          user_id: userId,
          jti,
          revoked: false,
          expires_at: { [Op.gt]: new Date() },
          ait: ait ?? { [Op.not]: null },
        },
      });
      if (!session) throw new UnauthorizedError("Session is no longer valid");

      // attach for controller/service
      req.auth = { userId: user.id, email: user.email, role: user.role_id, jti, ait, accessToken };
      next();
    } catch (err) {
      next(err);
    }
  };

}
