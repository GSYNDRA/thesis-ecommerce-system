import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class cart extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'cart',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "cart_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
