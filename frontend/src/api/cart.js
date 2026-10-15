import axios from "axios";
// Same pattern as api/wishlist.js. withCredentials sends the HttpOnly login
// cookie, which the backend uses to identify the customer (no userId is sent).
// Every call resolves with the updated cart, populated with the latest Product data.

const cartApi = axios.create({
  baseURL: "/cart",
  withCredentials: true,
});

export const getCart = () => cartApi.get("/");

export const addToCart = (productId) => cartApi.post(`/${productId}`);

export const updateCartQuantity = (productId, quantity) =>
  cartApi.patch(`/${productId}`, { quantity });

export const removeFromCart = (productId) => cartApi.delete(`/${productId}`);
