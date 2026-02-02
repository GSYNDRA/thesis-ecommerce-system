import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class cart extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    cart_count_products: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    cart_total_items: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    cart_subtotal: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0.00
    }
  }, {
    sequelize,
    tableName: 'cart',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "cart_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "idx_cart_status",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_cart_updated",
        fields: [
          { name: "updated_at", order: "DESC" },
        ]
      },
      {
        name: "idx_cart_user",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
  }
}
