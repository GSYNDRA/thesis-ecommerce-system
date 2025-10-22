import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class product_attribute extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    attribute_option_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'attribute_option',
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
    }
  }, {
    sequelize,
    tableName: 'product_attribute',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "product_attribute_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
