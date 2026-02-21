import { Op } from "sequelize";
import BaseRepository from "./base.reponsitory.js";
import OrderModel from "../models/orders.js";

export default class OrderRepository extends BaseRepository {
  constructor() {
    super(OrderModel);
  }

  async findOpenOrderByCartId(cartId) {
    return this.getModel().findOne({
      where: {
        cart_id: cartId,
        order_status: {
          [Op.in]: ["pending", "confirmed"],
        },
        payment_status: "pending",
      },
      order: [["id", "DESC"]],
    });
  }

  async findByOrderNumber(orderNumber, options = {}) {
    return this.getModel().findOne({
      where: { order_number: orderNumber },
      ...options,
    });
  }
}
