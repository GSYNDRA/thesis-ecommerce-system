import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class cart_product extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    cart_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cart',
        key: 'id'
      },
      unique: "cart_product_cart_id_variation_id_key"
    },
    variation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_variation',
        key: 'id'
      },
      unique: "cart_product_cart_id_variation_id_key"
    }
  }, {
    sequelize,
    tableName: 'cart_product',
    schema: 'public',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: "cart_product_cart_id_variation_id_key",
        unique: true,
        fields: [
          { name: "cart_id" },
          { name: "variation_id" },
        ]
      },
      {
        name: "cart_product_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "idx_cart_product_cart",
        fields: [
          { name: "cart_id" },
        ]
      },
      {
        name: "idx_cart_product_variation",
        fields: [
          { name: "variation_id" },
        ]
      },
    ]
  });
  }
}
