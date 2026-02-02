import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class size_category extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    size_cat_name: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'size_category',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "size_category_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
