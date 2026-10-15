import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import { EmptyState, ErrorState, GridSkeleton } from "../components/PageState";
import { IconSearch } from "../components/Icons";
import { getProducts } from "../api/products";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce the search input so we don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Runs on first render and again whenever the search text or category changes.
  // The filtering itself happens on the backend (MongoDB query), not here.
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (category) params.category = category;

        const res = await getProducts(params);
        setProducts(res.data.products);
      } catch {
        setError("Something went wrong while loading products.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [debouncedSearch, category]);

  return (
    <div>
      <Navbar />
      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">
              {!loading && !error
                ? `${products.length} ${products.length === 1 ? "product" : "products"}`
                : "Browse the ShopKart catalogue"}
            </p>
          </div>
        </header>

        <SearchBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
        />

        {loading && <GridSkeleton label="Loading products..." />}

        {!loading && error && <ErrorState title="Unable to load products" message={error} />}

        {!loading && !error && products.length === 0 && (
          <EmptyState icon={<IconSearch />} title="No products found.">
            Try a different search term or category.
          </EmptyState>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
