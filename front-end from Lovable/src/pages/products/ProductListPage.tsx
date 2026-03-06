import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { catalogApi, type ProductListItem } from "@/lib/api/catalog.api";
import { ApiError } from "@/lib/api/client";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function buildPriceLabel(item: ProductListItem) {
  const min = item.priceRange.min;
  const max = item.priceRange.max;
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const categoryId = searchParams.get("categoryId") || "";
  const inStock = (searchParams.get("inStock") || "true").toLowerCase() !== "false";

  const [searchText, setSearchText] = useState(q);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1,
  });
  const [categories, setCategories] = useState<Array<{ id: number; name: string; count: number }>>([]);

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const response = await catalogApi.getProducts({
          page,
          limit: 12,
          q: q || undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          sort: sort as "newest" | "price_asc" | "price_desc" | "rating_desc" | "name_asc",
          inStock,
        });

        if (!isActive) return;
        setProducts(response.data.items || []);
        setPagination(response.data.pagination);
      } catch (err) {
        if (!isActive) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load products.");
        }
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      isActive = false;
    };
  }, [page, q, sort, categoryId, inStock]);

  useEffect(() => {
    let isActive = true;

    async function loadFilters() {
      try {
        const response = await catalogApi.getFilters();
        if (!isActive) return;
        setCategories(response.data.categories || []);
      } catch {
        if (!isActive) return;
        setCategories([]);
      }
    }

    loadFilters();

    return () => {
      isActive = false;
    };
  }, []);

  const showEmpty = !loading && !error && products.length === 0;

  const pageStart = useMemo(() => {
    if (!pagination.totalItems) return 0;
    return (pagination.page - 1) * pagination.limit + 1;
  }, [pagination]);

  const pageEnd = useMemo(() => {
    if (!pagination.totalItems) return 0;
    return Math.min(pagination.page * pagination.limit, pagination.totalItems);
  }, [pagination]);

  function updateSearchParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next);
  }

  function onSubmitSearch(event: React.FormEvent) {
    event.preventDefault();
    updateSearchParams({
      q: searchText.trim() || null,
      page: "1",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Fashion Ecommerce</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Product Catalog</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a product, then select color and size on the detail page.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
          <form className="md:col-span-2" onSubmit={onSubmitSearch}>
            <div className="flex gap-2">
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by name or slug"
              />
              <Button type="submit" size="icon" aria-label="Search products">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={categoryId}
            onChange={(event) =>
              updateSearchParams({
                categoryId: event.target.value || null,
                page: "1",
              })
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={sort}
              onChange={(event) =>
                updateSearchParams({
                  sort: event.target.value,
                  page: "1",
                })
              }
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Top Rated</option>
              <option value="name_asc">Name A-Z</option>
            </select>

            <Button
              type="button"
              variant={inStock ? "default" : "outline"}
              onClick={() =>
                updateSearchParams({
                  inStock: inStock ? "false" : "true",
                  page: "1",
                })
              }
            >
              {inStock ? "In-stock only" : "Show all"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{error}</p>
            <Button className="mt-3" variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : null}

        {showEmpty ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No products found for current filters.
          </div>
        ) : null}

        {!loading && !error && products.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing {pageStart}-{pageEnd} of {pagination.totalItems} products
              </p>
              <div className="flex items-center gap-3">
                <Link className="text-accent hover:underline" to="/cart">
                  View Cart
                </Link>
                <Link className="text-accent hover:underline" to="/">
                  Back to Home
                </Link>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const imageUrl = product.defaultItem?.imageUrl;
                const colours = product.colours
                  .map((colourItem) => colourItem.colour?.name)
                  .filter(Boolean)
                  .slice(0, 4) as string[];

                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="aspect-[3/4] bg-secondary">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 p-4">
                      <p className="line-clamp-2 min-h-[2.5rem] text-base font-semibold group-hover:text-accent">
                        {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{buildPriceLabel(product)}</p>

                      <div className="flex flex-wrap gap-1">
                        {colours.map((colourName) => (
                          <Badge key={`${product.id}-${colourName}`} variant="secondary" className="text-[10px]">
                            {colourName}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {product.hasStock ? `In stock (${product.totalStock})` : "Out of stock"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() =>
                  updateSearchParams({
                    page: String(Math.max(1, pagination.page - 1)),
                  })
                }
              >
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} / {pagination.totalPages}
              </p>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  updateSearchParams({
                    page: String(Math.min(pagination.totalPages, pagination.page + 1)),
                  })
                }
              >
                Next
              </Button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
