import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import WishlistCard from "../components/WishlistCard";
import { EmptyState, ErrorState, GridSkeleton } from "../components/PageState";
import { getWishlist, removeFromWishlist } from "../api/wishlist";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // per-product remove state, keyed by product id
  const [removingId, setRemovingId] = useState(null);
  const [removeErrors, setRemoveErrors] = useState({});

  // bumped by Try Again so the effect below runs and calls GET /wishlist again
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const res = await getWishlist();
        setWishlist(res.data.wishlist);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [reloadCount]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setReloadCount((count) => count + 1);
  };

  const handleRemove = async (productId) => {
    if (removingId) return;

    setRemovingId(productId);
    setRemoveErrors((prev) => ({ ...prev, [productId]: "" }));

    try {
      await removeFromWishlist(productId);
      // drop it from state so the card disappears without reloading the page
      setWishlist((prev) => prev.filter((product) => product._id !== productId));
    } catch {
      setRemoveErrors((prev) => ({
        ...prev,
        [productId]: "Unable to remove product. Please try again.",
      }));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">My Wishlist</h1>
            {!loading && !error && wishlist.length > 0 && (
              <p className="page-subtitle">
                {wishlist.length} saved {wishlist.length === 1 ? "product" : "products"}
              </p>
            )}
          </div>
        </header>

        {loading && <GridSkeleton label="Loading your wishlist..." count={4} />}

        {!loading && error && (
          <ErrorState title="Something went wrong." message="We couldn't load your wishlist." onRetry={handleRetry} />
        )}

        {!loading && !error && wishlist.length === 0 && (
          <EmptyState
            icon="❤️"
            title="Your wishlist is empty"
            action={
              <Link className="btn btn-primary" to="/products">
                Browse Products
              </Link>
            }
          >
            Save products you love and find them here later.
          </EmptyState>
        )}

        {!loading && !error && wishlist.length > 0 && (
          <div className="products-grid">
            {wishlist.map((product) => (
              <WishlistCard
                key={product._id}
                product={product}
                removing={removingId === product._id}
                error={removeErrors[product._id]}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
