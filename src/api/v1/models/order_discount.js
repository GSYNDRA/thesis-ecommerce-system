import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class order_discount extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    discount_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    applied_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    discount_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'discount',
        key: 'id'
      },
      unique: "order_discount_discount_id_customer_id_key"
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      },
      unique: "order_discount_discount_id_customer_id_key"
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'order_discount',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "idx_order_discount_customer",
        fields: [
          { name: "customer_id" },
        ]
      },
      {
        name: "idx_order_discount_discount",
        fields: [
          { name: "discount_id" },
        ]
      },
      {
        name: "order_discount_discount_id_customer_id_key",
        unique: true,
        fields: [
          { name: "discount_id" },
          { name: "customer_id" },
        ]
      },
      {
        name: "order_discount_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
