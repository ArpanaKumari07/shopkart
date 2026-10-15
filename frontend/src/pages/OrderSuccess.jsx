import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ErrorState, LoadingState } from "../components/PageState";
import { IconCheck } from "../components/Icons";
import { getOrderById } from "../api/orders";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await getOrderById(id);
        setOrder(res.data.order);
      } catch (err) {
        const status = err.response?.status;
        setError(status === 400 || status === 404 ? "Order not found." : "We couldn't load your order.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  return (
    <div>
      <Navbar />
      <main className="page">
        {loading && <LoadingState label="Loading your order..." />}

        {!loading && error && <ErrorState title={error} />}

        {/* only a verified (PAID) order is shown as a success */}
        {!loading && !error && order && order.paymentStatus === "PAID" && (
          <div className="card order-success-card">
            <div className="order-success-icon">
              <IconCheck />
            </div>
            <h1 className="order-success-title">Order placed successfully</h1>
            <p className="order-success-message">
              Thank you for shopping with ShopKart! Your payment was verified and your order has been placed.
            </p>

            <div className="order-success-details">
              <div className="cart-summary-row">
                <span>Order ID</span>
                <span className="order-id">{order._id}</span>
              </div>
              <div className="cart-summary-row">
                <span>Total</span>
                <span className="order-total">₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="cart-summary-row">
                <span>Status</span>
                <span className={`order-status order-status-${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
            </div>

            <div className="order-success-actions">
              <Link className="btn btn-primary" to="/orders">
                View My Orders
              </Link>
              <Link className="btn btn-outline" to="/products">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && order && order.paymentStatus !== "PAID" && (
          <ErrorState title="This order has not been paid." />
        )}
      </main>
    </div>
  );
}
