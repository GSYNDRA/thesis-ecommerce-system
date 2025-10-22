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
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
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
    timestamps: false,
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
