import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

import {
  ArrowLeft,
  Check,
  CreditCard,
  LockKeyhole,
  Leaf,
  PackageCheck,
  Recycle,
  ShieldCheck,
  Truck,
} from "lucide-react";

type PaymentMethod = "card" | "upi" | "cod";

type BackendProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  base_price: string | number;
  currency: string;
  category_id: string;
  is_active: boolean;
};

type OrderResponse = {
  id: string;
  order_number: string;
  total_amount: string | number;
  currency: string;
  payment_status: string;
};

const MAIN_LOCATION_ID = "7842c031-8767-4d67-a4d8-fe90f18236b7";

const API_BASE = "/api/v1";

function getStoredToken() {
  return (
    localStorage.getItem("recyclepro-access-token") ||
    sessionStorage.getItem("recyclepro-access-token")
  );
}

function paymentMethodToApi(method: PaymentMethod) {
  if (method === "card") return "CARD";
  if (method === "upi") return "UPI";
  return "COD";
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCart();
  const { user } = useAuth();

  const buyNowProduct = location.state?.buyNowProduct;
  const buyNowQuantity = location.state?.quantity || 1;

  const checkoutItems = buyNowProduct
    ? [{ ...buyNowProduct, quantity: buyNowQuantity }]
    : cartItems;

  const checkoutSubtotal = buyNowProduct
    ? Number(buyNowProduct.base_price) * buyNowQuantity
    : cartSubtotal;

  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotal, setOrderTotal] = useState(checkoutSubtotal);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: user?.name || "",
    lastName: "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    upi: "",
  });

  const subtotal = checkoutSubtotal;
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 79;
  const discount = 0;
  const total = subtotal + shipping - discount;

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!checkoutItems.length) {
      setError("Your cart is empty.");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      navigate("/login");
      return;
    }

    setPlacingOrder(true);
    setError("");

    try {
      const productsResponse = await fetch(
        `${API_BASE}/catalog/products?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!productsResponse.ok) {
        throw new Error("Unable to load the product catalog.");
      }

      const catalogPayload = await productsResponse.json();

      const backendProducts: BackendProduct[] = Array.isArray(catalogPayload)
        ? catalogPayload
        : Array.isArray(catalogPayload.items)
          ? catalogPayload.items
          : Array.isArray(catalogPayload.products)
            ? catalogPayload.products
            : [];

      const orderItems = checkoutItems.map((item) => {
        const backendProduct = backendProducts.find(
          (product) =>
            product.sku === item.sku || product.slug === item.slug,
        );

        if (!backendProduct) {
          throw new Error(
            `Product "${item.name}" is not available in the backend catalog.`,
          );
        }

        return {
          product_id: backendProduct.id,
          location_id: MAIN_LOCATION_ID,
          variant_id: null,
          quantity: item.quantity,
        };
      });

      const shippingAddress = [
        form.firstName,
        form.lastName,
        form.address,
        form.city,
        form.state,
        form.pincode,
        form.phone,
      ]
        .filter(Boolean)
        .join(", ");

      const orderResponse = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
          notes: `Payment method: ${paymentMethodToApi(payment)}`,
          shipping_amount: shipping,
          tax_amount: 0,
          discount_amount: discount,
          items: orderItems,
        }),
      });

      const orderPayload = await orderResponse.json().catch(() => null);

      if (!orderResponse.ok) {
        throw new Error(
          orderPayload?.detail ||
            orderPayload?.message ||
            "Unable to place your order.",
        );
      }

      const order = orderPayload as OrderResponse;

      const paymentResponse = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          method: paymentMethodToApi(payment),
          provider:
            payment === "cod"
              ? "cash_on_delivery"
              : payment === "upi"
                ? "upi"
                : "card",
        }),
      });

      const paymentPayload = await paymentResponse.json().catch(() => null);

      if (!paymentResponse.ok) {
        throw new Error(
          paymentPayload?.detail ||
            paymentPayload?.message ||
            "Order was created, but payment setup failed.",
        );
      }

      setOrderNumber(order.order_number);
      setOrderTotal(Number(order.total_amount));
      setPlaced(true);

      if (!buyNowProduct) {
        clearCart();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while placing your order.",
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  if (placed) {
    return (
      <main className="checkout-page">
        <section className="checkout-success">
          <div className="checkout-success-icon">
            <Check size={34} strokeWidth={2.5} />
          </div>

          <span className="checkout-kicker">ORDER CONFIRMED</span>

          <h1>Your order is on its way to a second life.</h1>

          <p>
            Thank you for choosing circular products. Your order has been
            placed successfully and is being prepared for delivery.
          </p>

          <div className="checkout-order-card">
            <div>
              <span>ORDER NUMBER</span>
              <strong>#{orderNumber}</strong>
            </div>

            <div>
              <span>ESTIMATED DELIVERY</span>
              <strong>3–5 business days</strong>
            </div>

            <div>
              <span>TOTAL</span>
              <strong>
                ₹{orderTotal.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          <div className="checkout-success-actions">
            <Link to="/shop" className="checkout-primary-button">
              Continue shopping
            </Link>

            <Link to="/" className="checkout-secondary-button">
              Back to home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <section className="checkout-hero">
        <div>
          <span className="checkout-kicker">SECURE CHECKOUT</span>
          <h1>Complete your order.</h1>
          <p>
            One more step toward keeping valuable materials in circulation.
          </p>
        </div>

        <div className="checkout-secure-badge">
          <LockKeyhole size={16} />
          Secure checkout
        </div>
      </section>

      <form className="checkout-content" onSubmit={placeOrder}>
        <div className="checkout-main">
          <div className="checkout-section">
            <div className="checkout-section-heading">
              <div className="checkout-step">01</div>
              <div>
                <h2>Contact information</h2>
                <p>Where should we send your order updates?</p>
              </div>
            </div>

            <div className="checkout-fields checkout-fields-two">
              <label>
                First name
                <input
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    updateField("firstName", e.target.value)
                  }
                  placeholder="First name"
                />
              </label>

              <label>
                Last name
                <input
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    updateField("lastName", e.target.value)
                  }
                  placeholder="Last name"
                />
              </label>

              <label>
                Email address
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Phone number
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </label>
            </div>
          </div>

          <div className="checkout-section">
            <div className="checkout-section-heading">
              <div className="checkout-step">02</div>
              <div>
                <h2>Delivery address</h2>
                <p>Where should we deliver your recycled goods?</p>
              </div>
            </div>

            <div className="checkout-fields">
              <label>
                Street address
                <input
                  required
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="House number, street and area"
                />
              </label>

              <div className="checkout-fields-three">
                <label>
                  City
                  <input
                    required
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Bulandshahr"
                  />
                </label>

                <label>
                  State
                  <input
                    required
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="Uttar Pradesh"
                  />
                </label>

                <label>
                  PIN code
                  <input
                    required
                    inputMode="numeric"
                    value={form.pincode}
                    onChange={(e) => updateField("pincode", e.target.value)}
                    placeholder="203001"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <div className="checkout-section-heading">
              <div className="checkout-step">03</div>
              <div>
                <h2>Payment method</h2>
                <p>Choose how you'd like to pay.</p>
              </div>
            </div>

            <div className="checkout-payment-options">
              <button
                type="button"
                className={`checkout-payment-option ${
                  payment === "card" ? "active" : ""
                }`}
                onClick={() => setPayment("card")}
              >
                <CreditCard size={20} />
                <span>
                  <strong>Credit / Debit Card</strong>
                  <small>Visa, Mastercard, RuPay</small>
                </span>
                <span className="checkout-radio">
                  {payment === "card" && <span />}
                </span>
              </button>

              <button
                type="button"
                className={`checkout-payment-option ${
                  payment === "upi" ? "active" : ""
                }`}
                onClick={() => setPayment("upi")}
              >
                <span className="checkout-upi-icon">UPI</span>
                <span>
                  <strong>UPI</strong>
                  <small>Google Pay, PhonePe, Paytm</small>
                </span>
                <span className="checkout-radio">
                  {payment === "upi" && <span />}
                </span>
              </button>

              <button
                type="button"
                className={`checkout-payment-option ${
                  payment === "cod" ? "active" : ""
                }`}
                onClick={() => setPayment("cod")}
              >
                <PackageCheck size={20} />
                <span>
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives</small>
                </span>
                <span className="checkout-radio">
                  {payment === "cod" && <span />}
                </span>
              </button>
            </div>

            {payment === "card" && (
              <div className="checkout-payment-fields">
                <label>
                  Card number
                  <input
                    required
                    inputMode="numeric"
                    value={form.cardNumber}
                    onChange={(e) =>
                      updateField("cardNumber", e.target.value)
                    }
                    placeholder="1234 5678 9012 3456"
                  />
                </label>

                <div className="checkout-fields-two">
                  <label>
                    Expiry date
                    <input
                      required
                      value={form.expiry}
                      onChange={(e) => updateField("expiry", e.target.value)}
                      placeholder="MM / YY"
                    />
                  </label>

                  <label>
                    CVV
                    <input
                      required
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={form.cvv}
                      onChange={(e) => updateField("cvv", e.target.value)}
                      placeholder="•••"
                    />
                  </label>
                </div>
              </div>
            )}

            {payment === "upi" && (
              <div className="checkout-payment-fields">
                <label>
                  UPI ID
                  <input
                    required
                    value={form.upi}
                    onChange={(e) => updateField("upi", e.target.value)}
                    placeholder="yourname@upi"
                  />
                </label>
              </div>
            )}

            {payment === "cod" && (
              <div className="checkout-cod-note">
                <ShieldCheck size={19} />
                <span>
                  You can pay safely in cash when your GreenCore order is
                  delivered.
                </span>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                background: "rgba(220, 38, 38, 0.08)",
                border: "1px solid rgba(220, 38, 38, 0.2)",
                color: "#b91c1c",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <div className="checkout-trust-row">
            <div>
              <ShieldCheck size={19} />
              <span>Secure payment</span>
            </div>
            <div>
              <Truck size={19} />
              <span>Reliable delivery</span>
            </div>
            <div>
              <RecycleIcon />
              <span>Better for the planet</span>
            </div>
          </div>

          <button
            type="submit"
            className="checkout-place-order"
            disabled={placingOrder}
          >
            {placingOrder
              ? "Placing order..."
              : `Place order · ₹${total.toLocaleString("en-IN")}`}
            {!placingOrder && <Check size={18} />}
          </button>

          <button
            type="button"
            className="checkout-back"
            onClick={() => navigate("/cart")}
            disabled={placingOrder}
          >
            <ArrowLeft size={16} />
            Return to cart
          </button>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary-header">
            <span>YOUR ORDER</span>
            <strong>
              {checkoutItems.length}{" "}
              {checkoutItems.length === 1 ? "item" : "items"}
            </strong>
          </div>

          <div className="checkout-summary-products">
            {checkoutItems.map((item) => (
              <CheckoutProduct
                key={item.id}
                title={item.name}
                category={
                  item.category_id === "c1"
                    ? "Recycled Cotton"
                    : item.category_id === "c2"
                      ? "Reclaimed Wood"
                      : item.category_id === "c3"
                        ? "Recycled Glass"
                        : item.category_id === "c4"
                          ? "Upcycled Paper"
                          : "Sustainable Product"
                }
                price={Number(item.base_price) * item.quantity}
                quantity={item.quantity}
                icon={
                  item.category_id === "c1"
                    ? "cotton"
                    : item.category_id === "c2"
                      ? "wood"
                      : item.category_id === "c3"
                        ? "glass"
                        : "paper"
                }
              />
            ))}
          </div>

          <div className="checkout-summary-divider" />

          <div className="checkout-price-row">
            <span>Subtotal</span>
            <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
          </div>

          <div className="checkout-price-row">
            <span>Shipping</span>
            <strong>{shipping === 0 ? "FREE" : `₹${shipping}`}</strong>
          </div>

          <div className="checkout-price-row checkout-discount">
            <span>Green10 discount</span>
            <strong>-₹{discount}</strong>
          </div>

          <div className="checkout-summary-divider" />

          <div className="checkout-total">
            <span>Total</span>
            <strong>₹{total.toLocaleString("en-IN")}</strong>
          </div>

          <div className="checkout-summary-note">
            <Leaf size={17} />
            <span>
              You're helping keep useful materials in circulation.
            </span>
          </div>
        </aside>
      </form>
    </main>
  );
}

function CheckoutProduct({
  title,
  category,
  price,
  quantity,
  icon,
}: {
  title: string;
  category: string;
  price: number;
  quantity: number;
  icon: string;
}) {
  return (
    <div className="checkout-product">
      <div className={`checkout-product-visual ${icon}`}>
        <Leaf size={19} />
      </div>

      <div className="checkout-product-info">
        <strong>{title}</strong>
        <span>
          {category} · Qty {quantity}
        </span>
      </div>

      <strong>₹{price.toLocaleString("en-IN")}</strong>
    </div>
  );
}

function RecycleIcon() {
  return (
    <span className="checkout-recycle-icon">
      <Recycle size={17} />
    </span>
  );
}
