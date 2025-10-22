import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class user extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: "user_email_key"
    },
    hash_password: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    phone_number: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verification_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    veri_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user_role',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'user',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "user_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "user_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
