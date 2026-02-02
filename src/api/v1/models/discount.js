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
      allowNull: false
    },
    discount_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discount_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "fixed_amount"
    },
    discount_value: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    discount_code: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: "discount_discount_code_key"
    },
    discount_start: {
      type: DataTypes.DATE,
      allowNull: false
    },
    discount_end: {
      type: DataTypes.DATE,
      allowNull: false
    },
    discount_max_uses: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    discount_users_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    discount_max_uses_per_user: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    discount_min_order_value: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
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
        name: "discount_discount_code_key",
        unique: true,
        fields: [
          { name: "discount_code" },
        ]
      },
      {
        name: "discount_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "idx_discount_active",
        fields: [
          { name: "active" },
        ]
      },
      {
        name: "idx_discount_code",
        fields: [
          { name: "discount_code" },
        ]
      },
      {
        name: "idx_discount_dates",
        fields: [
          { name: "discount_start" },
          { name: "discount_end" },
        ]
      },
    ]
  });
  }
}
