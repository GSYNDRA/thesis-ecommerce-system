import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class size_option extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    size_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    size_cat_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'size_category',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'size_option',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "size_option_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
