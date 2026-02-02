import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class orders extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    order_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "orders_order_number_key"
    },
    total_price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    total_discount_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
    },
    actual_shipping_fee: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
    },
    tax_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
    },
    net_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
    },
    order_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "pending"
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tracking_carrier: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    payment_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "pending"
    },
    payment_transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    payment_provider: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'orders',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "orders_order_number_key",
        unique: true,
        fields: [
          { name: "order_number" },
        ]
      },
      {
        name: "orders_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
