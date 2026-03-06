import DatabaseManager from "../database/dbName.postgre.js";
import initModels from "../models/init-models.js";
import { Op } from "sequelize";

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

  async findPublishedProductsCatalog() {
    const {
      product: Product,
      category: Category,
      product_item: ProductItem,
      colour: Colour,
      product_image: ProductImage,
      product_variation: Variation,
      size_option: SizeOption,
    } = this.models;

    return Product.findAll({
      where: {
        is_published: true,
        is_draft: false,
      },
      attributes: [
        "id",
        "product_name",
        "product_slug",
        "product_description",
        "product_material",
        "care_instructions",
        "about",
        "category_id",
        "ratings_average",
        "ratings_count",
        "created_at",
      ],
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "category_name", "size_cat_id"],
          required: false,
        },
        {
          model: ProductItem,
          as: "product_items",
          attributes: ["id", "price", "product_code", "product_id", "colour_id", "created_at"],
          required: true,
          include: [
            {
              model: Colour,
              as: "colour",
              attributes: ["id", "colour_name"],
              required: false,
            },
            {
              model: ProductImage,
              as: "product_images",
              attributes: ["id", "image_filename", "created_at"],
              required: false,
            },
            {
              model: Variation,
              as: "product_variations",
              attributes: ["id", "qty_in_stock", "product_item_id", "size_id"],
              required: false,
              include: [
                {
                  model: SizeOption,
                  as: "size",
                  attributes: ["id", "size_name", "sort_order", "size_cat_id"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [
        ["created_at", "DESC"],
        [{ model: ProductItem, as: "product_items" }, "id", "ASC"],
        [
          { model: ProductItem, as: "product_items" },
          { model: ProductImage, as: "product_images" },
          "created_at",
          "ASC",
        ],
        [
          { model: ProductItem, as: "product_items" },
          { model: Variation, as: "product_variations" },
          "id",
          "ASC",
        ],
      ],
    });
  }

  async findPublishedProductBySlug(slug) {
    const {
      product: Product,
      category: Category,
      product_item: ProductItem,
      colour: Colour,
      product_image: ProductImage,
      product_variation: Variation,
      size_option: SizeOption,
    } = this.models;

    return Product.findOne({
      where: {
        product_slug: slug,
        is_published: true,
        is_draft: false,
      },
      attributes: [
        "id",
        "product_name",
        "product_slug",
        "product_description",
        "product_material",
        "care_instructions",
        "about",
        "category_id",
        "ratings_average",
        "ratings_count",
        "created_at",
      ],
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "category_name", "size_cat_id"],
          required: false,
        },
        {
          model: ProductItem,
          as: "product_items",
          attributes: ["id", "price", "product_code", "product_id", "colour_id", "created_at"],
          required: true,
          include: [
            {
              model: Colour,
              as: "colour",
              attributes: ["id", "colour_name"],
              required: false,
            },
            {
              model: ProductImage,
              as: "product_images",
              attributes: ["id", "image_filename", "created_at"],
              required: false,
            },
            {
              model: Variation,
              as: "product_variations",
              attributes: ["id", "qty_in_stock", "product_item_id", "size_id"],
              required: false,
              include: [
                {
                  model: SizeOption,
                  as: "size",
                  attributes: ["id", "size_name", "sort_order", "size_cat_id"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [
        [{ model: ProductItem, as: "product_items" }, "id", "ASC"],
        [
          { model: ProductItem, as: "product_items" },
          { model: ProductImage, as: "product_images" },
          "created_at",
          "ASC",
        ],
        [
          { model: ProductItem, as: "product_items" },
          { model: Variation, as: "product_variations" },
          "id",
          "ASC",
        ],
      ],
    });
  }
}
