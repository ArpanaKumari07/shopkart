import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { IconCart } from "../components/Icons";

export default function Cart() {
  const { cartItems, loading, error, cartCount, subtotal, refreshCart } = useCart();

  // re-sync the shared cart when the page opens, so the latest Product price and stock are shown
  useEffect(() => {
    refreshCart({ background: true });
  }, [refreshCart]);

  return (
    <div>
      <Navbar />
      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">My Cart</h1>
            {!loading && !error && cartItems.length > 0 && (
              <p className="page-subtitle">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </p>
            )}
          </div>
        </header>

        {loading && <LoadingState label="Loading your cart..." />}

        {!loading && error && <ErrorState title="Unable to load your cart." onRetry={() => refreshCart()} />}

        {!loading && !error && cartItems.length === 0 && (
          <EmptyState
            icon={<IconCart />}
            title="Your cart is empty 🛒"
            action={
              <Link className="btn btn-primary" to="/products">
                Browse Products
              </Link>
            }
          >
            Looks like you haven't added anything yet.
          </EmptyState>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <div className="cart-layout">
            <section className="card cart-panel" aria-label="Cart items">
              {cartItems.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </section>

            <aside className="cart-summary" aria-labelledby="cart-summary-title">
              <h2 className="cart-summary-title" id="cart-summary-title">Order Summary</h2>
              <div className="cart-summary-row">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <Link className="btn btn-primary" to="/checkout">
                Proceed to Checkout
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
