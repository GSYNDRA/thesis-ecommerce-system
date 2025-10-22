import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class discount extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    discount_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discount_value: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    discount_code: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discount_start: {
      type: DataTypes.DATE,
      allowNull: true
    },
    discount_end: {
      type: DataTypes.DATE,
      allowNull: true
    },
    discount_max_uses: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    discount_users_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    discount_max_uses_per_user: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    discount_min_order_val: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'discount',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "discount_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
