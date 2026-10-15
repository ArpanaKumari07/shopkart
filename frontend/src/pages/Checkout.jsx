import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { createPaymentOrder, verifyPayment } from "../api/orders";
import { handleImageError } from "../utils/imageFallback";
import { EmptyState, ErrorState, LoadingState, Spinner } from "../components/PageState";
import { IconCart } from "../components/Icons";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

// loads Razorpay Standard Checkout once; resolves false if the script can't be loaded
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = () => {
      script.remove(); // allow a clean retry
      resolve(false);
    };
    document.body.appendChild(script);
  });

// autoComplete / inputMode only help the browser fill the form and pick the right mobile keyboard
const FIELDS = [
  { name: "fullName", label: "Full Name", type: "text", autoComplete: "name" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel-national", inputMode: "numeric" },
  { name: "addressLine1", label: "Address Line", type: "text", autoComplete: "address-line1" },
  { name: "city", label: "City", type: "text", autoComplete: "address-level2" },
  { name: "state", label: "State", type: "text", autoComplete: "address-level1" },
  { name: "pincode", label: "Pincode", type: "text", autoComplete: "postal-code", inputMode: "numeric" },
];

export default function Checkout() {
  const { user } = useAuth();
  const { cartItems, loading, error, subtotal, refreshCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  // idle -> placing (creating the order / Razorpay open) -> verifying
  const [step, setStep] = useState("idle");
  const paymentFailed = useRef(false);

  // re-sync the shared cart so the summary shows the latest prices and stock
  useEffect(() => {
    refreshCart({ background: true });
  }, [refreshCart]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};

    for (const field of FIELDS) {
      if (!form[field.name].trim()) newErrors[field.name] = `${field.label} is required.`;
    }

    if (!newErrors.phone && !/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = "Phone must be a valid 10-digit number.";
    }

    if (!newErrors.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
      newErrors.pincode = "Pincode must contain 6 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setServerError("");

    // nothing is sent if the basic client-side validation fails
    if (!validate() || step !== "idle") return;

    setStep("placing");
    paymentFailed.current = false;

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setServerError("Unable to load Razorpay Checkout. Please check your connection and try again.");
      setStep("idle");
      return;
    }

    const shippingAddress = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );

    let paymentOrder;
    try {
      // the server validates stock, uses the latest prices and calculates the total
      const res = await createPaymentOrder(shippingAddress);
      paymentOrder = res.data;
    } catch (err) {
      setServerError(err.response?.data?.message || "Unable to place your order. Please try again.");
      setStep("idle");
      // stock or prices may have changed: show the latest cart
      refreshCart({ background: true });
      return;
    }

    const paymentObject = new window.Razorpay({
      key: paymentOrder.key,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: "ShopKart",
      description: "ShopKart order payment",
      order_id: paymentOrder.razorpayOrderId,
      prefill: {
        name: shippingAddress.fullName,
        contact: shippingAddress.phone,
      },
      theme: { color: "#ea580c" },
      // Razorpay's response is only a claim: the backend verifies the signature before the order is paid
      handler: async (response) => {
        setStep("verifying");
        try {
          const res = await verifyPayment({
            shopKartOrderId: paymentOrder.shopKartOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          // the server has emptied the cart, so the Navbar shows Cart (0) right away
          clearCart();
          navigate(`/order-success/${res.data.order._id}`, { replace: true });
        } catch (err) {
          const message = err.response?.data?.message || "Payment could not be verified";
          setServerError(`${message.replace(/\.?$/, ".")} Your cart has not been cleared.`);
          setStep("idle");
        }
      },
      modal: {
        ondismiss: () => {
          if (!paymentFailed.current) {
            setServerError("Payment was cancelled. Your cart has not been cleared.");
          }
          setStep("idle");
        },
      },
    });

    paymentObject.on("payment.failed", (response) => {
      paymentFailed.current = true;
      const reason = response?.error?.description;
      setServerError(
        `Payment failed${reason ? `: ${reason}` : "."} Your cart has not been cleared. Please try again.`
      );
      setStep("idle");
    });

    paymentObject.open();
  };

  const placeLabel = {
    idle: "Place Order",
    placing: "Placing Order...",
    verifying: "Verifying Payment...",
  }[step];

  return (
    <div>
      <Navbar />
      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Checkout</h1>
            <p className="page-subtitle">Enter your shipping details and review your order.</p>
          </div>
        </header>

        {loading && <LoadingState label="Loading checkout..." />}

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
            Add products to your cart before checking out.
          </EmptyState>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <form className="cart-layout" onSubmit={handlePlaceOrder} noValidate>
            <section className="card checkout-card" aria-labelledby="shipping-title">
              <h2 className="section-title" id="shipping-title">Shipping Details</h2>
              <p className="section-hint">Where should we deliver your order?</p>

              {serverError && (
                <div className="form-error-banner" role="alert">
                  {serverError}
                </div>
              )}

              <div className="checkout-fields">
                {FIELDS.map((field) => (
                  <div
                    key={field.name}
                    className={field.name === "addressLine1" ? "form-group checkout-field-wide" : "form-group"}
                  >
                    <label htmlFor={field.name}>{field.label}</label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      inputMode={field.inputMode}
                      value={form[field.name]}
                      onChange={handleChange}
                      disabled={step !== "idle"}
                      aria-invalid={errors[field.name] ? "true" : undefined}
                      aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                    />
                    {errors[field.name] && (
                      <span className="field-error" id={`${field.name}-error`}>
                        {errors[field.name]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <aside className="cart-summary" aria-labelledby="checkout-summary-title">
              <h2 className="cart-summary-title" id="checkout-summary-title">Order Summary</h2>

              <div className="checkout-items">
                {cartItems.map(({ product, quantity }) => (
                  <div className="checkout-item" key={product._id}>
                    <img
                      className="checkout-item-image"
                      src={product.image}
                      alt={product.name}
                      onError={handleImageError}
                    />
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{product.name}</span>
                      <span className="checkout-item-meta">
                        ₹{product.price.toLocaleString("en-IN")} × {quantity}
                      </span>
                    </div>
                    <span className="checkout-item-total">
                      ₹{(product.price * quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              <button className="btn btn-primary" type="submit" disabled={step !== "idle"}>
                {step !== "idle" && <Spinner small />}
                {placeLabel}
              </button>
              <span className="checkout-note">
                Final prices and stock are confirmed by ShopKart before payment. Payments run in Razorpay Test Mode.
              </span>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}
