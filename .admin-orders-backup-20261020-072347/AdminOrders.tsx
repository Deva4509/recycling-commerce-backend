import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  LoaderCircle,
  Package,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import {
  getAdminOrders,
  updateOrderStatus,
  type ApiOrder,
} from "../lib/api";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

const statuses: Array<"ALL" | OrderStatus> = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const statusMeta: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "pending" },
  CONFIRMED: { label: "Confirmed", className: "confirmed" },
  PROCESSING: { label: "Processing", className: "processing" },
  SHIPPED: { label: "Shipped", className: "shipped" },
  DELIVERED: { label: "Delivered", className: "delivered" },
  CANCELLED: { label: "Cancelled", className: "cancelled" },
};

function formatCurrency(value: unknown) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getOrderId(order: ApiOrder) {
  return String(order.id || "");
}

function getOrderStatus(order: ApiOrder): OrderStatus {
  const value = String(order.status || "PENDING").toUpperCase();

  if (
    value === "PENDING" ||
    value === "CONFIRMED" ||
    value === "PROCESSING" ||
    value === "SHIPPED" ||
    value === "DELIVERED" ||
    value === "CANCELLED"
  ) {
    return value;
  }

  return "PENDING";
}

function getOrderAmount(order: ApiOrder) {
  return Number(order.total_amount ?? 0);
}

function getCustomerLabel(order: ApiOrder) {
  return order.user_id ? String(order.user_id) : "Customer";
}

function getItemCount(order: ApiOrder) {
  if (!Array.isArray(order.items)) return 0;

  return order.items.reduce(
    (total: number, item: { quantity?: number | string | null }) =>
      total + Number(item.quantity ?? 0),
    0,
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadOrders(showSpinner = true) {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    setError("");

    try {
      const result = await getAdminOrders();
      setOrders(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders from the backend.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenStatusId(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, status, pageSize]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const orderId = getOrderId(order).toLowerCase();
      const customer = getCustomerLabel(order).toLowerCase();
      const currentStatus = getOrderStatus(order);

      const matchesQuery =
        !normalizedQuery ||
        orderId.includes(normalizedQuery) ||
        customer.includes(normalizedQuery);

      const matchesStatus =
        status === "ALL" || currentStatus === status;

      return matchesQuery && matchesStatus;
    });
  }, [orders, query, status]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleOrders = filteredOrders.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(
        (order) => getOrderStatus(order) === "PENDING",
      ).length,
      processing: orders.filter(
        (order) => getOrderStatus(order) === "PROCESSING",
      ).length,
      shipped: orders.filter(
        (order) => getOrderStatus(order) === "SHIPPED",
      ).length,
      delivered: orders.filter(
        (order) => getOrderStatus(order) === "DELIVERED",
      ).length,
      cancelled: orders.filter(
        (order) => getOrderStatus(order) === "CANCELLED",
      ).length,
    };
  }, [orders]);

  async function handleStatusChange(
    orderId: string,
    nextStatus: OrderStatus,
  ) {
    setUpdatingId(orderId);
    setError("");

    try {
      await updateOrderStatus(orderId, nextStatus);
      await loadOrders(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the order status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="rp-admin-orders-page">
      <div className="rp-admin-page-heading">
        <div>
          <div className="rp-admin-eyebrow">ORDER OPERATIONS</div>
          <h1>Orders</h1>
          <p>
            Monitor customer orders and control fulfilment status from the
            backend.
          </p>
        </div>

        <button
          type="button"
          className="rp-admin-action-button"
          onClick={() => void loadOrders(false)}
          disabled={refreshing}
        >
          {refreshing ? (
            <LoaderCircle size={16} className="rp-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </div>

      <div className="rp-admin-order-stats">
        <button
          type="button"
          className={`rp-admin-order-stat ${
            status === "ALL" ? "active" : ""
          }`}
          onClick={() => setStatus("ALL")}
        >
          <span className="rp-admin-stat-icon">
            <Package size={17} />
          </span>
          <span>
            <small>Total orders</small>
            <strong>{counts.all}</strong>
          </span>
        </button>

        <button
          type="button"
          className={`rp-admin-order-stat ${
            status === "PENDING" ? "active" : ""
          }`}
          onClick={() => setStatus("PENDING")}
        >
          <span className="rp-admin-stat-icon">
            <Clock3 size={17} />
          </span>
          <span>
            <small>Pending</small>
            <strong>{counts.pending}</strong>
          </span>
        </button>

        <button
          type="button"
          className={`rp-admin-order-stat ${
            status === "PROCESSING" ? "active" : ""
          }`}
          onClick={() => setStatus("PROCESSING")}
        >
          <span className="rp-admin-stat-icon">
            <RefreshCw size={17} />
          </span>
          <span>
            <small>Processing</small>
            <strong>{counts.processing}</strong>
          </span>
        </button>

        <button
          type="button"
          className={`rp-admin-order-stat ${
            status === "SHIPPED" ? "active" : ""
          }`}
          onClick={() => setStatus("SHIPPED")}
        >
          <span className="rp-admin-stat-icon">
            <Truck size={17} />
          </span>
          <span>
            <small>Shipped</small>
            <strong>{counts.shipped}</strong>
          </span>
        </button>

        <button
          type="button"
          className={`rp-admin-order-stat ${
            status === "DELIVERED" ? "active" : ""
          }`}
          onClick={() => setStatus("DELIVERED")}
        >
          <span className="rp-admin-stat-icon">
            <Check size={17} />
          </span>
          <span>
            <small>Delivered</small>
            <strong>{counts.delivered}</strong>
          </span>
        </button>
      </div>

      <div className="rp-admin-orders-toolbar">
        <div className="rp-admin-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order ID or customer..."
          />
        </div>

        <div className="rp-admin-status-filter">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "ALL" | OrderStatus)
            }
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All statuses"
                  : statusMeta[item].label}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </div>
      </div>

      {error && (
        <div className="rp-admin-error">
          <XCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="rp-admin-orders-card">
        <div className="rp-admin-orders-scroll">
          <div className="rp-admin-table-header">
            <div>ORDER</div>
            <div>CUSTOMER</div>
            <div>ITEMS</div>
            <div>TOTAL</div>
            <div>DATE</div>
            <div>PAYMENT</div>
            <div>ORDER STATUS</div>
            <div>ACTIONS</div>
          </div>{loading ? (
          <div className="rp-admin-table-empty">
            <LoaderCircle size={24} className="rp-spin" />
            <span>Loading orders from backend...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rp-admin-table-empty">
            <Package size={28} />
            <strong>No orders found</strong>
            <span>
              Try another search or status filter.
            </span>
          </div>
        ) : (
          visibleOrders.map((order) => {
            const orderId = getOrderId(order);
            const currentStatus = getOrderStatus(order);
            const meta = statusMeta[currentStatus];

            return (
              <div className="rp-admin-order-row" key={orderId}>
                <div>
                  <strong>
                    #{orderId.slice(0, 8).toUpperCase()}
                  </strong>
                  <small>{orderId}</small>
                </div>

                <div className="rp-admin-customer-cell">
                  <span className="rp-admin-customer-avatar">
                    {getCustomerLabel(order)
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                  <strong>{getCustomerLabel(order)}</strong>
                </div>

                <div>{getItemCount(order)}</div>

                <div>
                  <strong>{formatCurrency(getOrderAmount(order))}</strong>
                </div>

                <div>{formatDate(order.created_at)}</div>

                <div className="rp-admin-payment-status">
                  <span>Payment</span>
                  <strong
                    className={`rp-admin-payment-status-value ${String(
                      order.payment_status ?? "PENDING",
                    ).toLowerCase()}`}
                  >
                    {String(order.payment_status ?? "PENDING").toUpperCase()}
                  </strong>
                </div>

                <div className="rp-admin-order-status-cell">
                  <span className={`rp-admin-status ${meta.className}`}>
                    {meta.label}
                  </span>

                  <div className="rp-admin-status-picker">
                    <button
                      type="button"
                      className={`rp-admin-status-trigger ${
                        openStatusId === orderId ? "open" : ""
                      } ${currentStatus === "CANCELLED" ? "locked" : ""}`}
                      disabled={
                        updatingId === orderId || currentStatus === "CANCELLED"
                      }
                      onClick={() => {
                        if (currentStatus === "CANCELLED") return;

                        setOpenStatusId((current) =>
                          current === orderId ? null : orderId,
                        );
                      }}
                      aria-haspopup={currentStatus === "CANCELLED" ? undefined : "listbox"}
                      aria-expanded={
                        currentStatus === "CANCELLED"
                          ? false
                          : openStatusId === orderId
                      }
                      title={
                        currentStatus === "CANCELLED"
                          ? "Cancelled orders cannot be modified"
                          : "Change order status"
                      }
                    >
                      {updatingId === orderId ? (
                        <LoaderCircle size={14} className="rp-spin" />
                      ) : (
                        <span
                          className={`rp-admin-status-dot ${meta.className}`}
                        />
                      )}

                      {currentStatus !== "CANCELLED" && (
                        <ChevronDown
                          size={14}
                          className="rp-admin-status-chevron"
                        />
                      )}
                    </button>

                    {openStatusId === orderId && currentStatus !== "CANCELLED" && (
                      <div
                        className="rp-admin-status-menu"
                        role="listbox"
                        aria-label="Change order status"
                      >
                        {statuses
                          .filter((item) => item !== "ALL")
                          .map((item) => {
                            const itemMeta = statusMeta[item];
                            const isSelected = item === currentStatus;

                            return (
                              <button
                                key={item}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`rp-admin-status-option ${
                                  isSelected ? "selected" : ""
                                }`}
                                onClick={() => {
                                  setOpenStatusId(null);
                                  void handleStatusChange(orderId, item);
                                }}
                              >
                                <span
                                  className={`rp-admin-status-option-icon ${itemMeta.className}`}
                                >
                                  {item === "PENDING" && <Clock3 size={14} />}
                                  {item === "CONFIRMED" && <Check size={14} />}
                                  {item === "PROCESSING" && (
                                    <RefreshCw size={14} />
                                  )}
                                  {item === "SHIPPED" && <Truck size={14} />}
                                  {item === "DELIVERED" && <Package size={14} />}
                                  {item === "CANCELLED" && (
                                    <XCircle size={14} />
                                  )}
                                </span>

                                <span className="rp-admin-status-option-label">
                                  {itemMeta.label}
                                </span>

                                {isSelected && (
                                  <Check
                                    size={14}
                                    className="rp-admin-status-option-check"
                                  />
                                )}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rp-admin-order-actions">
                  <button
                    type="button"
                    title="Copy full order ID"
                    aria-label={`Copy order ID ${orderId}`}
                    onClick={() => {
                      void navigator.clipboard?.writeText(orderId);
                    }}
                  >
                    Copy ID
                  </button>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      <div className="rp-admin-orders-pagination">
        <span>
          Showing {filteredOrders.length ? (safePage - 1) * pageSize + 1 : 0}
          {" to "}
          {Math.min(safePage * pageSize, filteredOrders.length)}
          {" of "}{filteredOrders.length} orders
        </span>
        <div className="rp-admin-pagination-controls">
          <button type="button" disabled={safePage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
            Previous
          </button>
          <strong>Page {safePage} of {totalPages}</strong>
          <button type="button" disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
            Next
          </button>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}
            aria-label="Orders per page">
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>
    </section>
  );
}
