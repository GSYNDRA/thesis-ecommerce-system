import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class user_role extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    role_name: {
      type: DataTypes.ENUM("customer","seller","deliverer","admin"),
      allowNull: false,
      unique: "user_role_role_name_key"
    }
  }, {
    sequelize,
    tableName: 'user_role',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "user_role_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "user_role_role_name_key",
        unique: true,
        fields: [
          { name: "role_name" },
        ]
      },
    ]
  });
  }
}
