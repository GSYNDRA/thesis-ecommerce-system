import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class token_blacklist extends Model {
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
      }
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "token_blacklist_token_hash_key"
    },
    token_type: {
      type: DataTypes.ENUM("access"),
      allowNull: false,
      defaultValue: "access"
    },
    blacklisted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    reason: {
      type: DataTypes.ENUM("logout","password_change","suspicious_activity","admin_revoked"),
      allowNull: true,
      defaultValue: "logout"
    }
  }, {
    sequelize,
    tableName: 'token_blacklist',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "token_blacklist_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "token_blacklist_token_hash_key",
        unique: true,
        fields: [
          { name: "token_hash" },
        ]
      },
    ]
  });
  }
}
