import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { addToWishlist } from "../api/wishlist";
import { useCart } from "../context/CartContext";
import { handleImageError } from "../utils/imageFallback";
import { Spinner } from "./PageState";

export default function ProductCard({ product }) {
  const inStock = product.stock > 0;
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState("");
  const cartRequestInProgress = useRef(false);

  const handleAddToCart = async () => {
    // same guard as the wishlist button: block extra clicks while the request is running
    if (cartRequestInProgress.current) return;

    cartRequestInProgress.current = true;
    setAdding(true);
    setCartError("");

    try {
      // updates the shared cart state, so the Navbar count changes without a page refresh
      await addToCart(product._id);
    } catch (err) {
      // 400 carries a useful message from the server, e.g. "Only 6 in stock"
      setCartError(
        err.response?.status === 400
          ? err.response.data.message
          : "Unable to add to cart. Please try again."
      );
    } finally {
      cartRequestInProgress.current = false;
      setAdding(false);
    }
  };
  // idle -> saving -> added | error
  const [wishlistStatus, setWishlistStatus] = useState("idle");
  const [wishlistError, setWishlistError] = useState("");
  // a ref updates immediately, so clicks fired before the next render are blocked too
  const requestInProgress = useRef(false);

  const handleAddToWishlist = async () => {
    // ignore extra clicks while a request is running or after it succeeded
    if (requestInProgress.current || wishlistStatus === "added") return;

    requestInProgress.current = true;
    setWishlistStatus("saving");
    setWishlistError("");

    try {
      await addToWishlist(product._id);
      setWishlistStatus("added");
    } catch (err) {
      if (err.response?.status === 409) {
        // the backend says it's already saved, so show it as added
        setWishlistStatus("added");
        setWishlistError("This product is already in your wishlist.");
      } else {
        setWishlistStatus("error");
        setWishlistError("Unable to save product. Please try again.");
      }
    } finally {
      requestInProgress.current = false;
    }
  };

  const wishlistLabel = {
    idle: "♡ Add to Wishlist",
    saving: "⏳ Saving...",
    added: "♥ Added to Wishlist",
    error: "♡ Add to Wishlist",
  }[wishlistStatus];

  return (
    <article className="product-card">
      <Link className="product-card-media" to={`/products/${product._id}`} tabIndex={-1} aria-hidden="true">
        <img
          className="product-card-image"
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={handleImageError}
        />
      </Link>

      <div className="product-card-body">
        <span className="product-card-category">{product.category}</span>
        <h3>
          <Link className="product-card-name" to={`/products/${product._id}`}>
            {product.name}
          </Link>
        </h3>
        <div className="product-card-meta">
          <span className="product-card-price">₹{product.price.toLocaleString("en-IN")}</span>
          <span className={inStock ? "product-card-stock" : "product-card-stock out-of-stock"}>
            {inStock ? `${product.stock} units left` : "Out of stock"}
          </span>
        </div>

        <div className="product-card-actions">
          <button
            className="btn btn-primary btn-block"
            onClick={handleAddToCart}
            disabled={adding || !inStock}
          >
            {adding && <Spinner small />}
            {!inStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
          </button>
          {cartError && <span className="inline-message inline-message-error" role="alert">{cartError}</span>}

          <div className="product-card-secondary">
            <Link className="btn btn-outline btn-sm" to={`/products/${product._id}`}>
              View Details
            </Link>
            <button
              className={wishlistStatus === "added" ? "btn btn-wishlist btn-sm is-saved" : "btn btn-wishlist btn-sm"}
              onClick={handleAddToWishlist}
              disabled={wishlistStatus === "saving" || wishlistStatus === "added"}
            >
              {wishlistLabel}
            </button>
          </div>
          {wishlistError && (
            <span
              className={wishlistStatus === "error" ? "inline-message inline-message-error" : "inline-message"}
              role={wishlistStatus === "error" ? "alert" : undefined}
            >
              {wishlistError}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
