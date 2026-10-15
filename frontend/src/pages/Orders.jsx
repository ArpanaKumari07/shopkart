import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { IconPackage } from "../components/Icons";
import { getOrders } from "../api/orders";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // bumped by Try Again so the effect below calls GET /orders again
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await getOrders();
        setOrders(res.data.orders);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [reloadCount]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setReloadCount((count) => count + 1);
  };

  return (
    <div>
      <Navbar />
      <main className="page page-narrow">
        <header className="page-header">
          <div>
            <h1 className="page-title">My Orders</h1>
            {!loading && !error && orders.length > 0 && (
              <p className="page-subtitle">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </p>
            )}
          </div>
        </header>

        {loading && <LoadingState label="Loading your orders..." />}

        {!loading && error && (
          <ErrorState title="Something went wrong." message="We couldn't load your orders." onRetry={handleRetry} />
        )}

        {!loading && !error && orders.length === 0 && (
          <EmptyState
            icon={<IconPackage />}
            title="You have not placed any orders yet."
            action={
              <Link className="btn btn-primary" to="/products">
                Start Shopping
              </Link>
            }
          />
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <div className="order-card-header">
                  <div>
                    <div className="order-id">Order #{order._id}</div>
                    <div className="order-date">Placed on {formatDate(order.createdAt)}</div>
                  </div>
                  <span className={`order-status order-status-${order.status.toLowerCase()}`}>
                    Status: {order.status}
                  </span>
                </div>

                <ul className="order-items">
                  {order.items.map((item) => (
                    <li key={item._id}>
                      <span>{item.name}</span>
                      <span>× {item.quantity}</span>
                    </li>
                  ))}
                </ul>

                <div className="order-card-footer">
                  <span className="order-total">Total: ₹{order.totalAmount.toLocaleString("en-IN")}</span>
                  <Link className="btn btn-outline btn-sm" to={`/orders/${order._id}`}>
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
