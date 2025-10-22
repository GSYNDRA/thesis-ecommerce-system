import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class refresh_token_used extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    old_refresh_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    key_token_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'key_token',
        key: 'id'
      }
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'refresh_token_used',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "refresh_token_used_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
