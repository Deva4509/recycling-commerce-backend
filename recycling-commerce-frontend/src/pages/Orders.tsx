import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Leaf,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cancelOrder, getMyOrders, type ApiOrderSummary } from "../lib/api";

const formatMoney = (value?: number | string) => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value?: string) => {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

const statusLabel = (status?: string) =>
  (status || "PENDING").replaceAll("_", " ");

const statusClass = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "DELIVERED":
      return "rp-order-status delivered";
    case "SHIPPED":
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
      return "rp-order-status shipped";
    case "CANCELLED":
      return "rp-order-status cancelled";
    case "PROCESSING":
      return "rp-order-status processing";
    default:
      return "rp-order-status pending";
  }
};

const statusIcon = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "DELIVERED":
      return <CheckCircle2 size={14} />;
    case "SHIPPED":
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
      return <Truck size={14} />;
    case "CANCELLED":
      return <XCircle size={14} />;
    default:
      return <Clock3 size={14} />;
  }
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ApiOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    getMyOrders(user.id)
      .then(setOrders)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load orders.");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter =
        filter === "ALL" ||
        (order.status || "PENDING").toUpperCase() === filter;

      const matchesQuery =
        !query ||
        order.id.toLowerCase().includes(query.toLowerCase());

      return matchesFilter && matchesQuery;
    });
  }, [orders, filter, query]);

  const delivered = orders.filter(
    (order) => order.status?.toUpperCase() === "DELIVERED",
  ).length;

  const active = orders.filter(
    (order) =>
      !["DELIVERED", "CANCELLED"].includes(
        (order.status || "").toUpperCase(),
      ),
  ).length;

  const cancel = async (orderId: string) => {
    setCancelling(orderId);
    try {
      const updated = await cancelOrder(orderId);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, ...updated, status: "CANCELLED" }
            : order,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel order.");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <main className="orders-page rp-orders-dashboard">
      <div className="rp-orders-shell">

        <section className="rp-orders-hero">
          <div className="rp-orders-hero-copy">
            <span className="rp-eyebrow">
              <Leaf size={12} />
              YOUR ORDERS
            </span>

            <h1>
              Everything you&apos;ve{" "}
              <span>ordered.</span>
            </h1>

            <p>
              Track purchases, view details, and manage your orders.
              <br />
              Thank you for choosing a greener tomorrow.
            </p>

            <div className="rp-order-stats">
              <div className="rp-order-stat">
                <span className="rp-stat-icon">
                  <Package size={19} />
                </span>
                <strong>{orders.length}</strong>
                <small>Total Orders</small>
              </div>

              <div className="rp-order-stat">
                <span className="rp-stat-icon">
                  <Truck size={19} />
                </span>
                <strong>{delivered}</strong>
                <small>Delivered</small>
              </div>

              <div className="rp-order-stat">
                <span className="rp-stat-icon">
                  <Leaf size={19} />
                </span>
                <strong>{active}</strong>
                <small>In Progress</small>
              </div>
            </div>
          </div>

          <div className="rp-orders-hero-art" aria-hidden="true">
            <div className="rp-orbit rp-orbit-one" />
            <div className="rp-orbit rp-orbit-two" />
            <div className="rp-hero-package">
              <Package size={82} strokeWidth={1.15} />
              <Leaf size={27} />
            </div>

            <div className="rp-hero-message">
              <small>Small choices.</small>
              <strong>A greener planet.</strong>
              <p>Every order helps reduce waste and build a cleaner future.</p>
            </div>
          </div>
        </section>

        <section className="rp-orders-toolbar">
          <div className="rp-order-filters">
            {[
              ["ALL", "All Orders"],
              ["PENDING", "Pending"],
              ["SHIPPED", "Shipped"],
              ["DELIVERED", "Delivered"],
              ["CANCELLED", "Cancelled"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="rp-order-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search orders..."
            />
          </label>
        </section>

        {error && <div className="rp-orders-error">{error}</div>}

        {loading ? (
          <div className="rp-orders-loading">
            <div className="rp-loading-orb">
              <Leaf size={25} />
            </div>
            <span>Loading your orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rp-orders-empty">
            <Package size={38} />
            <h2>No orders found</h2>
            <p>
              {query || filter !== "ALL"
                ? "Try another search or filter."
                : "Your circular journey starts with your first order."}
            </p>
            <Link to="/shop">
              Explore products <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <section className="rp-orders-layout">
            <div className="rp-orders-list">
              {filteredOrders.map((order) => {
                const status = (order.status || "PENDING").toUpperCase();
                const canCancel = ["PENDING", "CONFIRMED", "PROCESSING"].includes(
                  status,
                );

                return (
                  <article className="rp-order-row" key={order.id}>
                    <div className="rp-order-product-art">
                      <Package size={34} strokeWidth={1.25} />
                    </div>

                    <div className="rp-order-info">
                      <div className="rp-order-number">
                        ORDER #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="rp-order-date">
                        {formatDate(order.created_at)}
                      </div>
                      <div className="rp-order-items-count">
                        {(() => {
                          switch (status) {
                            case "PROCESSING":
                              return "Your order is being processed";
                            case "SHIPPED":
                              return "Your order is on the way";
                            case "IN_TRANSIT":
                              return "Your order is in transit";
                            case "OUT_FOR_DELIVERY":
                              return "Out for delivery today";
                            case "DELIVERED":
                              return "Order delivered successfully";
                            case "CANCELLED":
                              return "Order was cancelled";
                            case "PENDING":
                            case "CONFIRMED":
                            default:
                              return "Order placed successfully";
                          }
                        })()}
                      </div>
                    </div>

                    <div className="rp-order-middle">
                      <div className={statusClass(status)}>
                        {statusIcon(status)}
                        {statusLabel(status)}
                      </div>
                      <strong>{formatMoney(order.total_amount)}</strong>
                    </div>

                    <div className="rp-order-actions">
                      <Link to={`/account/orders/${order.id}`}>
                        View Details <ArrowRight size={15} />
                      </Link>

                      {canCancel && (
                        <button
                          type="button"
                          disabled={cancelling === order.id}
                          onClick={() => cancel(order.id)}
                        >
                          {cancelling === order.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="rp-orders-sidebar">
              <div className="rp-impact-card">
                <span className="rp-sidebar-icon">
                  <Leaf size={19} />
                </span>
                <small>YOUR IMPACT</small>
                <strong>{orders.length * 12} kg</strong>
                <p>Estimated materials kept in circulation through your purchases.</p>
                <div className="rp-impact-line" />
                <em>“Sustainable choices create extraordinary tomorrows.”</em>
              </div>

              <div className="rp-rewards-card">
                <span className="rp-sidebar-icon">
                  <Leaf size={18} />
                </span>
                <strong>GreenCore Rewards</strong>
                <p>Keep choosing circular products and make every purchase count.</p>
                <div className="rp-reward-progress">
                  <span />
                </div>
                <small>Green choices • Real impact</small>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
