import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class chat_transfer_requests extends Model {
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
    from_staff_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    to_staff_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending"
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'chat_transfer_requests',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "chat_transfer_requests_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "idx_chat_transfer_session_created",
        fields: [
          { name: "session_id" },
          { name: "created_at", order: "DESC" },
        ]
      },
      {
        name: "idx_chat_transfer_status",
        fields: [
          { name: "status" },
          { name: "created_at", order: "DESC" },
        ]
      }
    ]
  });
  }
}
