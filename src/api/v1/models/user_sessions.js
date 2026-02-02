import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class user_sessions extends Model {
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
    jti: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "user_sessions_jti_key"
    },
    ait: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    device_user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    device_ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    device_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    device_location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    device_fingerprint: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    suspicious_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    revoked_reason: {
      type: DataTypes.ENUM("logout","suspicious","password_change","admin_action"),
      allowNull: true
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_activity_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'user_sessions',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "user_sessions_jti_key",
        unique: true,
        fields: [
          { name: "jti" },
        ]
      },
      {
        name: "user_sessions_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
