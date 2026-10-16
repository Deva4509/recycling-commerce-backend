import { FormEvent, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Heart,
  Leaf,
  LockKeyhole,
  LogOut,
  Package,
  Recycle,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  ShoppingBag,
  Search,
  Mail,
  Clock3,
  Send
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import PrivacyCenter from "./PrivacyCenter";
import { request, getMyOrders, getOrder, getOrderShipment, getProduct, type ApiOrderSummary } from "../lib/api";
import "./Account.css";

type AccountSection = "overview" | "profile" | "wishlist" | "privacy" | "help" | "orders";

export default function Account() {
  const [searchParams] = useSearchParams();
  const { user, logout, updateProfile, uploadProfilePhoto } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [section, setSection] = useState<AccountSection>(() => searchParams.get("section") === "orders" ? "orders" : "overview");
  const { addToCart } = useCart();
  const [wishlistProducts, setWishlistProducts] = useState<import("../lib/api").ApiProduct[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const validWishlistProducts = wishlistProducts.filter((product) => favorites.includes(String(product.id)));
  useEffect(() => {
    if (section !== "wishlist") return;
    let active = true;
    setWishlistLoading(true);
    setWishlistError("");
    import("../lib/api").then(({ getProducts }) => getProducts())
      .then((products) => { if (active) setWishlistProducts(products); })
      .catch(() => { if (active) setWishlistError("Could not load products. Please try again."); })
      .finally(() => { if (active) setWishlistLoading(false); });
    return () => { active = false; };
  }, [section]);
  const [showProfileNotice, setShowProfileNotice] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [countryCode, setCountryCode] = useState(
    user?.phone_country_code ?? "+91",
  );
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.date_of_birth ?? "",
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");



  useEffect(() => {
    setFirstName(user?.first_name ?? user?.name.split(" ")[0] ?? "");
    setLastName(
      user?.last_name ??
        user?.name.split(" ").slice(1).join(" ") ??
        "",
    );
    setCountryCode(user?.phone_country_code ?? "+91");
    setPhoneNumber(user?.phone ?? "");
    setDateOfBirth(user?.date_of_birth ?? "");
  }, [user]);

  const name = user?.name || user?.email?.split("@")[0] || "GreenCore Member";
  const email = user?.email || "Email not available";

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const menuItems = [
    { id: "overview" as const, label: "Account overview", icon: Sparkles },
    { id: "profile" as const, label: "Personal information", icon: UserRound },
  ];

  return (
    <main className="gc-account">
      <div className="gc-account-atmosphere" aria-hidden="true" />

      <div className="gc-account-container">
        <div className="gc-account-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>My account</span>
        </div>

        <header className="gc-account-page-heading">
          <div>
            <span className="gc-account-overline">
              <span className="gc-account-live-dot" />
              YOUR PERSONAL SPACE
            </span>
            <h1>Your account<span>.</span></h1>
            <p>
              Everything you need to manage your GreenCore journey, all in one
              place.
            </p>
          </div>

          <button type="button" onClick={() => setSection("help")} className="gc-account-help-link">
            <CircleHelp size={17} />
            <span>Need help?</span>
            <ArrowRight size={15} />
          </button>
        </header>

        <div className="gc-account-layout">
          <aside className="gc-account-sidebar">
            <section className="gc-account-identity">
              <div className="gc-account-avatar-wrap gc-account-avatar-editable">
                <div className="gc-account-avatar">
                  {user?.profile_photo_url ? (
                    <img
                      src={user.profile_photo_url}
                      alt={`${name}'s profile`}
                    />
                  ) : (
                    initials || <UserRound size={29} />
                  )}
                </div>
                <label className="gc-account-avatar-edit" title="Change profile photo">
                  <span>Edit</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={photoUploading}
                    aria-label="Change profile photo"
                    onChange={async (event) => {
                      const input = event.currentTarget;
                      const file = input.files?.[0];
                      input.value = "";
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setPhotoMessage("Choose an image under 5 MB.");
                        return;
                      }
                      setPhotoMessage("");
                      setPhotoUploading(true);
                      const result = await uploadProfilePhoto(file);
                      setPhotoUploading(false);
                      setPhotoMessage(
                        result.success ? "Profile photo updated." :
                        result.error || "Upload failed."
                      );
                    }}
                  />
                </label>
                <span className="gc-account-avatar-status" />
              </div>

              <div className="gc-account-identity-copy">
                <span className="gc-account-muted-label">WELCOME BACK</span>
                <h2>{name}</h2>
                <p title={email}>{email}</p>
              </div>

              <div className="gc-account-member-badge">
                <Leaf size={14} />
                GreenCore member
              </div>
            </section>

            <div className="gc-account-sidebar-divider" />

            <nav className="gc-account-side-nav" aria-label="Account navigation">
              <span className="gc-account-nav-caption">YOUR ACCOUNT</span>

              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`gc-account-nav-item${active ? " active" : ""}`}
                    onClick={() => {
                      setSection(item.id);
                      setShowProfileNotice(false);
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {active && <span className="gc-account-nav-indicator" />}
                  </button>
                );
              })}

              <span className="gc-account-nav-caption gc-account-nav-caption-spaced">
                SHOPPING & SERVICES
              </span>

              <button
                type="button"
                onClick={() => setSection("orders")}
                className={`gc-account-nav-item${section === "orders" ? " active" : ""}`}
                aria-current={section === "orders" ? "page" : undefined}
              >
                <Package size={18} />
                <span>My orders</span>
                {section === "orders" ? <span className="gc-account-nav-indicator" /> : <ChevronRight className="gc-account-nav-chevron" size={15} />}
              </button>

              <button type="button" onClick={() => setSection("wishlist")} className={`gc-account-nav-item${section === "wishlist" ? " active" : ""}`}>

                <Heart size={18} />
                <span>Wishlist</span>
                <span className="gc-account-nav-count">{validWishlistProducts.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setSection("help")}
                className={`gc-account-nav-item${section === "help" ? " active" : ""}`}
                aria-current={section === "help" ? "page" : undefined}
              >
                <CircleHelp size={18} />
                <span>Help & support</span>
                {section === "help" && <span className="gc-account-nav-indicator" />}
                {section !== "help" && <ChevronRight className="gc-account-nav-chevron" size={15} />}
              </button>

              <button
                type="button"
                onClick={() => setSection("privacy")}
                className={`gc-account-nav-item${section === "privacy" ? " active" : ""}`}
                aria-current={section === "privacy" ? "page" : undefined}
              >
                <ShieldCheck size={18} />
                <span>Privacy & data</span>
                {section === "privacy" && <span className="gc-account-nav-indicator" />}
                {section !== "privacy" && <ChevronRight className="gc-account-nav-chevron" size={15} />}
              </button>
            </nav>

            <div className="gc-account-sidebar-bottom">
              <div className="gc-account-sidebar-leaf">
                <Leaf size={19} />
              </div>
              <div>
                <strong>Live a little greener.</strong>
                <p>Every thoughtful choice matters.</p>
              </div>
              <Link to="/shop" aria-label="Explore GreenCore products">
                <ArrowRight size={17} />
              </Link>
            </div>

            <button
              type="button"
              className="gc-account-logout"
              onClick={logout}
            >
              <LogOut size={17} />
              Sign out of GreenCore
            </button>
          </aside>

          <section className="gc-account-main">
            {section === "overview" && (
              <>
                <section className="gc-account-welcome">
                  <div className="gc-account-welcome-copy">
                    <span className="gc-account-welcome-tag">
                      <Sparkles size={14} />
                      YOUR GREEN JOURNEY
                    </span>
                    <h2>A better tomorrow<br />starts with <span>you.</span></h2>
                    <p>
                      Manage your account, revisit your favourite finds and
                      discover products that give materials a second life.
                    </p>
                    <Link to="/shop" className="gc-account-primary-link">
                      Explore products <ArrowRight size={17} />
                    </Link>
                  </div>

                  <div className="gc-account-welcome-art" aria-hidden="true">
                    <div className="gc-account-art-orbit gc-account-art-orbit-one" />
                    <div className="gc-account-art-orbit gc-account-art-orbit-two" />
                    <div className="gc-account-art-planet">
                      <GlobeArtwork />
                    </div>
                    <Leaf className="gc-account-art-leaf leaf-a" size={46} />
                    <Leaf className="gc-account-art-leaf leaf-b" size={31} />
                    <Sparkles className="gc-account-art-sparkle" size={22} />
                  </div>

                  <div className="gc-account-welcome-index">GREENCORE / 01</div>
                </section>

                <div className="gc-account-section-title">
                  <div>
                    <span className="gc-account-overline">YOUR DASHBOARD</span>
                    <h2>Your account at a glance</h2>
                  </div>
                  <span className="gc-account-section-note">
                    <CheckCircle2 size={15} />
                    Account overview
                  </span>
                </div>

                <div className="gc-account-stat-grid">
                  <Link
                    to="/account/orders"
                    className="gc-account-stat-card stat-orders"
                  >
                    <div className="gc-account-stat-top">
                      <span className="gc-account-stat-icon">
                        <Package size={20} />
                      </span>
                      <ArrowDownRight size={18} />
                    </div>
                    <span className="gc-account-stat-value">Orders</span>
                    <span className="gc-account-stat-label">
                      View purchases and order details
                    </span>
                    <span className="gc-account-stat-bottom">
                      Open order centre <ArrowRight size={14} />
                    </span>
                  </Link>

                  <Link
                    to="/shop"
                    className="gc-account-stat-card stat-wishlist"
                  >
                    <div className="gc-account-stat-top">
                      <span className="gc-account-stat-icon">
                        <Heart size={20} />
                      </span>
                      <ArrowDownRight size={18} />
                    </div>
                    <span className="gc-account-stat-value">
                      {validWishlistProducts.length}
                    </span>
                    <span className="gc-account-stat-label">
                      Products in your wishlist
                    </span>
                    <span className="gc-account-stat-bottom">
                      Explore saved products <ArrowRight size={14} />
                    </span>
                  </Link>

                  <button
                    type="button"
                    className="gc-account-stat-card stat-profile"
                    onClick={() => setSection("profile")}
                  >
                    <div className="gc-account-stat-top">
                      <span className="gc-account-stat-icon">
                        <UserRound size={20} />
                      </span>
                      <ArrowDownRight size={18} />
                    </div>
                    <span className="gc-account-stat-value">Profile</span>
                    <span className="gc-account-stat-label">
                      Your personal account information
                    </span>
                    <span className="gc-account-stat-bottom">
                      View information <ArrowRight size={14} />
                    </span>
                  </button>

                  <Link
                    to="/vision-mission"
                    className="gc-account-stat-card stat-impact"
                  >
                    <div className="gc-account-stat-top">
                      <span className="gc-account-stat-icon">
                        <Recycle size={20} />
                      </span>
                      <ArrowDownRight size={18} />
                    </div>
                    <span className="gc-account-stat-value">Go green</span>
                    <span className="gc-account-stat-label">
                      Discover our sustainability mission
                    </span>
                    <span className="gc-account-stat-bottom">
                      Learn about our mission <ArrowRight size={14} />
                    </span>
                  </Link>
                </div>

                <div className="gc-account-content-grid">
                  <section className="gc-account-content-card gc-account-personal-card">
                    <div className="gc-account-card-heading">
                      <div className="gc-account-card-heading-icon">
                        <UserRound size={19} />
                      </div>
                      <div>
                        <span className="gc-account-overline">YOUR DETAILS</span>
                        <h3>Personal information</h3>
                      </div>
                      <button
                        type="button"
                        className="gc-account-text-action"
                        onClick={() => setSection("profile")}
                      >
                        View all <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className="gc-account-detail-row">
                      <span className="gc-account-detail-icon">
                        <UserRound size={17} />
                      </span>
                      <div>
                        <span>FULL NAME</span>
                        <strong>{name}</strong>
                      </div>
                    </div>

                    <div className="gc-account-detail-row">
                      <span className="gc-account-detail-icon">
                        <Bell size={17} />
                      </span>
                      <div>
                        <span>EMAIL ADDRESS</span>
                        <strong className="gc-account-email">{email}</strong>
                      </div>
                      <CheckCircle2
                        className="gc-account-detail-status"
                        size={17}
                      />
                    </div>

                    <div className="gc-account-detail-row">
                      <span className="gc-account-detail-icon">
                        <ShieldCheck size={17} />
                      </span>
                      <div>
                        <span>ACCOUNT STATUS</span>
                        <strong className="gc-account-active-label">
                          <i /> Signed in
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="gc-account-content-card gc-account-shortcuts-card">
                    <div className="gc-account-card-heading">
                      <div className="gc-account-card-heading-icon">
                        <Sparkles size={19} />
                      </div>
                      <div>
                        <span className="gc-account-overline">QUICK ACCESS</span>
                        <h3>Made for you</h3>
                      </div>
                    </div>

                    <button type="button" onClick={() => setSection("orders")} className="gc-account-shortcut">
                      <span className="gc-account-shortcut-icon">
                        <Package size={18} />
                      </span>
                      <span>
                        <strong>Order centre</strong>
                        <small>Track your purchases</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>

                    <button type="button" onClick={() => setSection("wishlist")} className="gc-account-shortcut gc-account-wishlist-shortcut">
                      <span className="gc-account-shortcut-icon">
                        <Heart size={18} />
                      </span>
                      <span>
                        <strong>Your wishlist</strong>
                        <small>{validWishlistProducts.length} saved products</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>

                    <button type="button" onClick={() => setSection("help")} className="gc-account-shortcut">
                      <span className="gc-account-shortcut-icon">
                        <CircleHelp size={18} />
                      </span>
                      <span>
                        <strong>Customer support</strong>
                        <small>We're here to help</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>

                    <button type="button" onClick={() => setSection("privacy")} className="gc-account-shortcut">
                      <span className="gc-account-shortcut-icon">
                        <LockKeyhole size={18} />
                      </span>
                      <span>
                        <strong>Privacy & security</strong>
                        <small>Review your privacy information</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  </section>
                </div>

                <section className="gc-account-impact-banner">
                  <div className="gc-account-impact-symbol">
                    <Leaf size={30} />
                  </div>
                  <div className="gc-account-impact-copy">
                    <span className="gc-account-overline">A GREENER TOMORROW</span>
                    <h3>Good choices deserve a second life.</h3>
                    <p>
                      Discover recycled and responsibly repurposed products
                      from GreenCore.
                    </p>
                  </div>
                  <Link to="/shop" className="gc-account-impact-link">
                    Shop sustainably <ArrowRight size={16} />
                  </Link>
                </section>
              </>
            )}

            {section === "wishlist" && (
              <section className="gc-account-content-card gc-account-expanded-section gc-wishlist-premium">
                <header className="gc-wishlist-hero">
                  <div className="gc-wishlist-leaf-decoration gc-wishlist-leaf-one" />
                  <div className="gc-wishlist-leaf-decoration gc-wishlist-leaf-two" />
                  <div className="gc-wishlist-heading">
                    <div className="gc-wishlist-main-icon"><Heart size={36} /></div>
                    <div>
                      <span className="gc-account-overline">YOUR SAVED COLLECTION</span>
                      <h2>Wishlist<span className="gc-wishlist-title-dot">.</span></h2>
                      <p>A saved collection of products you may want to buy later.</p>
                    </div>
                  </div>
                  <div className="gc-wishlist-benefits">
                    <div className="gc-wishlist-benefit">
                      <span className="gc-wishlist-benefit-icon"><Heart size={21} /></span>
                      <span><strong>Save products</strong><small>Keep your favourites in one place</small></span>
                    </div>
                    <div className="gc-wishlist-benefit">
                      <span className="gc-wishlist-benefit-icon"><ShoppingBag size={21} /></span>
                      <span><strong>Add to cart anytime</strong><small>Move them to cart with one click</small></span>
                    </div>
                    <div className="gc-wishlist-benefit">
                      <span className="gc-wishlist-benefit-icon gc-wishlist-tag-icon">%</span>
                      <span><strong>Discover great finds</strong><small>Keep the products you love close</small></span>
                    </div>
                    <div className="gc-wishlist-benefit">
                      <span className="gc-wishlist-benefit-icon gc-wishlist-share-icon">↗</span>
                      <span><strong>Share the joy</strong><small>Find thoughtful gifts for others</small></span>
                    </div>
                  </div>
                </header>

                {wishlistLoading && (
                  <div className="gc-wishlist-loading">
                    <span className="gc-wishlist-spinner" />
                    <p>Gathering your saved collection…</p>
                  </div>
                )}

                {wishlistError && <p className="gc-wishlist-error" role="alert">{wishlistError}</p>}

                {!wishlistLoading && !wishlistError && validWishlistProducts.length === 0 && (
                  <div className="gc-wishlist-empty-premium">
                    <div className="gc-wishlist-orbit gc-wishlist-orbit-one" />
                    <div className="gc-wishlist-orbit gc-wishlist-orbit-two" />
                    <div className="gc-wishlist-empty-art" aria-hidden="true">
                      <div className="gc-wishlist-art-leaf gc-wishlist-art-leaf-left"><Leaf size={48} /></div>
                      <div className="gc-wishlist-art-leaf gc-wishlist-art-leaf-right"><Leaf size={40} /></div>
                      <div className="gc-wishlist-shopping-bag">
                        <div className="gc-wishlist-bag-handle" />
                        <Heart size={58} strokeWidth={1.5} />
                      </div>
                      <span className="gc-wishlist-art-spark gc-wishlist-spark-one">✦</span>
                      <span className="gc-wishlist-art-spark gc-wishlist-spark-two">✧</span>
                      <span className="gc-wishlist-art-spark gc-wishlist-spark-three">·</span>
                    </div>
                    <div className="gc-wishlist-empty-copy">
                      <span className="gc-wishlist-eyebrow"><span>✦</span> YOUR WISHLIST IS WAITING</span>
                      <h3>Save products <span>you’ll love</span></h3>
                      <p>Browse the shop and add your favourite products to keep them here. You can add them to cart later and build a collection of thoughtful, sustainable finds.</p>
                      <div className="gc-wishlist-empty-actions">
                        <Link to="/shop" className="gc-wishlist-explore-button">
                          <ShoppingBag size={18} /> Explore products <ArrowRight size={19} />
                        </Link>
                        <Link to="/shop" className="gc-wishlist-secondary-button">
                          Discover the shop <ArrowRight size={17} />
                        </Link>
                      </div>
                    </div>
                    <div className="gc-wishlist-bottom-benefits">
                      <div><span><Heart size={23} /></span><p><strong>Curate your collection</strong><small>Save items you like from the shop</small></p></div>
                      <div><span className="gc-wishlist-benefit-letter">✓</span><p><strong>Shop thoughtfully</strong><small>Return to favourites whenever you like</small></p></div>
                      <div><span className="gc-wishlist-benefit-letter">↗</span><p><strong>Share the joy</strong><small>Find meaningful gifts for friends and family</small></p></div>
                    </div>
                  </div>
                )}

                {!wishlistLoading && !wishlistError && validWishlistProducts.length > 0 && (
                  <div className="gc-wishlist-products-area">
                    <div className="gc-wishlist-products-heading">
                      <div>
                        <span className="gc-account-overline">YOUR FAVOURITES</span>
                        <h3>Your collection <span>({validWishlistProducts.length})</span></h3>
                      </div>
                      <Link to="/shop" className="gc-wishlist-continue-link">Discover more <ArrowRight size={16} /></Link>
                    </div>
                    <div className="gc-account-wishlist-grid">
                      {validWishlistProducts.map((product) => {
                        const image = [...(product.images ?? [])].sort(
                          (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
                        )[0];
                        return (
                          <article className="gc-account-wishlist-card" key={product.id}>
                            <Link to={`/product/${product.slug}`} className="gc-account-wishlist-image">
                              {image?.image_url ? <img src={image.image_url} alt={image.alt_text || product.name} loading="lazy" /> : <Leaf size={42} />}
                              <span className="gc-wishlist-saved-label"><Heart size={12} fill="currentColor" /> SAVED</span>
                            </Link>
                            <div className="gc-account-wishlist-card-body">
                              <Link to={`/product/${product.slug}`} className="gc-account-wishlist-title">{product.name}</Link>
                              <strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency || "INR", maximumFractionDigits: 0 }).format(Number(product.base_price ?? product.price ?? 0))}</strong>
                              <span className="gc-account-wishlist-stock">Inventory status shown when available</span>
                              <div className="gc-account-wishlist-actions">
                                <button type="button" onClick={() => addToCart(product as import("../types/catalog").Product, 1)}>
                                  <ShoppingBag size={14} /> Add to Cart
                                </button>
                                <button type="button" aria-label={`Remove ${product.name} from wishlist`} onClick={() => toggleFavorite(String(product.id))}>
                                  <X size={14} /> Remove
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {section === "help" && <HelpSupportPanel user={user} />}

            {section === "orders" && <AccountOrdersPanel userId={user?.id ?? ""} />}

            {section === "privacy" && (
              <section className="gc-account-content-card gc-account-expanded-section gc-account-privacy-section">
                <div className="gc-account-card-heading">
                  <div className="gc-account-card-heading-icon">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <span className="gc-account-overline">ACCOUNT SECURITY</span>
                    <h3>Privacy & Data</h3>
                    <p>Manage your security, communication preferences, and personal data.</p>
                  </div>
                </div>
                <PrivacyCenter />
              </section>
            )}

            {section === "profile" && (
              <section className="gc-account-content-card gc-account-expanded-section">
                <div className="gc-account-card-heading">
                  <div className="gc-account-card-heading-icon">
                    <UserRound size={20} />
                  </div>
                  <div>
                    <span className="gc-account-overline">ACCOUNT SETTINGS</span>
                    <h3>Personal information</h3>
                  </div>
                </div>

                <div className="gc-account-profile-banner">
                  <div className="gc-account-avatar gc-account-avatar-large gc-account-photo-avatar">
                    {user?.profile_photo_url ? (
                      <img
                        src={user.profile_photo_url}
                        alt="Your profile"
                      />
                    ) : (
                      initials || <UserRound size={30} />
                    )}
                  </div>
                  <div className="gc-account-photo-copy">
                    <h4>{name}</h4>
                    <p>Personalise your GreenCore account</p>
                    <label className="gc-account-photo-button">
                      {photoUploading ? "Uploading…" : "Change photo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={photoUploading}
                        onChange={async (event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = "";
                          if (!file) return;

                          setProfileMessage("");
                          setProfileError("");

                          if (file.size > 5 * 1024 * 1024) {
                            setProfileError("Choose an image no larger than 5 MB.");
                            return;
                          }

                          setPhotoUploading(true);
                          const result = await uploadProfilePhoto(file);
                          setPhotoUploading(false);

                          if (result.success) {
                            setProfileMessage("Profile photo updated.");
                          } else {
                            setProfileError(result.error ?? "Photo upload failed.");
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="gc-account-status-pill">
                    <CheckCircle2 size={14} /> Signed in
                  </span>
                </div>

                <form
                  className="gc-account-profile-form"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setProfileMessage("");
                    setProfileError("");

                    if (!firstName.trim() || !lastName.trim()) {
                      setProfileError("Enter both your first name and last name.");
                      return;
                    }

                    setProfileSaving(true);
                    const result = await updateProfile({
                      first_name: firstName.trim(),
                      last_name: lastName.trim(),
                      phone: phoneNumber.trim() || null,
                      phone_country_code: phoneNumber.trim()
                        ? countryCode
                        : null,
                      date_of_birth: dateOfBirth || null,
                    });
                    setProfileSaving(false);

                    if (result.success) {
                      setProfileMessage("Your personal information has been saved.");
                    } else {
                      setProfileError(result.error ?? "Unable to save your profile.");
                    }
                  }}
                >
                  <div className="gc-account-form-grid">
                    <div className="gc-account-edit-field">
                      <label htmlFor="gc-profile-first-name">First name</label>
                      <input
                        id="gc-profile-first-name"
                        name="first_name"
                        autoComplete="given-name"
                        maxLength={100}
                        required
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                      />
                    </div>

                    <div className="gc-account-edit-field">
                      <label htmlFor="gc-profile-last-name">Last name</label>
                      <input
                        id="gc-profile-last-name"
                        name="last_name"
                        autoComplete="family-name"
                        maxLength={100}
                        required
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                      />
                    </div>

                    <div className="gc-account-edit-field gc-account-email-field">
                      <label htmlFor="gc-profile-email">Email address</label>
                      <input
                        id="gc-profile-email"
                        type="email"
                        value={email}
                        readOnly
                        aria-describedby="gc-profile-email-status"
                      />
                      <span
                        id="gc-profile-email-status"
                        className={
                          user?.email_verified
                            ? "gc-account-verification gc-account-verification-verified"
                            : "gc-account-verification"
                        }
                      >
                        <ShieldCheck size={14} />
                        {user?.email_verified ? "Verified" : "Not verified"}
                      </span>
                      <small>Email cannot be changed from this page.</small>
                    </div>

                    <div className="gc-account-edit-field">
                      <label htmlFor="gc-profile-phone">Phone number</label>
                      <div className="gc-account-phone-control">
                        <select
                          aria-label="Country calling code"
                          value={countryCode}
                          onChange={(event) => setCountryCode(event.target.value)}
                        >
                          <option value="+91">India (+91)</option>
                          <option value="+1">United States/Canada (+1)</option>
                          <option value="+44">United Kingdom (+44)</option>
                          <option value="+61">Australia (+61)</option>
                          <option value="+971">UAE (+971)</option>
                        </select>
                        <input
                          id="gc-profile-phone"
                          type="tel"
                          name="phone"
                          autoComplete="tel-national"
                          maxLength={30}
                          placeholder="Enter phone number"
                          value={phoneNumber}
                          onChange={(event) => setPhoneNumber(event.target.value)}
                        />
                      </div>
                      <small>Phone verification is not enabled yet.</small>
                    </div>

                    <div className="gc-account-edit-field">
                      <label htmlFor="gc-profile-dob">Date of birth (optional)</label>
                      <input
                        id="gc-profile-dob"
                        type="date"
                        name="date_of_birth"
                        autoComplete="bday"
                        max={new Date().toISOString().slice(0, 10)}
                        value={dateOfBirth}
                        onChange={(event) => setDateOfBirth(event.target.value)}
                      />
                    </div>
                  </div>

                  {profileError && (
                    <p className="gc-account-form-feedback gc-account-form-error" role="alert">
                      {profileError}
                    </p>
                  )}
                  {profileMessage && (
                    <p className="gc-account-form-feedback gc-account-form-success" role="status">
                      {profileMessage}
                    </p>
                  )}

                  <div className="gc-account-profile-actions">
                    <button
                      type="submit"
                      className="gc-account-primary-link"
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving…" : "Save changes"}
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      className="gc-account-secondary-button"
                      onClick={() => setSection("overview")}
                    >
                      Return to overview
                    </button>
                  </div>
                </form>
              </section>
            )}

            {showProfileNotice && (
              <div className="gc-account-modal-backdrop" role="presentation">
                <section
                  className="gc-account-notice-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="gc-account-notice-title"
                >
                  <button
                    type="button"
                    className="gc-account-modal-close"
                    onClick={() => setShowProfileNotice(false)}
                    aria-label="Close message"
                  >
                    <X size={18} />
                  </button>
                  <span className="gc-account-modal-icon">
                    <UserRound size={24} />
                  </span>
                  <h3 id="gc-account-notice-title">Profile editing</h3>
                  <p>
                    Your current profile information is displayed here. Saving
                    profile changes requires a profile-update API.
                  </p>
                  <button
                    type="button"
                    className="gc-account-primary-link"
                    onClick={() => {
                      setShowProfileNotice(false);
                      setSection("profile");
                    }}
                  >
                    View profile <ArrowRight size={16} />
                  </button>
                </section>
              </div>
            )}
          </section>
        </div>

        <footer className="gc-account-brand-note">
          <span><Leaf size={16} /></span>
          <strong>GreenCore</strong>
          <i />
          <span>A Vidyagyan Initiative</span>
          <span className="gc-account-brand-right">
            Officially approved and led by Vidyagyan
          </span>
        </footer>
      </div>
    </main>
  );
}

function GlobeArtwork() {
  return (
    <div className="gc-account-globe">
      <div className="gc-account-globe-latitude latitude-one" />
      <div className="gc-account-globe-latitude latitude-two" />
      <div className="gc-account-globe-longitude longitude-one" />
      <div className="gc-account-globe-longitude longitude-two" />
      <Leaf className="gc-account-globe-leaf" size={47} />
    </div>
  );
}


const helpFaqs = [
  { category: "Shipping", question: "Where is my order?", answer: "Open My orders in your account to review available order details. Contact support if you need clarification." },
  { category: "Shipping", question: "How long does delivery take?", answer: "Delivery timing depends on the product and destination. Check your order confirmation for the available details." },
  { category: "Returns", question: "How do I request a return?", answer: "Send GreenCore a message with your order reference and the reason for your request. The team can review the applicable return conditions." },
  { category: "Refunds", question: "When will my refund arrive?", answer: "Refund timing depends on order review and the payment provider. Contact support with your order reference for assistance." },
  { category: "Account", question: "How do I update my profile?", answer: "Choose Personal information in the account sidebar to manage the profile fields available to you." },
  { category: "Account", question: "I cannot sign in. What should I do?", answer: "Try the available sign-in recovery options. If you still need help, send a message using the form below." },
];


function HelpSupportPanel({ user }: { user: { name?: string | null; email?: string | null } | null }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const categories = ["All", "Shipping", "Returns", "Refunds", "Account"];
  const faqs = helpFaqs.filter((item) =>
    (category === "All" || item.category === category) &&
    `${item.category} ${item.question} ${item.answer}`.toLowerCase().includes(query.toLowerCase())
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setError("");
    try {
      await request<{ message: string }>("/contact", {
        method: "POST",
        body: JSON.stringify({
          name: String(data.get("name") || ""),
          email: String(data.get("email") || ""),
          phone: String(data.get("phone") || "") || null,
          subject: String(data.get("subject") || "other"),
          message: String(data.get("message") || ""),
        }),
      });
      form.reset();
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send your message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="gc-help-page">
      <section className="gc-help-hero">
        <div className="gc-help-hero-copy">
          <span className="gc-account-overline">WE'RE HERE TO HELP</span>
          <h2>Help &amp; <em>Support</em></h2>
          <p>Find answers, get guidance, or send a message to the GreenCore support team. We're here to make your experience smooth and sustainable.</p>
          <div className="gc-help-hero-tags"><span>Account assistance</span><span>Order guidance</span><span>Customer care</span></div>
        </div>
        <div className="gc-help-hero-art" aria-hidden="true"><span className="gc-help-orbit">?</span><span className="gc-help-headset"><CircleHelp size={54} /></span><span className="gc-help-art-leaf">✦</span></div>
      </section>

      <div className="gc-help-contact-cards">
        <article className="gc-help-contact-card">
          <span className="gc-help-card-icon"><CircleHelp size={21} /></span>
          <h3>Help centre</h3><p>Find quick answers to common questions.</p>
          <a href="#gc-help-faqs">Browse FAQs <ArrowRight size={15} /></a>
        </article>
        <article className="gc-help-contact-card">
          <span className="gc-help-card-icon"><Mail size={21} /></span>
          <h3>Email support</h3><p>Send a message to our team using the form below.</p>
          <a href="#gc-help-contact-form">Send a message <ArrowRight size={15} /></a>
        </article>
        <article className="gc-help-contact-card">
          <span className="gc-help-card-icon"><Clock3 size={21} /></span>
          <h3>Support requests</h3><p>Submit an enquiry and receive confirmation when it is accepted.</p>
          <a href="#gc-help-contact-form">Contact us <ArrowRight size={15} /></a>
        </article>
      </div>

      <section className="gc-help-section" id="gc-help-faqs">
        <div className="gc-help-section-heading">
          <span className="gc-help-card-icon"><Search size={20} /></span>
          <div><span className="gc-account-overline">FIND QUICK ANSWERS</span><h3>Frequently asked questions</h3><p>Search topics about shipping, returns, refunds, and account issues.</p></div>
        </div>
        <label className="gc-help-search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search questions..." /></label>
        <div className="gc-help-filters">{categories.map(item => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setOpenFaq(null); }}>{item}</button>)}</div>
        <div className="gc-help-faq-list">
          {faqs.map(item => {
            const index = helpFaqs.indexOf(item);
            const expanded = openFaq === index;
            return <article className={`gc-help-faq-item${expanded ? " is-open" : ""}`} key={item.question}>
              <button type="button" aria-expanded={expanded} onClick={() => setOpenFaq(expanded ? null : index)}>
                <span className="gc-help-faq-mark"><CheckCircle2 size={18} /></span>
                <span className="gc-help-faq-question"><small>{item.category}</small><strong>{item.question}</strong></span>
                <ChevronRight size={18} />
              </button>
              {expanded && <p>{item.answer}</p>}
            </article>;
          })}
          {!faqs.length && <p className="gc-help-muted">No matching questions. Try another search or category.</p>}
        </div>
      </section>

      <section className="gc-help-section gc-help-form-section" id="gc-help-contact-form">
        {sent ? (
          <div className="gc-help-success-panel">
            <div className="gc-help-success-symbol"><CheckCircle2 size={38} /></div>
            <span className="gc-account-overline">MESSAGE SENT</span>
            <h3>Thank you for contacting GreenCore!</h3>
            <p>Your message was submitted successfully. Our team can respond using the email address you provided.</p>
            <div className="gc-help-success-actions">
              <button type="button" onClick={() => setSent(false)}>Send another message <ArrowRight size={15} /></button>
              <button type="button" className="secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top</button>
            </div>
          </div>
        ) : (
          <>
            <div className="gc-help-section-heading">
              <span className="gc-help-card-icon"><Send size={20} /></span>
              <div><span className="gc-account-overline">CONTACT OUR TEAM</span><h3>Send us a message</h3><p>Fill in the form below and our team will get back to you as soon as possible.</p></div>
            </div>
            <form className="gc-help-form" onSubmit={submit}>
              <div className="gc-help-form-row">
                <label>Full name<input name="name" defaultValue={user?.name ?? ""} required maxLength={160} /></label>
                <label>Email address<input name="email" type="email" defaultValue={user?.email ?? ""} required maxLength={254} /></label>
              </div>
              <div className="gc-help-form-row">
                <label>Phone number (optional)<input name="phone" type="tel" placeholder="+91 XXXXX XXXXX" /></label>
                <label>Topic<select name="subject" defaultValue="other" required><option value="order">Order support</option><option value="product">Product question</option><option value="returns">Returns &amp; refunds</option><option value="partnership">Partnership</option><option value="recycling">Recycling enquiry</option><option value="other">Account or other issue</option></select></label>
              </div>
              <label>How can we help?<textarea name="message" rows={5} required maxLength={5000} placeholder="Describe your question or issue. Please do not include passwords or payment secrets." /></label>
              <div className="gc-help-info"><Mail size={17} /><span>Image attachments and ticket tracking are not available through the current contact service.</span></div>
              {error && <p className="gc-help-error" role="alert">{error}</p>}
              <button className="gc-help-submit" type="submit" disabled={sending}>{sending ? "Sending your message…" : "Send support message"} <Send size={16} /></button>
              <p className="gc-help-privacy-note"><ShieldCheck size={14} /> Your information is used to respond to your enquiry.</p>
            </form>
          </>
        )}
      </section>
    </div>
  );
}



function AccountOrdersPanel({
  userId,
}: { userId: string }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ApiOrderSummary[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [tracking, setTracking] = useState<Record<string, any>>({});
  const { addToCart } = useCart();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("Sign in to view your orders.");
      return;
    }
    let active = true;
    getMyOrders(userId)
      .then((data) => { if (active) setOrders(data); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Could not load orders."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const groups: Record<string, string[]> = {
    ALL: [],
    PROCESSING: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"],
    DELIVERED: ["DELIVERED"],
    CANCELLED: ["CANCELLED", "RETURNED", "REFUNDED"],
  };
  const filtered = orders.filter((o) => filter === "ALL" || groups[filter].includes((o.status || "PENDING").toUpperCase()));
  const money = (v: unknown, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(v || 0));
  const date = (v?: string) => v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable";
  const label = (v?: string) => (v || "PENDING").replaceAll("_", " ");

  async function loadDetails(id: string) {
    setBusy(id);
    setError("");
    try {
      const order = await getOrder(id);
      setDetails((prev) => ({ ...prev, [id]: order }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load order details.");
    } finally {
      setBusy(null);
    }
  }

  async function loadTracking(id: string) {
    setBusy(id);
    setNotice("");
    try {
      const shipment = await getOrderShipment(id);
      setTracking((prev) => ({ ...prev, [id]: shipment }));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Tracking information is not available for this order yet.");
    } finally {
      setBusy(null);
    }
  }

  async function reorder(id: string) {
    setBusy(id);
    setNotice("");
    try {
      const order = details[id] || await getOrder(id);
      setDetails((prev) => ({ ...prev, [id]: order }));
      if (!order.items?.length) {
        setNotice("This order has no available item details to reorder.");
        return;
      }
      const products = await Promise.allSettled(
        order.items.map((item: any) => getProduct(String(item.product_id)))
      );
      let added = 0;
      products.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value?.is_active) {
          addToCart(result.value as any, Math.max(1, Number(order.items[i].quantity || 1)));
          added++;
        }
      });
      setNotice(added ? `${added} product${added === 1 ? "" : "s"} added to your cart.` : "No items from this order are currently available to reorder.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to reorder this purchase.");
    } finally {
      setBusy(null);
    }
  }

  function printInvoice(order: any) {
    const win = window.open("", "_blank", "width=760,height=850");
    if (!win) {
      setNotice("Allow pop-ups to open the printable invoice.");
      return;
    }
    const rows = (order.items || []).map((item: any) =>
      `<tr><td>${String(item.product_id || "Product").replace(/[<>&"]/g, "")}</td><td>${Number(item.quantity || 1)}</td><td>${money(item.unit_price, order.currency)}</td><td>${money(item.total_price, order.currency)}</td></tr>`
    ).join("");
    win.document.write(`<!doctype html><html><head><title>GreenCore invoice</title><style>body{font:15px Arial;padding:36px;color:#183b2e}h1{color:#087d52}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;border-bottom:1px solid #d6e5dc;padding:12px}small{color:#527364}</style></head><body><h1>GreenCore</h1><small>A Vidyagyan Initiative</small><h2>Order invoice</h2><p>Order #${String(order.id).replace(/[<>&"]/g, "")}</p><p>Date: ${date(order.created_at)}</p><table><thead><tr><th>Product ID</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><h3>Total: ${money(order.total_amount, order.currency)}</h3><p>Thank you for supporting circular commerce.</p><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  }

  return (
    <section className="gc-account-content-card gc-account-expanded-section gc-account-orders-panel">
      <div className="gc-account-card-heading">
        <div className="gc-account-card-heading-icon"><Package size={21} /></div>
        <div><span className="gc-account-overline">YOUR PURCHASE HISTORY</span><h3>My Orders</h3><p>Track purchases, review order details and shop again.</p></div>
      </div>
      <div className="gc-orders-summary">
        <div><span>Total orders</span><strong>{orders.length}</strong></div>
        <div><span>In progress</span><strong>{orders.filter(o => groups.PROCESSING.includes((o.status || "PENDING").toUpperCase())).length}</strong></div>
        <div><span>Delivered</span><strong>{orders.filter(o => (o.status || "").toUpperCase() === "DELIVERED").length}</strong></div>
      </div>
      <div className="gc-orders-filters" role="group" aria-label="Filter orders">
        {[["ALL","All orders"],["PROCESSING","In progress"],["DELIVERED","Delivered"],["CANCELLED","Cancelled / returned"]].map(([value,text]) =>
          <button type="button" key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{text}</button>
        )}
      </div>
      {notice && <p className="gc-orders-notice" role="status">{notice}</p>}
      {error && <p className="gc-orders-error" role="alert">{error}</p>}
      {loading ? <div className="gc-orders-empty"><span className="gc-orders-spinner" /> Loading your orders…</div> :
        filtered.length === 0 ? <div className="gc-orders-empty"><Package size={34}/><h4>{orders.length ? "No orders in this category" : "Your journey starts here"}</h4><p>{orders.length ? "Choose another filter to see your purchases." : "Your purchases will appear here after you place an order."}</p><Link to="/shop">Explore products <ArrowRight size={15}/></Link></div> :
        <div className="gc-orders-list">{filtered.map(order => {
          const id = order.id;
          const detail = details[id];
          const status = (order.status || "PENDING").toUpperCase();
          return <article className="gc-orders-card" key={id}>
            <div className="gc-orders-card-top"><div><span className="gc-account-overline">ORDER REFERENCE</span><h4>#{id.slice(0, 12).toUpperCase()}</h4><small>Placed {date(order.created_at)}</small></div><span className={`gc-orders-status ${status.toLowerCase().replaceAll("_","-")}`}>{label(status)}</span></div>
            <div className="gc-orders-card-total"><span>Order total</span><strong>{money(order.total_amount, order.currency)}</strong></div>
            {detail && <div className="gc-orders-items">{(detail.items || []).map((item: any, i: number) => <div key={item.id || `${id}-${i}`}><span><Package size={15}/>{`Product ${String(item.product_id).slice(0, 10)} · Qty ${item.quantity}`}</span><strong>{money(item.total_price ?? item.unit_price, detail.currency)}</strong></div>)}</div>}
            {tracking[id] && <div className="gc-orders-tracking"><strong>Tracking information</strong><p>{tracking[id].carrier || "Carrier not specified"}{tracking[id].tracking_number ? ` · ${tracking[id].tracking_number}` : ""}</p><small>{label(tracking[id].status || "Tracking pending")}</small></div>}
            <div className="gc-orders-actions">
              <button type="button" onClick={() => detail ? setDetails(prev => { const next={...prev}; delete next[id]; return next; }) : loadDetails(id)} disabled={busy === id}>{detail ? "Hide details" : busy === id ? "Loading…" : "View details"}</button>
              <button type="button" onClick={() => navigate(`/account/orders/${encodeURIComponent(id)}?source=profile`)}>Track package</button>
              <button type="button" onClick={() => detail ? printInvoice(detail) : loadDetails(id).then(() => setNotice("Open order details, then select invoice after details load."))}>Print invoice</button>
              <button type="button" className="primary" onClick={() => reorder(id)} disabled={busy === id}>{busy === id ? "Please wait…" : "Buy again"}</button>
            </div>
          </article>;
        })}</div>
      }
      <p className="gc-orders-footnote">Tracking and product details appear when provided by the order and shipping services. Returns and reviews can be added when the corresponding workflows are available.</p>
    </section>
  );
}
