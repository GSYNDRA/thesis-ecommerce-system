import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class chat_sessions extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    session_uuid: {
      type: DataTypes.UUID,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    current_staff_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    mode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "ai"
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "active"
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'chat_sessions',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "chat_sessions_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "chat_sessions_session_uuid_key",
        unique: true,
        fields: [
          { name: "session_uuid" },
        ]
      },
      {
        name: "idx_chat_sessions_staff_status",
        fields: [
          { name: "current_staff_id" },
          { name: "status" },
        ]
      },
      {
        name: "idx_chat_sessions_updated",
        fields: [
          { name: "updated_at", order: "DESC" },
        ]
      },
      {
        name: "idx_chat_sessions_user_status",
        fields: [
          { name: "user_id" },
          { name: "status" },
        ]
      }
    ]
  });
  }
}
