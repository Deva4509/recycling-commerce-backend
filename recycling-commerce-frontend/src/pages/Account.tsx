import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import "./Account.css";

type AccountSection = "overview" | "profile" | "wishlist";

export default function Account() {
  const { user, logout, updateProfile, uploadProfilePhoto } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [section, setSection] = useState<AccountSection>("overview");
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

          <Link to="/contact" className="gc-account-help-link">
            <CircleHelp size={17} />
            <span>Need help?</span>
            <ArrowRight size={15} />
          </Link>
        </header>

        <div className="gc-account-layout">
          <aside className="gc-account-sidebar">
            <section className="gc-account-identity">
              <div className="gc-account-avatar-wrap">
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

              <NavLink
                to="/account/orders"
                className={({ isActive }) =>
                  `gc-account-nav-item${isActive ? " active" : ""}`
                }
              >
                <Package size={18} />
                <span>My orders</span>
                <ChevronRight className="gc-account-nav-chevron" size={15} />
              </NavLink>

              <button type="button" onClick={() => setSection("wishlist")} className={`gc-account-nav-item${section === "wishlist" ? " active" : ""}`}>

                <Heart size={18} />
                <span>Wishlist</span>
                <span className="gc-account-nav-count">{validWishlistProducts.length}</span>
              </button>

              <Link to="/contact" className="gc-account-nav-item">
                <CircleHelp size={18} />
                <span>Help & support</span>
                <ChevronRight className="gc-account-nav-chevron" size={15} />
              </Link>

              <Link to="/privacy" className="gc-account-nav-item">
                <ShieldCheck size={18} />
                <span>Privacy & data</span>
                <ChevronRight className="gc-account-nav-chevron" size={15} />
              </Link>
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

                    <Link to="/account/orders" className="gc-account-shortcut">
                      <span className="gc-account-shortcut-icon">
                        <Package size={18} />
                      </span>
                      <span>
                        <strong>Order centre</strong>
                        <small>Track your purchases</small>
                      </span>
                      <ChevronRight size={17} />
                    </Link>

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

                    <Link to="/contact" className="gc-account-shortcut">
                      <span className="gc-account-shortcut-icon">
                        <CircleHelp size={18} />
                      </span>
                      <span>
                        <strong>Customer support</strong>
                        <small>We're here to help</small>
                      </span>
                      <ChevronRight size={17} />
                    </Link>

                    <Link to="/privacy" className="gc-account-shortcut">
                      <span className="gc-account-shortcut-icon">
                        <LockKeyhole size={18} />
                      </span>
                      <span>
                        <strong>Privacy & security</strong>
                        <small>Review your privacy information</small>
                      </span>
                      <ChevronRight size={17} />
                    </Link>
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
