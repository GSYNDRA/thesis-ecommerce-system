import BaseRepository from "./base.reponsitory.js";
import CartProductModel from "../models/cart_product.js";

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

  async findByIdAndCart(cartProductId, cartId) {
    return this.findOne({
      id: cartProductId,
      cart_id: cartId,
    });
  }

  async updateQuantity(cartProductId, quantity) {
    return this.update({ id: cartProductId }, { quantity });
  }

  async removeById(cartProductId) {
    return this.delete({ id: cartProductId });
  }

  async findByCartId(cartId) {
    return this.model.findAll({
      where: { cart_id: cartId },
      attributes: ["id", "cart_id", "variation_id", "quantity", "price"],
    });
  }
}
