import { IconSearch } from "./Icons";

// Fixed filter options for the dropdown. These are UI choices, not product data:
// the products themselves always come from MongoDB.
const CATEGORIES = ["Electronics", "Fashion", "Books", "Home"];

export default function SearchBar({ search, onSearchChange, category, onCategoryChange }) {
  return (
    <div className="products-toolbar">
      <div className="search-field">
        <IconSearch />
        <input
          className="products-search"
          type="search"
          placeholder="Search products..."
          aria-label="Search products"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        className="products-category-select"
        aria-label="Filter by category"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
