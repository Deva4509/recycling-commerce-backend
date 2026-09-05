import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Recycle,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useCart } from "../context/CartContext";

function formatPrice(value: number | string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function getCategoryLabel(categoryId: string) {
  const labels: Record<string, string> = {
    c1: "RECYCLED COTTON",
    c2: "RECLAIMED WOOD",
    c3: "RECYCLED GLASS",
    c4: "UPCYCLED PAPER",
  };

  return labels[categoryId] || "SUSTAINABLE PRODUCT";
}

function getCategoryClass(categoryId: string) {
  const classes: Record<string, string> = {
    c1: "cart-product-art cotton",
    c2: "cart-product-art wood",
    c3: "cart-product-art glass",
    c4: "cart-product-art paper",
  };

  return classes[categoryId] || "cart-product-art";
}

export default function Cart() {
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const discount = useMemo(() => {
    if (!promoApplied || promoCode.trim().toUpperCase() !== "GREEN10") {
      return 0;
    }

    return Math.round(subtotal * 0.1);
  }, [promoApplied, promoCode, subtotal]);

  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 79;
  const total = Math.max(0, subtotal + shipping - discount);

  function applyPromo() {
    const code = promoCode.trim().toUpperCase();

    if (code === "GREEN10") {
      setPromoCode("GREEN10");
      setPromoApplied(true);
    } else {
      setPromoApplied(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <section className="cart-empty-page">
          <div className="cart-empty-icon">
            <Recycle size={34} />
          </div>

          <p className="cart-eyebrow">YOUR CART</p>

          <h1>Your cart is ready for a second life.</h1>

          <p>
            You haven't added anything yet. Explore our collection of
            thoughtfully made products created from recovered materials.
          </p>

          <Link to="/shop" className="cart-primary-button">
            Explore products
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-hero">
        <div className="cart-hero-glow" />

        <div className="cart-container">
          <Link to="/shop" className="cart-back-link">
            <ArrowLeft size={15} />
            Continue shopping
          </Link>

          <div className="cart-hero-copy">
            <p className="cart-eyebrow">YOUR CART</p>
            <h1>Things worth giving a second life.</h1>
            <p>
              Every item in your cart keeps useful materials in circulation.
            </p>
          </div>
        </div>
      </section>

      <section className="cart-main">
        <div className="cart-container cart-layout">
          <div className="cart-items-column">
            <div className="cart-items-heading">
              <div>
                <p className="cart-section-label">YOUR ITEMS</p>
                <h2>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </h2>
              </div>

              <button
                type="button"
                className="cart-clear-button"
                onClick={clearCart}
              >
                <Trash2 size={14} />
                Clear cart
              </button>
            </div>

            <div className="cart-items-list">
              {items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div className={getCategoryClass(item.category_id)}>
                    <Recycle size={30} />
                    <span>REUSE</span>
                  </div>

                  <div className="cart-item-info">
                    <span className="cart-item-category">
                      {getCategoryLabel(item.category_id)}
                    </span>

                    <Link
                      to={`/product/${item.slug}`}
                      className="cart-item-name"
                    >
                      {item.name}
                    </Link>

                    <p>
                      {item.short_description ||
                        "Thoughtfully made from recovered materials."}
                    </p>

                    <div className="cart-item-controls">
                      <div className="cart-quantity">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus size={13} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove-button"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-price">
                    {formatPrice(Number(item.base_price) * item.quantity)}
                    {item.quantity > 1 && (
                      <span>{formatPrice(item.base_price)} each</span>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-bottom-note">
              <Sparkles size={17} />
              <span>
                Your choices help keep recovered materials in circulation.
              </span>
            </div>
          </div>

          <aside className="cart-summary">
            <div className="cart-summary-header">
              <div>
                <p className="cart-section-label">ORDER SUMMARY</p>
                <h2>Ready to checkout?</h2>
              </div>

              <div className="cart-summary-icon">
                <ShieldCheck size={17} />
              </div>
            </div>

            <div className="cart-promo">
              <label htmlFor="promo-code">
                <Tag size={14} />
                Have a promo code?
              </label>

              <div className="cart-promo-row">
                <input
                  id="promo-code"
                  value={promoCode}
                  onChange={(event) => {
                    setPromoCode(event.target.value);
                    setPromoApplied(false);
                  }}
                  placeholder="Enter code"
                  autoComplete="off"
                />

                <button type="button" onClick={applyPromo}>
                  Apply
                </button>
              </div>

              {promoApplied && (
                <p className="cart-promo-success">
                  GREEN10 applied — 10% saved.
                </p>
              )}
            </div>

            <div className="cart-summary-lines">
              <div>
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <div>
                <span>Shipping</span>
                <strong>{shipping === 0 ? "FREE" : formatPrice(shipping)}</strong>
              </div>

              {discount > 0 && (
                <div className="cart-discount-line">
                  <span>Discount</span>
                  <strong>-{formatPrice(discount)}</strong>
                </div>
              )}
            </div>

            <div className="cart-total">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>

            <Link to="/checkout" className="cart-checkout-button">
              Proceed to checkout
              <ArrowRight size={17} />
            </Link>

            <div className="cart-secure-note">
              <ShieldCheck size={14} />
              Secure & conscious checkout
            </div>
          </aside>
        </div>
      </section>

      <section className="cart-benefits">
        <div className="cart-container cart-benefits-grid">
          <div>
            <Recycle size={20} />
            <div>
              <strong>Circular by design</strong>
              <span>Materials stay useful for longer.</span>
            </div>
          </div>

          <div>
            <Sparkles size={20} />
            <div>
              <strong>Thoughtfully selected</strong>
              <span>Built around reuse and recovery.</span>
            </div>
          </div>

          <div>
            <ShieldCheck size={20} />
            <div>
              <strong>Simple checkout</strong>
              <span>A smooth frontend shopping experience.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
