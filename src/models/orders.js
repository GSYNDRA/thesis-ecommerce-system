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
    net_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
    },
    payment_method: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    payment_status: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shipping_status: {
      type: DataTypes.TEXT,
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
