import BaseRepository from "./base.reponsitory.js";
import OrderProductModel from "../models/order_product.js";

export default class OrderProductRepository extends BaseRepository {
  constructor() {
    super(OrderProductModel);
  }

  async findByOrderId(orderId, options = {}) {
    return this.getModel().findAll({
      where: { order_id: orderId },
      ...options,
    });
  }

  async bulkCreate(rows, options = {}) {
    return this.getModel().bulkCreate(rows, options);
  }
}

