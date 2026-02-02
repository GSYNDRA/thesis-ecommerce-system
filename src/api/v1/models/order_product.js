import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class order_product extends Model {
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
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product',
        key: 'id'
      }
    },
    product_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_item',
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
    tableName: 'order_product',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "order_product_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
