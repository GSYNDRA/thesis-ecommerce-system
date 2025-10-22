import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class product_image extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    image_filename: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    product_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_item',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'product_image',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "product_image_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
