import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class attribute_option extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    attribute_option_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attribute_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'attribute_type',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'attribute_option',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "attribute_option_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
