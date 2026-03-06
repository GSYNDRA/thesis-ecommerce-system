import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/lib/api/auth.api";

export interface CatalogCategory {
  id: number;
  name: string;
  sizeCategoryId?: number | null;
}

export interface CatalogColourRef {
  id: number;
  name: string;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  ratingsAverage: number;
  ratingsCount: number;
  category: CatalogCategory | null;
  priceRange: {
    min: number;
    max: number;
  };
  hasStock: boolean;
  totalStock: number;
  defaultItem: {
    productItemId: number;
    price: number;
    colour: CatalogColourRef | null;
    imageUrl: string | null;
  } | null;
  colours: Array<{
    productItemId: number;
    colour: CatalogColourRef | null;
    imageUrl: string | null;
    hasStock: boolean;
  }>;
}

export interface ProductsListResponseData {
  items: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ProductSizeOption {
  variationId: number;
  sizeId: number | null;
  sizeName: string | null;
  sortOrder: number;
  qtyInStock: number;
  isAvailable: boolean;
}

export interface ProductDetailItem {
  productItemId: number;
  productCode: string | null;
  colour: CatalogColourRef | null;
  price: number;
  images: Array<{
    id: number;
    imageUrl: string;
  }>;
  sizes: ProductSizeOption[];
  hasStock: boolean;
  totalStock: number;
}

export interface ProductDetailResponseData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  careInstructions: string | null;
  about: string | null;
  ratingsAverage: number;
  ratingsCount: number;
  category: CatalogCategory | null;
  priceRange: {
    min: number;
    max: number;
  };
  hasStock: boolean;
  totalStock: number;
  items: ProductDetailItem[];
  defaultSelection: {
    productItemId: number | null;
    colourId: number | null;
    variationId: number | null;
    sizeId: number | null;
  };
}

export interface CatalogFiltersResponseData {
  categories: Array<{ id: number; name: string; count: number }>;
  colours: Array<{ id: number; name: string; count: number }>;
  sizes: Array<{ id: number; name: string; count: number }>;
}

export interface ProductsQuery {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: number;
  colourIds?: string;
  sizeIds?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "rating_desc" | "name_asc";
  inStock?: boolean;
}

function toQueryString(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const catalogApi = {
  getProducts(query: ProductsQuery = {}) {
    const qs = toQueryString(query);
    return apiClient.get<ApiSuccessResponse<ProductsListResponseData>>(`/catalog/products${qs}`);
  },

  getProductDetail(slug: string) {
    const safeSlug = encodeURIComponent(slug);
    return apiClient.get<ApiSuccessResponse<ProductDetailResponseData>>(
      `/catalog/products/${safeSlug}`,
    );
  },

  getFilters() {
    return apiClient.get<ApiSuccessResponse<CatalogFiltersResponseData>>("/catalog/filters");
  },
};

