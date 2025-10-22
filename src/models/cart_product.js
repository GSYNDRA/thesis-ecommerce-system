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
      }
    },
    variation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_variation',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'cart_product',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "cart_product_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
