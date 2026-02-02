import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class product_variation extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    qty_in_stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    product_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_item',
        key: 'id'
      }
    },
    size_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'size_option',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'product_variation',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "product_variation_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
