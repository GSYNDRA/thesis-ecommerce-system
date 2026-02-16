import { Op } from "sequelize";
import BaseRepository from "./base.reponsitory.js";
import DiscountModel from "../models/discount.js";

export default class DiscountRepository extends BaseRepository {
  constructor() {
    super(DiscountModel);
  }

  async findActiveDiscountsByTypes(discountTypes, _orderAmount, now = new Date()) {
    return this.getModel().findAll({
      where: {
        active: true,
        discount_type: { [Op.in]: discountTypes },
        discount_start: { [Op.lte]: now },
        discount_end: { [Op.gte]: now },
      },
      order: [
        ["discount_end", "ASC"],
        ["id", "ASC"],
      ],
    });
  }

  async findActiveDiscountByCode(discountCode, now = new Date()) {
    return this.findOne({
      discount_code: discountCode,
      active: true,
      discount_start: { [Op.lte]: now },
      discount_end: { [Op.gte]: now },
    });
  }

  async findByIds(discountIds, options = {}) {
    if (!Array.isArray(discountIds) || discountIds.length === 0) return [];
    return this.getModel().findAll({
      where: { id: { [Op.in]: discountIds } },
      ...options,
    });
  }
}
