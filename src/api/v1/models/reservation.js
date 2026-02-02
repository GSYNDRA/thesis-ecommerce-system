import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class reservation extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    reserved_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "pending"
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('(now() + 24:00:00')
    },
    reservation_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 24
    },
    variation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_variation',
        key: 'id'
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'reservation',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "reservation_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
