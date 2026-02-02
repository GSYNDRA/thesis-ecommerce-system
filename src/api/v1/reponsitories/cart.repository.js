import BaseRepository from './base.reponsitory.js'
import CartModel from '../models/cart.js'

export default class CartRepository extends BaseRepository {
  constructor() {
    super(CartModel)
  }

  /* ---------- Cart ---------- */

  async findActiveCartByUserId(userId) {
    return this.findOne({
      user_id: userId,
      status: 1,
    })
  }

  async createCart(userId) {
    return this.create({
      user_id: userId,
    })
  }
}
