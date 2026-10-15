import axios from "axios";
// Same pattern as api/cart.js. withCredentials sends the HttpOnly login
// cookie, which the backend uses to identify the customer (no userId is sent).

const orderApi = axios.create({
  baseURL: "/orders",
  withCredentials: true,
});

// only the shipping address is sent: items, prices and the total are calculated on the server
export const createPaymentOrder = (shippingAddress) =>
  orderApi.post("/create-payment-order", { shippingAddress });

export const verifyPayment = (payment) => orderApi.post("/verify-payment", payment);

export const getOrders = () => orderApi.get("/");

export const getOrderById = (id) => orderApi.get(`/${id}`);

// BONUS: development-only order status progression
export const updateOrderStatus = (id, status) => orderApi.patch(`/${id}/status`, { status });
