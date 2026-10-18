import AdminOrderNotifications from "../components/AdminOrderNotifications";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import {
  getAdminDashboard,
  getAdminOrders,
  getAdminProducts,
  type ApiAdminStats,
  type ApiOrder,
  type ApiProduct,
} from "../lib/api";

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function shortId(value: string) {
  return value.slice(0, 8).toUpperCase();
}

function statusClass(status: string) {
  return String(status).toLowerCase().replace(/_/g, "-");
}

function getOrderAmount(order: ApiOrder) {
  return Number(order.total_amount ?? 0);
}

function getItemCount(order: ApiOrder) {
  if (!Array.isArray(order.items)) return 0;

  return order.items.reduce(
    (total: number, item: { quantity?: number | string | null }) =>
      total + Number(item.quantity ?? 0),
    0,
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<ApiAdminStats | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(refresh = false) {
    setError("");

    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [dashboard, adminOrders, adminProducts] = await Promise.all([
        getAdminDashboard(),
        getAdminOrders(),
        getAdminProducts(),
      ]);

      setStats(dashboard);
      setOrders(Array.isArray(adminOrders) ? adminOrders : []);
      setProducts(Array.isArray(adminProducts) ? adminProducts : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load admin dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const statusCounts = useMemo(() => {
    const result = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const status = String(order.status || "").toUpperCase();

      if (status === "PENDING" || status === "CONFIRMED") {
        result.pending += 1;
      } else if (status === "PROCESSING") {
        result.processing += 1;
      } else if (status === "SHIPPED") {
        result.shipped += 1;
      } else if (status === "DELIVERED") {
        result.delivered += 1;
      } else if (status === "CANCELLED") {
        result.cancelled += 1;
      }
    });

    return result;
  }, [orders]);

  const chartMax = Math.max(
    statusCounts.pending,
    statusCounts.processing,
    statusCounts.shipped,
    statusCounts.delivered,
    statusCounts.cancelled,
    1,
  );

  const donutTotal =
    statusCounts.pending +
    statusCounts.processing +
    statusCounts.shipped +
    statusCounts.delivered +
    statusCounts.cancelled;

  const donutPending =
    donutTotal ? (statusCounts.pending / donutTotal) * 100 : 0;

  const donutProcessing =
    donutTotal ? (statusCounts.processing / donutTotal) * 100 : 0;

  const donutShipped =
    donutTotal ? (statusCounts.shipped / donutTotal) * 100 : 0;

  const donutDelivered =
    donutTotal ? (statusCounts.delivered / donutTotal) * 100 : 0;

  const pendingEnd = donutPending;
  const processingEnd = pendingEnd + donutProcessing;
  const shippedEnd = processingEnd + donutShipped;
  const deliveredEnd = shippedEnd + donutDelivered;

  const recentOrders = orders.slice(0, 5);
  const topProducts = products.slice(0, 5);

  if (loading) {
    return (
      <section className="rp-admin-modern-page">
        <div className="rp-admin-page-loading">
          <RefreshCw size={25} className="rp-spin" />
          <span>Loading control center...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="rp-admin-modern-page">
      <AdminOrderNotifications />      <div className="rp-admin-modern-heading">
        <div>
          <span className="rp-admin-modern-eyebrow">
            GREENCORE CONTROL CENTER
          </span>

          <h1>
            Welcome back,
            <br />
            <span>Admin</span>
          </h1>

          <p>
            Here&apos;s what&apos;s happening with your circular commerce
            platform.
          </p>
        </div>

        <button
          type="button"
          className="rp-admin-modern-refresh"
          onClick={() => void loadDashboard(true)}
          disabled={refreshing}
        >
          <RefreshCw size={15} className={refreshing ? "rp-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rp-admin-modern-error">
          <XCircle size={17} />
          {error}
        </div>
      )}

      <div className="rp-admin-modern-metrics">
        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon">
            <CircleDollarSign size={20} />
          </div>
          <div>
            <span>Total Revenue</span>
            <strong>{currency(stats?.total_revenue ?? 0)}</strong>
            <small>Non-cancelled orders</small>
          </div>
          <ArrowUpRight size={16} className="metric-arrow" />
        </div>

        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span>Total Orders</span>
            <strong>{stats?.total_orders ?? 0}</strong>
            <small>All customer orders</small>
          </div>
          <ArrowUpRight size={16} className="metric-arrow" />
        </div>

        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon">
            <Boxes size={20} />
          </div>
          <div>
            <span>Active Products</span>
            <strong>{stats?.active_products ?? 0}</strong>
            <small>{stats?.total_products ?? 0} total products</small>
          </div>
          <ArrowUpRight size={16} className="metric-arrow" />
        </div>

        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon warning">
            <Package size={20} />
          </div>
          <div>
            <span>Inactive Products</span>
            <strong>{stats?.inactive_products ?? 0}</strong>
            <small>Currently hidden</small>
          </div>
          <ArrowUpRight size={16} className="metric-arrow" />
        </div>
      </div>

      <div className="rp-admin-dashboard-grid">
        <div className="rp-admin-modern-card order-overview-card">
          <div className="rp-admin-modern-card-heading">
            <div>
              <span>ORDER OVERVIEW</span>
              <h2>Fulfilment activity</h2>
            </div>

            <div className="rp-admin-live-pill">
              <i />
              Live data
            </div>
          </div>

          <div className="rp-admin-chart">
            <div className="rp-admin-chart-y">
              <span>{chartMax}</span>
              <span>{Math.ceil(chartMax / 2)}</span>
              <span>0</span>
            </div>

            <div className="rp-admin-chart-area">
              <div className="rp-admin-chart-grid-line top" />
              <div className="rp-admin-chart-grid-line middle" />
              <div className="rp-admin-chart-grid-line bottom" />

              <div className="rp-admin-bars">
                {[
                  ["Pending", statusCounts.pending],
                  ["Processing", statusCounts.processing],
                  ["Shipped", statusCounts.shipped],
                  ["Delivered", statusCounts.delivered],
                  ["Cancelled", statusCounts.cancelled],
                ].map(([label, value]) => (
                  <div className="rp-admin-bar-column" key={String(label)}>
                    <div className="rp-admin-bar-value">
                      {value}
                    </div>
                    <div
                      className="rp-admin-bar"
                      style={{
                        height: `${Math.max(
                          Number(value) / chartMax * 100,
                          Number(value) ? 8 : 2,
                        )}%`,
                      }}
                    />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rp-admin-chart-caption">
            Current order distribution from the admin order endpoint.
          </div>
        </div>

        <div className="rp-admin-modern-card order-status-card">
          <div className="rp-admin-modern-card-heading">
            <div>
              <span>ORDER STATUS</span>
              <h2>Order health</h2>
            </div>
          </div>

          <div className="rp-admin-donut-wrap">
            <div
              className="rp-admin-donut"
              style={{
                background: `conic-gradient(
                  #4ee7a6 0% ${pendingEnd}%,
                  #55c9ff ${pendingEnd}% ${processingEnd}%,
                  #9c91ff ${processingEnd}% ${shippedEnd}%,
                  #38e49b ${shippedEnd}% ${deliveredEnd}%,
                  #ff7272 ${deliveredEnd}% 100%
                )`,
              }}
            >
              <div>
                <strong>{donutTotal}</strong>
                <span>Orders</span>
              </div>
            </div>

            <div className="rp-admin-status-legend">
              <div>
                <i className="pending" />
                <span>Pending</span>
                <strong>{statusCounts.pending}</strong>
              </div>
              <div>
                <i className="processing" />
                <span>Processing</span>
                <strong>{statusCounts.processing}</strong>
              </div>
              <div>
                <i className="shipped" />
                <span>Shipped</span>
                <strong>{statusCounts.shipped}</strong>
              </div>
              <div>
                <i className="delivered" />
                <span>Delivered</span>
                <strong>{statusCounts.delivered}</strong>
              </div>
              <div>
                <i className="cancelled" />
                <span>Cancelled</span>
                <strong>{statusCounts.cancelled}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="rp-admin-modern-card recent-orders-card">
          <div className="rp-admin-modern-card-heading">
            <div>
              <span>RECENT ORDERS</span>
              <h2>Latest activity</h2>
            </div>
          </div>

          <div className="rp-admin-modern-table">
            <div className="rp-admin-modern-table-head">
              <span>ORDER</span>
              <span>ITEMS</span>
              <span>TOTAL</span>
              <span>STATUS</span>
            </div>

            {recentOrders.length === 0 ? (
              <div className="rp-admin-modern-empty">
                No orders available.
              </div>
            ) : (
              recentOrders.map((order) => {
                const status = String(
                  order.status || "PENDING",
                ).toUpperCase();

                return (
                  <div
                    className="rp-admin-modern-table-row"
                    key={order.id}
                  >
                    <strong>
                      #{shortId(String(order.id))}
                    </strong>
                    <span>{getItemCount(order)}</span>
                    <strong>{currency(getOrderAmount(order))}</strong>
                    <span
                      className={`rp-admin-modern-status ${statusClass(
                        status,
                      )}`}
                    >
                      {status.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rp-admin-modern-card top-products-card">
          <div className="rp-admin-modern-card-heading">
            <div>
              <span>PRODUCT CATALOG</span>
              <h2>Top products</h2>
            </div>
          </div>

          <div className="rp-admin-top-products">
            {topProducts.length === 0 ? (
              <div className="rp-admin-modern-empty">
                No products available.
              </div>
            ) : (
              topProducts.map((product, index) => (
                <div
                  className="rp-admin-top-product"
                  key={product.id}
                >
                  <span className="product-rank">
                    {index + 1}
                  </span>

                  <div className="product-symbol">
                    <Boxes size={17} />
                  </div>

                  <div className="product-copy">
                    <strong>{product.name}</strong>
                    <small>{product.sku}</small>
                  </div>

                  <strong className="product-price">
                    {currency(Number(product.base_price ?? 0))}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rp-admin-modern-bottom-banner">
        <div className="bottom-banner-icon">
          <CheckCircle2 size={23} />
        </div>

        <div>
          <span>OPERATIONS STATUS</span>
          <strong>Everything is connected.</strong>
          <p>
            Product, inventory, order and fulfilment data is being served
            directly from the GreenCore backend.
          </p>
        </div>

        <div className="bottom-banner-badge">
          <span />
          Backend connected
        </div>
      </div>
    </section>
  );
}
