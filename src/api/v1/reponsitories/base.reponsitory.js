import { DataTypes } from "sequelize";
import DatabaseManager from "../database/dbName.postgre.js";
import initModels from "../models/init-models.js";

export default class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Get Sequelize connection
   */
  get sequelize() {
    return DatabaseManager.getConnection("ecommerce");
  }

  /**
   * Attach model to the correct connection
   */
  getModel() {
    if (!this.model.sequelize) {
      this.model.init(this.sequelize, DataTypes);
    }
    return this.model;
  }

  /* ---------- Common helpers ---------- */

  async create(data, options = {}) {
    return this.getModel().create(data, options);
  }

  async findById(id) {
    return this.getModel().findByPk(id);
  }

  async findOne(where) {
    return this.getModel().findOne({ where });
  }

  async update(where, data) {
    return this.getModel().update(data, { where })
  }

  async delete(where) {
    return this.getModel().destroy({ where });
  }
}
