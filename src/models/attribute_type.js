import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class attribute_type extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    attribute_type_name: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'attribute_type',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "attribute_type_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
