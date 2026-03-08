import { CatalogService } from "./catalog.service.js";

const DEFAULT_SEARCH_LIMIT = 5;
const COLOR_CACHE_TTL_MS = 5 * 60 * 1000;

const PRODUCT_QUERY_STOPWORDS = [
  "do you have",
  "is this",
  "is that",
  "is it",
  "available",
  "availability",
  "in stock",
  "out of stock",
  "can i get",
  "i need",
  "i want",
  "looking for",
  "show me",
  "find",
  "search",
  "please",
  "check",
  "for me",
  "product",
  "products",
  "color",
  "colour",
  "size",
];

const SIZE_PATTERN =
  /\b(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[0-9]{2,3})\b/i;

function normalizeText(input = "") {
  return String(input || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value = "") {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function singularizeToken(token = "") {
  const lower = String(token || "").toLowerCase();
  if (lower.length <= 3) return lower;
  if (lower.endsWith("ies") && lower.length > 4) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith("ses") && lower.length > 4) return lower.slice(0, -2);
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  return lower;
}

function toCurrency(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "$0.00";
  return `$${parsed.toFixed(2)}`;
}

function formatRange(priceRange = {}) {
  const min = Number(priceRange.min || 0);
  const max = Number(priceRange.max || 0);
  if (min === max) return toCurrency(min);
  return `${toCurrency(min)} - ${toCurrency(max)}`;
}

function uniqueUppercase(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim().toUpperCase()).filter(Boolean))];
}

export class ChatProductToolService {
  constructor() {
    this.catalogService = new CatalogService();
    this.cachedColorNames = [];
    this.colorCacheExpiresAt = 0;
  }

  extractProductQuery(message = "") {
    let text = normalizeText(message);
    if (!text) return "";

    const quotedMatch = String(message || "").match(/["']([^"']{2,120})["']/);
    if (quotedMatch?.[1]) {
      return normalizeText(quotedMatch[1]);
    }

    PRODUCT_QUERY_STOPWORDS.forEach((stopword) => {
      const pattern = new RegExp(`\\b${stopword.replace(/\s+/g, "\\s+")}\\b`, "gi");
      text = text.replace(pattern, " ");
    });

    text = text.replace(/\b(size|color|colour)\s+[a-z0-9-]+\b/gi, " ");
    text = text.replace(/\s+/g, " ").trim();
    return text;
  }

  extractSize(message = "") {
    const match = String(message || "").match(SIZE_PATTERN);
    return match?.[1] ? String(match[1]).toUpperCase() : null;
  }

  findColorNameInText(message = "", colorNames = []) {
    const text = normalizeText(message);
    if (!text || colorNames.length === 0) return null;

    const sorted = [...colorNames]
      .map((colorName) => String(colorName || "").trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    const hit = sorted.find((colorName) => text.includes(normalizeText(colorName)));
    return hit || null;
  }

  async getKnownColorNames() {
    if (
      this.cachedColorNames.length > 0 &&
      this.colorCacheExpiresAt > Date.now()
    ) {
      return this.cachedColorNames;
    }

    try {
      const filters = await this.catalogService.getFilters();
      const colors = (filters?.colours || [])
        .map((entry) => normalizeText(entry?.name || ""))
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);
      this.cachedColorNames = [...new Set(colors)];
      this.colorCacheExpiresAt = Date.now() + COLOR_CACHE_TTL_MS;
      return this.cachedColorNames;
    } catch {
      return [];
    }
  }

  async buildSearchQueries(rawQuery = "") {
    const normalized = normalizeText(rawQuery);
    if (!normalized) return [];

    const querySet = new Set([normalized]);

    const noSize = normalizeText(
      normalized.replace(/\b(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[0-9]{2,3})\b/gi, " "),
    );
    if (noSize) querySet.add(noSize);

    const knownColors = await this.getKnownColorNames();
    let withoutColors = noSize || normalized;
    for (const color of knownColors) {
      const pattern = new RegExp(`\\b${escapeRegex(color).replace(/\s+/g, "\\s+")}\\b`, "gi");
      withoutColors = withoutColors.replace(pattern, " ");
    }
    withoutColors = normalizeText(withoutColors);
    if (withoutColors) querySet.add(withoutColors);

    for (const candidate of [normalized, noSize, withoutColors]) {
      if (!candidate) continue;
      const singular = candidate
        .split(" ")
        .map((token) => singularizeToken(token))
        .join(" ")
        .trim();
      if (singular) querySet.add(singular);
    }

    const allCandidates = [...querySet].filter(Boolean);
    for (const candidate of allCandidates) {
      const tokens = candidate.split(" ").filter(Boolean);
      for (const token of tokens) {
        if (token.length < 3) continue;
        querySet.add(token);
        querySet.add(singularizeToken(token));
      }
    }

    return [...querySet].filter((entry) => entry.length >= 2);
  }

  async searchProductsByQuery(rawQuery = "", limit = DEFAULT_SEARCH_LIMIT) {
    const query = String(rawQuery || "").trim();
    if (!query) return [];
    const candidateQueries = await this.buildSearchQueries(query);

    for (const candidate of candidateQueries) {
      const response = await this.catalogService.getProducts({
        q: candidate,
        page: 1,
        limit,
        sort: "rating_desc",
      });
      if ((response?.items || []).length > 0) {
        return response.items || [];
      }
    }

    return [];
  }

  formatSearchResponse(products = [], query = "") {
    if (products.length === 0) {
      return `I couldn't find any published products matching "${query}". Please try another keyword.`;
    }

    const lines = products.map((product, index) => {
      const stockText = product.hasStock ? "In stock" : "Out of stock";
      return `${index + 1}. ${product.name} (slug: ${product.slug}) - ${formatRange(product.priceRange)} - ${stockText}`;
    });

    return [
      `Here are the top ${products.length} products I found for "${query}":`,
      ...lines,
      "Tell me the product slug plus color and size if you want an exact stock check.",
    ].join("\n");
  }

  formatProductAdviceResponse(product) {
    if (!product) {
      return "Please share a product name or slug, and I can provide a quick product overview.";
    }

    const colorNames = product.items
      .map((item) => item.colour?.name || "")
      .filter(Boolean);
    const sizeNames = uniqueUppercase(
      product.items.flatMap((item) => (item.sizes || []).map((size) => size.sizeName)),
    );

    return [
      `${product.name} (${product.slug})`,
      `Price range: ${formatRange(product.priceRange)}`,
      `Material: ${product.material || "N/A"}`,
      `Care instructions: ${product.careInstructions || "N/A"}`,
      `Description: ${product.description || "N/A"}`,
      `Colors: ${colorNames.length ? colorNames.join(", ") : "N/A"}`,
      `Sizes: ${sizeNames.length ? sizeNames.join(", ") : "N/A"}`,
      product.hasStock ? `Current stock: ${product.totalStock}` : "Current stock: Out of stock",
    ].join("\n");
  }

  formatAvailabilityResponse({ product, item, sizeRow }) {
    const colorName = item.colour?.name || "Unknown color";
    const sizeName = sizeRow.sizeName || "Unknown size";
    const stock = Number(sizeRow.qtyInStock || 0);
    const priceText = toCurrency(item.price);

    if (stock > 0) {
      return `${product.name} is in stock for color ${colorName}, size ${sizeName}. Available quantity: ${stock}. Price: ${priceText}.`;
    }

    return `${product.name} is currently out of stock for color ${colorName}, size ${sizeName}. Price: ${priceText}.`;
  }

  async handleProductSearch(message = "") {
    const query = this.extractProductQuery(message);
    if (!query) {
      return {
        handled: true,
        content: "Please share the product name or slug you want to find.",
      };
    }

    const products = await this.searchProductsByQuery(query, DEFAULT_SEARCH_LIMIT);
    return {
      handled: true,
      content: this.formatSearchResponse(products, query),
    };
  }

  async handleProductBasicAdvice(message = "") {
    const query = this.extractProductQuery(message);
    if (!query) {
      return {
        handled: true,
        content: "Please share the product name or slug, and I can give you a quick product overview.",
      };
    }

    const products = await this.searchProductsByQuery(query, DEFAULT_SEARCH_LIMIT);
    if (products.length === 0) {
      return {
        handled: true,
        content: `I couldn't find any published products matching "${query}". Please try another keyword.`,
      };
    }

    const product = await this.catalogService.getProductBySlug(products[0].slug);
    return {
      handled: true,
      content: this.formatProductAdviceResponse(product),
    };
  }

  async handleProductAvailability(message = "") {
    const query = this.extractProductQuery(message);
    if (!query) {
      return {
        handled: true,
        content: "Please tell me the product name or slug first, then I can check stock by color and size.",
      };
    }

    const products = await this.searchProductsByQuery(query, DEFAULT_SEARCH_LIMIT);
    if (products.length === 0) {
      return {
        handled: true,
        content: `I couldn't find any published products matching "${query}". Please try another keyword.`,
      };
    }

    const product = await this.catalogService.getProductBySlug(products[0].slug);
    if (!product.items || product.items.length === 0) {
      return {
        handled: true,
        content: `${product.name} currently has no sellable variants configured.`,
      };
    }

    const colorNames = product.items
      .map((entry) => entry.colour?.name || "")
      .filter(Boolean);
    const selectedColorName = this.findColorNameInText(message, colorNames);

    if (!selectedColorName && colorNames.length > 1) {
      return {
        handled: true,
        content: `Which color would you like to check for ${product.name}? Available colors: ${colorNames.join(", ")}.`,
      };
    }

    const item =
      product.items.find((entry) => entry.colour?.name === selectedColorName) ||
      product.items[0];

    const normalizedSize = this.extractSize(message);
    const sizeNames = uniqueUppercase((item.sizes || []).map((size) => size.sizeName));

    if (!normalizedSize && sizeNames.length > 1) {
      return {
        handled: true,
        content: `Which size should I check for ${product.name} (${item.colour?.name || "default color"})? Available sizes: ${sizeNames.join(", ")}.`,
      };
    }

    const sizeRow =
      (item.sizes || []).find(
        (size) => String(size.sizeName || "").trim().toUpperCase() === normalizedSize,
      ) || (item.sizes || [])[0];

    if (!sizeRow) {
      return {
        handled: true,
        content: `${product.name} does not have size variants configured for ${item.colour?.name || "this color"}.`,
      };
    }

    if (normalizedSize && !sizeNames.includes(normalizedSize)) {
      return {
        handled: true,
        content: `Size ${normalizedSize} is not available for ${product.name} (${item.colour?.name || "default color"}). Available sizes: ${sizeNames.join(", ")}.`,
      };
    }

    return {
      handled: true,
      content: this.formatAvailabilityResponse({
        product,
        item,
        sizeRow,
      }),
    };
  }

  async handleIntent({ intent, message }) {
    if (intent === "product_search") {
      return this.handleProductSearch(message);
    }

    if (intent === "product_availability") {
      return this.handleProductAvailability(message);
    }

    if (intent === "product_basic_advice") {
      return this.handleProductBasicAdvice(message);
    }

    return {
      handled: false,
      content: "",
    };
  }
}
