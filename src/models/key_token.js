import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class key_token extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    public_key: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    encrypted_private_key: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'key_token',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "key_token_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
