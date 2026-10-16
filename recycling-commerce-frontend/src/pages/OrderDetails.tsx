import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  cancelOrder,
  getOrder,
  getOrderShipment,
  type ApiOrder,
  type ApiShipment,
} from "../lib/api";

const money = (value?: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(value))
    : "Date unavailable";

const trackingSteps = [
  ["PENDING", "Order placed", Clock3],
  ["PROCESSING", "Processing", RefreshCw],
  ["SHIPPED", "Shipped", Package],
  ["IN_TRANSIT", "In transit", Truck],
  ["OUT_FOR_DELIVERY", "Out for delivery", Truck],
  ["DELIVERED", "Delivered", CheckCircle2],
] as const;

const statusRank = (status?: string) => {
  const index = trackingSteps.findIndex(
    ([value]) => value === (status || "PENDING").toUpperCase(),
  );
  return index < 0 ? 0 : index;
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [shipment, setShipment] = useState<ApiShipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    setLoading(true);

    Promise.all([
      getOrder(orderId),
      getOrderShipment(orderId).catch(() => null),
    ])
      .then(([loadedOrder, loadedShipment]) => {
        setOrder(loadedOrder);
        setShipment(loadedShipment);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Unable to load this order.",
        );
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const currentStatus =
    shipment?.status?.toUpperCase() ||
    order?.status?.toUpperCase() ||
    "PENDING";

  const rank = statusRank(currentStatus);

  const itemsTotal = useMemo(
    () =>
      order?.items?.reduce(
        (sum, item) =>
          sum +
          Number(
            item.total_price ??
              item.unit_price ??
              0,
          ) *
            (item.total_price == null ? item.quantity : 1),
        0,
      ) ?? Number(order?.total_amount ?? 0),
    [order],
  );

  const cancel = async () => {
    if (!orderId) return;

    setCancelling(true);
    try {
      const updated = await cancelOrder(orderId);
      setOrder((current) =>
        current ? { ...current, ...updated, status: "CANCELLED" } : current,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to cancel this order.",
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="order-page rp-order-details-page">
        <div className="rp-detail-loading">
          <div>
            <RefreshCw size={25} />
          </div>
          Loading order details...
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="order-page">
        <div className="rp-order-not-found">
          <Package size={40} />
          <h1>Order not found</h1>
          <p>{error || "We couldn't find this order."}</p>
          <Link to="/account/orders">
            <ArrowLeft size={15} /> Back to orders
          </Link>
        </div>
      </main>
    );
  }

  const canCancel = ["PENDING", "CONFIRMED", "PROCESSING"].includes(
    (order.status || "").toUpperCase(),
  );

  return (
    <main className="order-page rp-order-details-page">
      <div className="rp-detail-shell">

        <Link className="rp-back-orders" to={searchParams.get("source") === "profile" ? "/account?section=orders" : "/account/orders"}>
          <ArrowLeft size={15} />
          Back to orders
        </Link>

        <section className="rp-detail-header">
          <div>
            <span>ORDER DETAILS</span>
            <h1>#{order.id.slice(0, 8).toUpperCase()}</h1>
            <p>Placed on {date(order.created_at)}</p>
          </div>

          <div className="rp-detail-header-right">
            <div className="rp-detail-total">{money(order.total_amount)}</div>
            <div className="rp-detail-status">
              {currentStatus.replaceAll("_", " ")}
            </div>
          </div>
        </section>

        {error && <div className="rp-orders-error">{error}</div>}

        <section className="rp-detail-panel">
          <div className="rp-panel-heading">
            <div>
              <span>YOUR JOURNEY</span>
              <h2>Order tracking</h2>
            </div>
            <Package size={21} />
          </div>

          {currentStatus === "CANCELLED" ? (
            <div className="rp-cancelled-tracking">
              <div className="rp-cancelled-track-line">
                <span />
              </div>

              <div className="rp-cancelled-track-step completed">
                <div className="rp-tracking-icon">
                  <Check size={15} />
                </div>
                <span>ORDER PLACED</span>
              </div>

              <div className="rp-cancelled-track-step cancelled">
                <div className="rp-tracking-icon">
                  <X size={16} />
                </div>
                <span>CANCELLED</span>
              </div>
            </div>
          ) : (
            <div className="rp-tracking">
              <div className="rp-tracking-line">
                <span
                  style={{
                    width: `${Math.min(100, (rank / 5) * 100)}%`,
                  }}
                />
              </div>

              {trackingSteps.map(([value, label, Icon], index) => {
                const completed = index < rank;
                const active = index === rank;

                return (
                  <div
                    className={`rp-tracking-step ${
                      completed ? "completed" : ""
                    } ${active ? "active" : ""}`}
                    key={value}
                  >
                    <div className="rp-tracking-icon">
                      {completed ? <Check size={15} /> : <Icon size={16} />}
                    </div>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {currentStatus === "CANCELLED" && (
            <div className="rp-cancelled-message">
              <X size={15} />
              <div>
                <strong>This order has been cancelled.</strong>
                <span>
                  No further processing, shipment, or delivery will occur.
                </span>
              </div>
            </div>
          )}

          {shipment?.tracking_number && currentStatus !== "CANCELLED" && (
            <div className="rp-tracking-number">
              <span>TRACKING NUMBER</span>
              <strong>{shipment.tracking_number}</strong>
            </div>
          )}
        </section>

        <div className="rp-detail-grid">
          <section className="rp-detail-panel">
            <div className="rp-panel-heading">
              <div>
                <span>ITEMS</span>
                <h2>
                  {order.items?.length || 0} item
                  {(order.items?.length || 0) === 1 ? "" : "s"}
                </h2>
              </div>
              <Package size={21} />
            </div>

            <div className="rp-detail-items">
              {order.items?.map((item, index) => (
                <div className="rp-detail-item" key={item.id || index}>
                  <div className="rp-detail-item-icon">
                    <Package size={19} />
                  </div>

                  <div>
                    <strong>
                      {"product_name" in item
                        ? String(
                            (item as ApiOrderItemWithName).product_name ||
                              "Recycled product",
                          )
                        : "Recycled product"}
                    </strong>
                    <small>
                      Qty {item.quantity}
                      {"sku" in item && (item as ApiOrderItemWithName).sku
                        ? ` • ${(item as ApiOrderItemWithName).sku}`
                        : ""}
                    </small>
                  </div>

                  <strong>
                    {money(
                      item.total_price ??
                        Number(item.unit_price ?? 0) * item.quantity,
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section className="rp-detail-panel">
            <div className="rp-panel-heading">
              <div>
                <span>ORDER SUMMARY</span>
                <h2>Payment breakdown</h2>
              </div>
              <CheckCircle2 size={21} />
            </div>

            <div className="rp-summary">
              <div>
                <span>Items</span>
                <strong>{money(itemsTotal)}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>{money(order.shipping_amount)}</strong>
              </div>
              <div>
                <span>Tax</span>
                <strong>{money(order.tax_amount)}</strong>
              </div>
              <div className="total">
                <span>Total</span>
                <strong>{money(order.total_amount)}</strong>
              </div>
            </div>
          </section>
        </div>

        <section className="rp-detail-panel rp-shipping-panel">
          <div className="rp-panel-heading">
            <div>
              <span>DELIVERY</span>
              <h2>Shipping address</h2>
            </div>
            <MapPin size={21} />
          </div>

          <div className="rp-address">
            <MapPin size={16} />
            <span>{order.shipping_address || "Shipping address unavailable"}</span>
          </div>
        </section>

        {currentStatus === "CANCELLED" ? (
          <section className="rp-cancelled-final-panel">
            <div className="rp-cancelled-final-icon">
              <X size={17} />
            </div>
            <div>
              <strong>Order cancelled</strong>
              <p>
                This order has been successfully cancelled and will not be
                processed or shipped.
              </p>
            </div>
          </section>
        ) : canCancel ? (
          <section className="rp-cancel-panel">
            <div>
              <X size={17} />
              <div>
                <strong>Need to cancel this order?</strong>
                <p>
                  You can cancel while the order is still being processed.
                </p>
              </div>
            </div>

            <button type="button" disabled={cancelling} onClick={cancel}>
              {cancelling ? "Cancelling..." : "Cancel order"}
            </button>
          </section>
        ) : null}

        <div className="rp-detail-footer-actions">
          <button type="button" onClick={() => navigate("/account/orders")}>
            <ArrowLeft size={15} />
            All orders
          </button>

          <Link to="/shop">
            Continue shopping
            <ArrowLeft size={15} style={{ transform: "rotate(180deg)" }} />
          </Link>
        </div>
      </div>
    </main>
  );
}

type ApiOrderItemWithName = {
  product_name?: string;
  sku?: string;
};
