import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class colour extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    colour_name: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'colour',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "colour_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
