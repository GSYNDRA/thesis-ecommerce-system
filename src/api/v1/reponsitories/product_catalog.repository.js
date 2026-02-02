import DatabaseManager from "../database/dbName.postgre.js";
import initModels from "../models/init-models.js";
  import { Op } from 'sequelize';

export default class ProductCatalogRepository {
  constructor() {
    const sequelize = DatabaseManager.getConnection("ecommerce");
    this.models = initModels(sequelize);
  }

  async findVariantFullInfo(variationId) {
    const {
      product_variation: Variation,
      product_item: ProductItem,
      product: Product,
      colour: Colour,
      product_image: ProductImage,
      size_option: SizeOption,
    } = this.models;

    return Variation.findOne({
      where: { id: variationId },
      attributes: ["id", "qty_in_stock", "size_id", "product_item_id"],
      include: [
        {
          model: ProductItem,
          as: "product_item",
          attributes: [
            "id",
            "price",
            "product_code",
            "product_id",
            "colour_id",
          ],
          include: [
            {
              model: Product,
              as: "product",
              attributes: [
                "id",
                "product_name",
                "product_slug",
                "ratings_average",
                "ratings_count",
                "is_published",
              ],
            },
            {
              model: Colour,
              as: "colour",
              attributes: ["id", "colour_name"],
            },
            {
              model: ProductImage,
              as: "product_images",
              attributes: ["id", "image_filename"],
              separate: true,
              limit: 1,
              order: [["created_at", "ASC"]],
            },
          ],
        },
        {
          model: SizeOption,
          as: "size",
          attributes: ["id", "size_name", "sort_order"],
        },
      ],
    });
  }


async findVariantsFullInfoByIds(variationIds) {
  const {
    product_variation: Variation,
    product_item: ProductItem,
    product: Product,
    colour: Colour,
    product_image: ProductImage,
    size_option: SizeOption,
  } = this.models;

  return Variation.findAll({
    where: {
      id: {
        [Op.in]: variationIds,
      },
    },
    attributes: ["id", "qty_in_stock", "size_id", "product_item_id"],
    include: [
      {
        model: ProductItem,
        as: "product_item",
        attributes: [
          "id",
          "price",
          "product_code",
          "product_id",
          "colour_id",
        ],
        include: [
          {
            model: Product,
            as: "product",
            attributes: [
              "id",
              "product_name",
              "product_slug",
              "ratings_average",
              "ratings_count",
              "is_published",
            ],
          },
          {
            model: Colour,
            as: "colour",
            attributes: ["id", "colour_name"],
          },
          {
            model: ProductImage,
            as: "product_images",
            attributes: ["id", "image_filename"],
            separate: true,
            limit: 1,
            order: [["created_at", "ASC"]],
          },
        ],
      },
      {
        model: SizeOption,
        as: "size",
        attributes: ["id", "size_name", "sort_order"],
      },
    ],
  });
}

  async findPublishedVariationById(variationId) {
    const {
      product_variation: Variation,
      product_item: ProductItem,
      product: Product,
    } = this.models;
    return Variation.findOne({
      where: { id: variationId },
      attributes: ["id", "qty_in_stock"],
      include: [
        {
          model: ProductItem,
          as: "product_item",
          attributes: ["id", "price", "product_code"],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "is_published"],
            },
          ],
        },
      ],
    });
  }
}
