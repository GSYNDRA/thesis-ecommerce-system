import BaseRepository from "./base.reponsitory.js";
import CartProductModel from "../models/cart_product.js";
import { where } from "sequelize";

export default class CartProductRepository extends BaseRepository {
  constructor() {
    super(CartProductModel);
  }

  /* ---------- Cart Product ---------- */

  async findByCartAndVariation(cartId, variationId) {
    return this.findOne({
      cart_id: cartId,
      variation_id: variationId,
    });
  }

  async createCartProduct(data) {
    return this.create(data);
  }

  async updateQuantity(cartProductId, quantity) {
    return this.update({ id: cartProductId }, { quantity });
  }
  async findByCartId(cartId) {
    return this.model.findAll({
      where: { cart_id: cartId },
      attributes: ["variation_id", "quantity", "price"],
    });
  }
}
