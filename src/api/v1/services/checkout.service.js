import {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  ErrorResponse,
  NotFoundError,
} from "../utils/response.util.js";
import UserRepository from "../reponsitories/user.reponsitory.js";
import UserSessionRepository from "../reponsitories/userSession.reponsitory.js";
export class CheckoutService {
  constructor() {
    this.userRepository = new UserRepository();
    this.userSessionRepository = new UserSessionRepository();
  }
  async previewCheckout(userId, payload) {
    
  }
}
