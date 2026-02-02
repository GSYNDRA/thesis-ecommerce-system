import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class key_value_store extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    key_name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: "key_value_store_key_name_key"
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1
    },
    permission: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'key_value_store',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "key_value_store_key_name_key",
        unique: true,
        fields: [
          { name: "key_name" },
        ]
      },
      {
        name: "key_value_store_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
