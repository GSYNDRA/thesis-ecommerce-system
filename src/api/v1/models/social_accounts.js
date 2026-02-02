import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class social_accounts extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      },
      unique: "social_accounts_user_id_key"
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    facebook_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'social_accounts',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "social_accounts_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "social_accounts_user_id_key",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
  }
}
