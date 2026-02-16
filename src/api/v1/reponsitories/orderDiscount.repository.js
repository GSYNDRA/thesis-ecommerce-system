import { Op } from "sequelize";
import BaseRepository from "./base.reponsitory.js";
import OrderDiscountModel from "../models/order_discount.js";

export default class OrderDiscountRepository extends BaseRepository {
  constructor() {
    super(OrderDiscountModel);
  }

  async hasUserUsedDiscount(userId, discountId, options = {}) {
    const used = await this.getModel().findOne({
      where: {
        customer_id: userId,
        discount_id: discountId,
      },
      attributes: ["id"],
      raw: true,
      ...options,
    });
    return Boolean(used);
  }

  async getUsedDiscountIdsByUser(userId, discountIds = [], options = {}) {
    if (!userId) return new Set();

    const where = { customer_id: userId };
    if (Array.isArray(discountIds) && discountIds.length > 0) {
      where.discount_id = { [Op.in]: discountIds };
    }

    const rows = await this.getModel().findAll({
      where,
      attributes: ["discount_id"],
      raw: true,
      ...options,
    });

    return new Set(rows.map((row) => Number(row.discount_id)));
  }

  async findByOrderId(orderId, options = {}) {
    return this.getModel().findAll({
      where: { order_id: orderId },
      ...options,
    });
  }

  async findByOrderAndDiscount(orderId, discountId, options = {}) {
    return this.getModel().findOne({
      where: {
        order_id: orderId,
        discount_id: discountId,
      },
      ...options,
    });
  }
}
