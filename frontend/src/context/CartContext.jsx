import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import * as cartApi from "../api/cart";

const CartContext = createContext(null);

// The ONE shared cart state for the app: Navbar, ProductCard and the Cart page all read
// and change the cart through this context instead of fetching their own copies.
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // every refresh/mutation gets a newer id, so a slow response can't overwrite newer cart data
  const latestRequest = useRef(0);

  // background: re-sync without switching the UI to the loading state (keeps the current items visible)
  const refreshCart = useCallback(async ({ background = false } = {}) => {
    const requestId = ++latestRequest.current;
    if (!background) setLoading(true);
    setError("");

    try {
      const res = await cartApi.getCart();
      if (requestId === latestRequest.current) setCartItems(res.data.cart);
    } catch {
      if (requestId === latestRequest.current) setError("Unable to load your cart.");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  // load the cart after login, clear it after logout
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      latestRequest.current++;
      setCartItems([]);
      setError("");
      setLoading(true);
    }
  }, [user, refreshCart]);

  // each cart API returns the updated cart from MongoDB, which becomes the new shared state
  const applyCart = (cart) => {
    latestRequest.current++;
    setCartItems(cart);
    setError("");
    setLoading(false);
  };

  const addToCart = async (productId) => {
    const res = await cartApi.addToCart(productId);
    applyCart(res.data.cart);
  };

  const updateQuantity = async (productId, quantity) => {
    const res = await cartApi.updateCartQuantity(productId, quantity);
    applyCart(res.data.cart);
  };

  const removeFromCart = async (productId) => {
    const res = await cartApi.removeFromCart(productId);
    applyCart(res.data.cart);
  };

  // after a verified payment the server has already emptied the cart, so mirror that locally
  const clearCart = () => applyCart([]);

  // derived values: calculated from cartItems, never stored in MongoDB
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        cartCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
