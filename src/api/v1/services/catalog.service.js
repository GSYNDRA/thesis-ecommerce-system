import ProductCatalogRepository from "../reponsitories/product_catalog.repository.js";
import { NotFoundError } from "../utils/response.util.js";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseIdList(value) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(
    values
      .map((item) => Number.parseInt(String(item).trim(), 10))
      .filter((item) => Number.isFinite(item) && item > 0),
  )];
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes"].includes(normalized)) return true;
  if (["0", "false", "no"].includes(normalized)) return false;
  return null;
}

function compareBySortOrderThenName(a, b) {
  const sortA = Number.isFinite(a.sortOrder) ? a.sortOrder : Number.MAX_SAFE_INTEGER;
  const sortB = Number.isFinite(b.sortOrder) ? b.sortOrder : Number.MAX_SAFE_INTEGER;
  if (sortA !== sortB) return sortA - sortB;
  return String(a.name || "").localeCompare(String(b.name || ""));
}

export class CatalogService {
  constructor() {
    this.productCatalogRepository = new ProductCatalogRepository();
  }

  buildProductPayload(productRecord) {
    const productItemMap = new Map();
    for (const itemRecord of productRecord.product_items || []) {
      if (!itemRecord?.id || productItemMap.has(itemRecord.id)) continue;
      productItemMap.set(itemRecord.id, itemRecord);
    }

    const items = [...productItemMap.values()].map((itemRecord) => {
      const variationMap = new Map();
      for (const variation of itemRecord.product_variations || []) {
        if (!variation?.id || variationMap.has(variation.id)) continue;
        variationMap.set(variation.id, variation);
      }

      const sizeRows = [...variationMap.values()].map((variation) => {
        const qtyInStock = toNumber(variation.qty_in_stock, 0);
        return {
          variationId: variation.id,
          sizeId: variation.size_id,
          sizeName: variation.size?.size_name || null,
          sortOrder: toNumber(variation.size?.sort_order, Number.MAX_SAFE_INTEGER),
          qtyInStock,
          isAvailable: qtyInStock > 0,
        };
      });

      const sizes = sizeRows.sort(compareBySortOrderThenName);
      const itemStock = sizes.reduce((sum, size) => sum + size.qtyInStock, 0);
      const imageMap = new Map();
      for (const image of itemRecord.product_images || []) {
        if (!image?.id || imageMap.has(image.id)) continue;
        imageMap.set(image.id, image);
      }

      const sortedImages = [...imageMap.values()].sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeA - timeB;
      });

      return {
        productItemId: itemRecord.id,
        productCode: itemRecord.product_code || null,
        colour: itemRecord.colour
          ? {
              id: itemRecord.colour.id,
              name: itemRecord.colour.colour_name,
            }
          : null,
        price: toNumber(itemRecord.price, 0),
        images: sortedImages.map((img) => ({
          id: img.id,
          imageUrl: img.image_filename,
        })),
        sizes,
        hasStock: itemStock > 0,
        totalStock: itemStock,
      };
    });

    const prices = items.map((item) => item.price).filter((value) => Number.isFinite(value));
    const hasStock = items.some((item) => item.hasStock);
    const totalStock = items.reduce((sum, item) => sum + item.totalStock, 0);
    const sortedItems = [...items].sort((a, b) => a.productItemId - b.productItemId);
    const defaultItem = sortedItems.find((item) => item.hasStock) || sortedItems[0] || null;
    const defaultSize =
      defaultItem?.sizes.find((size) => size.isAvailable) || defaultItem?.sizes[0] || null;

    return {
      id: productRecord.id,
      name: productRecord.product_name,
      slug: productRecord.product_slug,
      description: productRecord.product_description,
      material: productRecord.product_material,
      careInstructions: productRecord.care_instructions,
      about: productRecord.about,
      ratingsAverage: toNumber(productRecord.ratings_average, 0),
      ratingsCount: toNumber(productRecord.ratings_count, 0),
      createdAt: productRecord.created_at,
      category: productRecord.category
        ? {
            id: productRecord.category.id,
            name: productRecord.category.category_name,
            sizeCategoryId: productRecord.category.size_cat_id,
          }
        : null,
      priceRange: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
      hasStock,
      totalStock,
      items: sortedItems,
      defaultSelection: {
        productItemId: defaultItem?.productItemId || null,
        colourId: defaultItem?.colour?.id || null,
        variationId: defaultSize?.variationId || null,
        sizeId: defaultSize?.sizeId || null,
      },
    };
  }

  applyFilters(products, query = {}) {
    const q = String(query.q || "").trim().toLowerCase();
    const categoryIds = parseIdList(query.categoryIds || query.categoryId);
    const colourIds = parseIdList(query.colourIds || query.colourId || query.colorIds);
    const sizeIds = parseIdList(query.sizeIds || query.sizeId);

    const minPrice = query.minPrice !== undefined ? toNumber(query.minPrice, NaN) : null;
    const maxPrice = query.maxPrice !== undefined ? toNumber(query.maxPrice, NaN) : null;
    const inStock = parseBoolean(query.inStock);

    return products.filter((product) => {
      if (!product.slug) return false;

      if (q) {
        const haystack = `${product.name || ""} ${product.slug || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (categoryIds.length > 0) {
        const productCategoryId = product.category?.id;
        if (!productCategoryId || !categoryIds.includes(productCategoryId)) return false;
      }

      if (colourIds.length > 0) {
        const hasAnyColour = product.items.some((item) =>
          item.colour?.id ? colourIds.includes(item.colour.id) : false,
        );
        if (!hasAnyColour) return false;
      }

      if (sizeIds.length > 0) {
        const hasAnySize = product.items.some((item) =>
          item.sizes.some((size) => size.sizeId && sizeIds.includes(size.sizeId)),
        );
        if (!hasAnySize) return false;
      }

      if (Number.isFinite(minPrice)) {
        if (product.priceRange.max < minPrice) return false;
      }

      if (Number.isFinite(maxPrice)) {
        if (product.priceRange.min > maxPrice) return false;
      }

      if (inStock === true && !product.hasStock) return false;
      if (inStock === false && product.hasStock) return false;

      return true;
    });
  }

  sortProducts(products, sortValue) {
    const sort = String(sortValue || "newest").trim().toLowerCase();
    const items = [...products];

    switch (sort) {
      case "price_asc":
        items.sort((a, b) => a.priceRange.min - b.priceRange.min || a.id - b.id);
        break;
      case "price_desc":
        items.sort((a, b) => b.priceRange.max - a.priceRange.max || a.id - b.id);
        break;
      case "rating_desc":
        items.sort((a, b) => b.ratingsAverage - a.ratingsAverage || a.id - b.id);
        break;
      case "name_asc":
        items.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        break;
      case "newest":
      default:
        items.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA || b.id - a.id;
        });
        break;
    }

    return items;
  }

  summarizeProductForList(product) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      ratingsAverage: product.ratingsAverage,
      ratingsCount: product.ratingsCount,
      category: product.category,
      priceRange: product.priceRange,
      hasStock: product.hasStock,
      totalStock: product.totalStock,
      defaultItem: (() => {
        const item = product.items.find((entry) => entry.productItemId === product.defaultSelection.productItemId);
        if (!item) return null;
        return {
          productItemId: item.productItemId,
          price: item.price,
          colour: item.colour,
          imageUrl: item.images[0]?.imageUrl || null,
        };
      })(),
      colours: product.items.map((item) => ({
        productItemId: item.productItemId,
        colour: item.colour,
        imageUrl: item.images[0]?.imageUrl || null,
        hasStock: item.hasStock,
      })),
    };
  }

  async getProducts(query = {}) {
    const page = parsePositiveInt(query.page, 1);
    const limit = Math.min(parsePositiveInt(query.limit, 12), 48);

    const records = await this.productCatalogRepository.findPublishedProductsCatalog();
    const normalizedProducts = records.map((record) => this.buildProductPayload(record));
    const filtered = this.applyFilters(normalizedProducts, query);
    const sorted = this.sortProducts(filtered, query.sort);

    const totalItems = sorted.length;
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / limit);
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;
    const items = sorted
      .slice(offset, offset + limit)
      .map((product) => this.summarizeProductForList(product));

    return {
      items,
      pagination: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  async getProductBySlug(slug) {
    const record = await this.productCatalogRepository.findPublishedProductBySlug(slug);
    if (!record) {
      throw new NotFoundError("Product not found");
    }

    return this.buildProductPayload(record);
  }

  async getFilters() {
    const records = await this.productCatalogRepository.findPublishedProductsCatalog();
    const products = records.map((record) => this.buildProductPayload(record));

    const categoryMap = new Map();
    const colourMap = new Map();
    const sizeMap = new Map();

    for (const product of products) {
      if (product.category?.id) {
        const current = categoryMap.get(product.category.id) || {
          id: product.category.id,
          name: product.category.name,
          count: 0,
        };
        current.count += 1;
        categoryMap.set(product.category.id, current);
      }

      const colourSeen = new Set();
      const sizeSeen = new Set();

      for (const item of product.items) {
        if (item.colour?.id && !colourSeen.has(item.colour.id)) {
          colourSeen.add(item.colour.id);
          const currentColour = colourMap.get(item.colour.id) || {
            id: item.colour.id,
            name: item.colour.name,
            count: 0,
          };
          currentColour.count += 1;
          colourMap.set(item.colour.id, currentColour);
        }

        for (const size of item.sizes) {
          if (!size.sizeId || sizeSeen.has(size.sizeId)) continue;
          sizeSeen.add(size.sizeId);
          const currentSize = sizeMap.get(size.sizeId) || {
            id: size.sizeId,
            name: size.sizeName,
            sortOrder: size.sortOrder,
            count: 0,
          };
          currentSize.count += 1;
          sizeMap.set(size.sizeId, currentSize);
        }
      }
    }

    const categories = [...categoryMap.values()].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
    const colours = [...colourMap.values()].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
    const sizes = [...sizeMap.values()]
      .sort(compareBySortOrderThenName)
      .map(({ sortOrder, ...rest }) => rest);

    return {
      categories,
      colours,
      sizes,
    };
  }
}
