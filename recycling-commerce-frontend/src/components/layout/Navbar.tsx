import { FormEvent, useState } from "react";
import { siteBrand } from "../../config/brand";
import {
  ArrowRight,
  Calculator,
  ChevronDown,
  Menu,
  Leaf,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
const navItems = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Donate", to: "/donate" },
  { label: "Contact Us", to: "/contact" },
  { label: "Calculator", to: "/calculator" },
  { label: "Vision & Mission", to: "/vision-mission" },
  { label: "Gallery", to: "/gallery" },
  { label: "Vidyagyan", to: "/vidyagyan" },
  { label: "Orders", to: "/account/orders" },
];

export default function Navbar() {

  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = search.trim();

    if (value) {
      navigate(`/shop?search=${encodeURIComponent(value)}`);
    } else {
      navigate("/shop");
    }

    setSearchOpen(false);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="site-navbar">
      <div className="site-navbar-inner">
        <Link to="/" className="site-brand" onClick={closeMobile}>
          <span className="site-brand-mark">
            <Leaf size={19} strokeWidth={2.2} />
          </span>

          <span>
            Green<span>Core</span>
          </span>
        </Link>

        <nav className="site-nav">
          {navItems
              .filter((item) => item.to !== "/account/orders" || isAuthenticated)
              .map((item) => (
            <NavLink
              key={item.to}
              to={item.to} end={item.to === "/"}
              className={({ isActive }) =>
                `site-nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}

</nav>

        <div className="site-nav-actions">
          <button
            type="button"
            aria-label="Search"
            className={`nav-icon-button ${searchOpen ? "search-active" : ""}`}
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search size={18} />
          </button>

          <Link
            to="/cart"
            aria-label="Shopping cart"
            className="nav-icon-button nav-cart-button"
          >
            <ShoppingBag size={18} />
            <span className="nav-cart-count">{itemCount}</span>
          </Link>

          {isAuthenticated ? (
            <button
              type="button"
              className="nav-profile-avatar"
              onClick={() => navigate("/account")}
              aria-label="Open account"
              title={user?.name || "Account"}
            >
              {user?.profile_photo_url ? (
                <img
                  className="nav-profile-avatar-image"
                  src={user.profile_photo_url}
                  alt=""
                />
              ) : (
                user?.name?.trim()?.charAt(0)?.toUpperCase() || "U"
              )}
            </button>
          ) : (
            <Link
              to="/login"
              aria-label="Account"
              className="nav-profile-avatar nav-profile-login"
              title="Login"
            >
              <UserRound size={17} />
            </Link>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="nav-menu-button"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      <form className={`navbar-search ${searchOpen ? "open" : ""}`} onSubmit={submitSearch}>
        <Search size={17} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search recycled products..."
          aria-label="Search products"
          autoFocus={searchOpen}
        />
        <button type="submit">Search</button>
      </form>

      <div className={`mobile-nav ${mobileOpen ? "open" : ""}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to} end={item.to === "/"}
            onClick={closeMobile}
            className={({ isActive }) =>
              `mobile-nav-link ${isActive ? "active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <a
          href="/calculator"
          className="mobile-nav-link"
          onClick={closeMobile}
        >
          Calculator
        </a>

        {isAuthenticated ? (
          <>
            <button
              type="button"
              className="mobile-account-link"
              onClick={() => {
                closeMobile();
                navigate("/account");
              }}
            >
              <UserRound size={17} />
              {user?.name || "Account"}
            </button>

            <button
              type="button"
              className="mobile-account-link"
              onClick={() => {
                closeMobile();
                handleLogout();
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="mobile-account-link"
            onClick={closeMobile}
          >
            <UserRound size={17} />
            Account
          </Link>
        )}
      </div>
    </header>
  );
}
