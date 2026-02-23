import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class chat_messages extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat_sessions',
        key: 'id'
      }
    },
    sender_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    message_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "text"
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'chat_messages',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "chat_messages_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "idx_chat_messages_created",
        fields: [
          { name: "created_at", order: "DESC" },
        ]
      },
      {
        name: "idx_chat_messages_session_created",
        fields: [
          { name: "session_id" },
          { name: "created_at" },
        ]
      },
    ]
  });
  }
}

