import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { handleImageError } from "../utils/imageFallback";
import { IconTrash } from "./Icons";

export default function CartItem({ item }) {
  const { product, quantity } = item;
  const { updateQuantity, removeFromCart } = useCart();
  // only this row's request status; the cart data itself lives in CartContext
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const runRequest = async (request, fallbackMessage) => {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await request();
    } catch (err) {
      // 400 carries a useful message from the server, e.g. "Only 6 in stock"
      setError(err.response?.status === 400 ? err.response.data.message : fallbackMessage);
    } finally {
      setBusy(false);
    }
  };

  const handleDecrease = () =>
    runRequest(() => updateQuantity(product._id, quantity - 1), "Unable to update quantity. Please try again.");

  const handleIncrease = () =>
    runRequest(() => updateQuantity(product._id, quantity + 1), "Unable to update quantity. Please try again.");

  const handleRemove = () =>
    runRequest(() => removeFromCart(product._id), "Unable to remove product. Please try again.");

  return (
    <div className="cart-item">
      <Link className="cart-item-media" to={`/products/${product._id}`} tabIndex={-1} aria-hidden="true">
        <img className="cart-item-image" src={product.image} alt={product.name} onError={handleImageError} />
      </Link>

      <div className="cart-item-info">
        <Link className="cart-item-name" to={`/products/${product._id}`}>
          {product.name}
        </Link>
        <div className="cart-item-price">₹{product.price.toLocaleString("en-IN")}</div>

        <div className="cart-item-controls">
          <div className="qty-stepper" role="group" aria-label={`Quantity of ${product.name}`} aria-busy={busy}>
            {/* below 1 is not allowed: at quantity 1 the user removes the item instead */}
            <button
              className="cart-qty-btn"
              onClick={handleDecrease}
              disabled={busy || quantity <= 1}
              aria-label={`Decrease quantity of ${product.name}`}
            >
              -
            </button>
            {/* keyed so the number animates in when the quantity changes */}
            <span className="cart-qty-value" key={quantity} aria-live="polite">
              {quantity}
            </span>
            <button
              className="cart-qty-btn"
              onClick={handleIncrease}
              disabled={busy || quantity >= product.stock}
              aria-label={`Increase quantity of ${product.name}`}
            >
              +
            </button>
          </div>

          <button className="cart-remove-btn" onClick={handleRemove} disabled={busy}>
            <IconTrash />
            Remove
          </button>
        </div>

        {quantity >= product.stock && (
          <span className="cart-item-note">Only {product.stock} in stock</span>
        )}
        {error && <span className="inline-message inline-message-error" role="alert">{error}</span>}
      </div>

      <div className="cart-item-total">₹{(product.price * quantity).toLocaleString("en-IN")}</div>
    </div>
  );
}
