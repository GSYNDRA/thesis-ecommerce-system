import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class product extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    product_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    product_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    product_material: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    care_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'category',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1
    },
    is_draft: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    product_slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: "product_product_slug_key"
    },
    ratings_average: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
    },
    ratings_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'product',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_product_ratings",
        fields: [
          { name: "ratings_average", order: "DESC" },
        ]
      },
      {
        name: "idx_product_slug",
        fields: [
          { name: "product_slug" },
        ]
      },
      {
        name: "idx_product_status",
        fields: [
          { name: "is_published" },
          { name: "is_draft" },
        ]
      },
      {
        name: "product_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "product_product_slug_key",
        unique: true,
        fields: [
          { name: "product_slug" },
        ]
      },
    ]
  });
  }
}
