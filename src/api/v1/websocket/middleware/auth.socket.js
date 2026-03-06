import { AuthMiddleWare } from "../../middlewares/auth.middleware.js";
import { USER_ROLE } from "../../constants/common.constant.js";

const authMiddleWare = new AuthMiddleWare();

function extractAccessToken(socket) {
  const authToken = socket.handshake?.auth?.token;
  const headerToken = socket.handshake?.headers?.authorization;
  const queryToken = socket.handshake?.query?.token;

  const rawToken = authToken || headerToken || queryToken;
  if (!rawToken) return null;

  const token = String(rawToken).trim();
  if (!token) return null;

  if (token.startsWith("Bearer ")) {
    return token.slice("Bearer ".length).trim();
  }

  return token;
}

export async function authenticateSocket(socket, next) {
  try {
    const accessToken = extractAccessToken(socket);
    if (!accessToken) {
      throw new Error("Authorization token missing");
    }

    const verification = await authMiddleWare.validateAccessTokenSession(
      accessToken,
      {
        requireAitMatch: true,
      },
    );

    socket.auth = verification.auth;
    socket.user = {
      id: verification.auth.userId,
      email: verification.auth.email,
      roleId: verification.auth.role,
      jti: verification.auth.jti,
      ait: verification.auth.ait,
      isStaff: Number(verification.auth.role) !== USER_ROLE.CUSTOMER,
    };

    next();
  } catch (error) {
    const authError = new Error(error?.message || "Unauthorized");
    authError.data = { code: "UNAUTHORIZED" };
    next(authError);
  }
}

