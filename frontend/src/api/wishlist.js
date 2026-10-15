import axios from "axios";
// Same pattern as api/products.js. withCredentials sends the HttpOnly login
// cookie, which the backend uses to identify the customer (no userId is sent).

const wishlistApi = axios.create({
  baseURL: "/wishlist",
  withCredentials: true,
});

export const getWishlist = () => wishlistApi.get("/");

export const addToWishlist = (productId) => wishlistApi.post(`/${productId}`);

export const removeFromWishlist = (productId) => wishlistApi.delete(`/${productId}`);
