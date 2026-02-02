import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class category extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    category_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1
    },
    parent_cat_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'category',
        key: 'id'
      }
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
    tableName: 'category',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "category_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
