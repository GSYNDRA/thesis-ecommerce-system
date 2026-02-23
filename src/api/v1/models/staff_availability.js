import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class staff_availability extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    current_chats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_heartbeat: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'staff_availability',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_staff_availability_heartbeat",
        fields: [
          { name: "last_heartbeat" },
        ]
      },
      {
        name: "idx_staff_availability_online",
        fields: [
          { name: "is_online" },
          { name: "is_available" },
          { name: "current_chats" },
        ]
      },
      {
        name: "staff_availability_pkey",
        unique: true,
        fields: [
          { name: "staff_id" },
        ]
      },
    ]
  });
  }
}
