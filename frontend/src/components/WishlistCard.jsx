import { Link } from "react-router-dom";
import { handleImageError } from "../utils/imageFallback";
import { Spinner } from "./PageState";

export default function WishlistCard({ product, removing, error, onRemove }) {
  const inStock = product.stock > 0;

  return (
    <article className="product-card">
      <Link className="product-card-media" to={`/products/${product._id}`} tabIndex={-1} aria-hidden="true">
        <img className="product-card-image" src={product.image} alt={product.name} onError={handleImageError} />
      </Link>

      <div className="product-card-body">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-meta">
          <span className="product-card-price">₹{product.price.toLocaleString("en-IN")}</span>
          <span className={inStock ? "product-card-stock" : "product-card-stock out-of-stock"}>
            {inStock ? `${product.stock} units left` : "Out of stock"}
          </span>
        </div>

        <div className="product-card-actions">
          <Link className="btn btn-primary btn-block" to={`/products/${product._id}`}>
            View Details
          </Link>
          <button
            className="btn btn-wishlist btn-sm is-saved"
            onClick={() => onRemove(product._id)}
            disabled={removing}
          >
            {removing && <Spinner small />}
            {removing ? "Removing..." : "Remove from Wishlist ♥"}
          </button>
          {error && <span className="inline-message inline-message-error" role="alert">{error}</span>}
        </div>
      </div>
    </article>
  );
}
