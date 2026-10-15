import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ErrorState, LoadingState, Spinner } from "../components/PageState";
import { IconArrowLeft, IconCheck } from "../components/Icons";
import { getOrderById, updateOrderStatus } from "../api/orders";
import { handleImageError } from "../utils/imageFallback";

// BONUS: order status progression
const STATUS_FLOW = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await getOrderById(id);
        setOrder(res.data.order);
      } catch (err) {
        const status = err.response?.status;
        setError(status === 400 || status === 404 ? "Order not found." : "We couldn't load this order.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const currentStep = order ? STATUS_FLOW.indexOf(order.status) : -1;
  const nextStatus = currentStep >= 0 ? STATUS_FLOW[currentStep + 1] : undefined;

  // development-only control that moves the order to the next status
  const handleAdvanceStatus = async () => {
    if (updating || !nextStatus) return;

    setUpdating(true);
    setStatusError("");

    try {
      const res = await updateOrderStatus(order._id, nextStatus);
      setOrder(res.data.order);
    } catch (err) {
      setStatusError(err.response?.data?.message || "Unable to update the order status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page">
        <Link className="back-link" to="/orders">
          <IconArrowLeft />
          Back to My Orders
        </Link>

        {loading && <LoadingState label="Loading order..." />}

        {!loading && error && <ErrorState title={error} />}

        {!loading && !error && order && (
          <div className="order-details">
            <section className="order-card" aria-label="Order information">
              <div className="order-card-header">
                <div>
                  <h1 className="order-details-title">Order #{order._id}</h1>
                  <div className="order-date">Placed on {formatDate(order.createdAt)}</div>
                </div>
                <span className={`order-status order-status-${order.status.toLowerCase()}`}>
                  Status: {order.status}
                </span>
              </div>

              {currentStep >= 0 && (
                <ol className="order-progress" aria-label="Order progress">
                  {STATUS_FLOW.map((status, index) => (
                    <li
                      key={status}
                      className={index <= currentStep ? "order-progress-done" : ""}
                      aria-current={index === currentStep ? "step" : undefined}
                    >
                      <span className="order-progress-dot">
                        <IconCheck />
                      </span>
                      {status}
                    </li>
                  ))}
                </ol>
              )}

              {nextStatus && order.paymentStatus === "PAID" && (
                <div className="order-dev-control">
                  <span>Development only:</span>
                  <button className="btn btn-outline btn-sm" onClick={handleAdvanceStatus} disabled={updating}>
                    {updating && <Spinner small />}
                    {updating ? "Updating..." : `Mark as ${nextStatus}`}
                  </button>
                  {statusError && (
                    <span className="inline-message inline-message-error" role="alert">
                      {statusError}
                    </span>
                  )}
                </div>
              )}
            </section>

            <div className="cart-layout">
              <section className="order-card" aria-labelledby="order-items-title">
                <h2 className="section-title order-section-title" id="order-items-title">Items</h2>
                {/* purchase-time snapshot: prices here never change after the order is placed */}
                <div className="checkout-items">
                  {order.items.map((item) => (
                    <div className="checkout-item" key={item._id}>
                      <img
                        className="checkout-item-image"
                        src={item.image}
                        alt={item.name}
                        onError={handleImageError}
                      />
                      <div className="checkout-item-info">
                        <Link className="checkout-item-name" to={`/products/${item.product}`}>
                          {item.name}
                        </Link>
                        <span className="checkout-item-meta">
                          ₹{item.price.toLocaleString("en-IN")} × {item.quantity}
                        </span>
                      </div>
                      <span className="checkout-item-total">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="cart-summary-row cart-summary-total">
                  <span>Total</span>
                  <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </section>

              <aside className="cart-summary">
                <div className="order-aside-block">
                  <h2 className="section-title order-section-title">Shipping Address</h2>
                  <div className="order-address">
                    <strong>{order.shippingAddress.fullName}</strong>
                    <span>{order.shippingAddress.addressLine1}</span>
                    <span>
                      {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                    </span>
                    <span>Phone: {order.shippingAddress.phone}</span>
                  </div>
                </div>

                <div className="order-aside-block">
                  <h2 className="section-title order-section-title">Payment</h2>
                  <div className="cart-summary-row">
                    <span>Status</span>
                    <span>{order.paymentStatus}</span>
                  </div>
                  {order.razorpayPaymentId && (
                    <div className="cart-summary-row">
                      <span>Payment ID</span>
                      <span className="order-id">{order.razorpayPaymentId}</span>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
