import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class review extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    rating: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uploaded_image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product',
        key: 'id'
      }
    },
    order_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'order_product',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'review',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "review_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
