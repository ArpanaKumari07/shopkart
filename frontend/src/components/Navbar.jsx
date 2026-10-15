import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Brand from "./Brand";
import { IconClose, IconMenu } from "./Icons";

export default function Navbar() {
  const { logout } = useAuth();
  // total units (not distinct products), derived from the shared cart state
  const { cartCount } = useCart();
  const navigate = useNavigate();
  // mobile menu only; on wider screens the links are always visible
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <nav className="navbar" aria-label="Main">
      <div className="navbar-inner">
        <Brand to="/home" />

        <button
          className="navbar-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>

        <div id="navbar-menu" className={menuOpen ? "navbar-menu is-open" : "navbar-menu"}>
          <div className="navbar-links">
            <NavLink to="/home" onClick={closeMenu}>Home</NavLink>
            <NavLink to="/products" onClick={closeMenu}>Products</NavLink>
            <NavLink to="/wishlist" onClick={closeMenu}>Wishlist</NavLink>
            <NavLink to="/cart" onClick={closeMenu} aria-label={`Cart, ${cartCount} items`}>
              {/* one wrapper so the link (a flex container) keeps "Cart (3)" as a single text run;
                  the count is keyed so it re-animates whenever it changes */}
              <span>
                Cart (<span key={cartCount} className="nav-cart-count">{cartCount}</span>)
              </span>
            </NavLink>
            <NavLink to="/orders" onClick={closeMenu}>Orders</NavLink>
          </div>
          <button className="btn btn-outline btn-sm navbar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
