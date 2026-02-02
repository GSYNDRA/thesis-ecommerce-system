import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class product_item extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    product_code: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product',
        key: 'id'
      }
    },
    colour_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'colour',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'product_item',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "product_item_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
