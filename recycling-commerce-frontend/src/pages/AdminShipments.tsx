import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  Search,
  Truck,
  X,
  LoaderCircle,
  Navigation,
  CircleCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  ApiAdminShipment,
  getAdminShipments,
  processAdminShipment,
  shipAdminShipment,
  transitAdminShipment,
  deliverAdminShipment,
  cancelAdminShipment,
} from "../lib/api";

type Filter =
  | "ALL"
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

const filters: Filter[] = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  return `shipment-status-${status.toLowerCase()}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AdminShipments() {
  const [shipments, setShipments] = useState<ApiAdminShipment[]>([]);
  const [stats, setStats] = useState({
    total_shipments: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    in_transit: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  });

  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedShipment, setSelectedShipment] =
    useState<ApiAdminShipment | null>(null);

  async function loadShipments() {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminShipments({
        page: pageNumber,
        page_size: 10,
        search,
        status: filter,
      });

      setShipments(result.shipments);
      setStats(result.stats);
      setTotalPages(result.pagination.total_pages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load shipments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadShipments();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [pageNumber, filter, search]);

  async function updateShipment(
    shipment: ApiAdminShipment,
    action:
      | "processing"
      | "ship"
      | "transit"
      | "deliver"
      | "cancel",
  ) {
    setUpdatingId(shipment.id);
    setError("");

    try {
      if (action === "processing") {
        await processAdminShipment(shipment.id);
      } else if (action === "ship") {
        await shipAdminShipment(
          shipment.id,
          shipment.carrier || undefined,
          shipment.tracking_number || undefined,
        );
      } else if (action === "transit") {
        await transitAdminShipment(shipment.id);
      } else if (action === "deliver") {
        await deliverAdminShipment(shipment.id);
      } else {
        await cancelAdminShipment(shipment.id);
      }

      setSelectedShipment(null);
      await loadShipments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update shipment.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="rp-admin-shipments-page">
      <div className="rp-admin-shipments-hero">
        <div>
          <span className="rp-admin-eyebrow">
            SHIPMENT OPERATIONS
          </span>

          <h1>Shipments</h1>

          <p>
            Track deliveries, manage fulfilment and keep every order
            moving.
          </p>
        </div>

        <div className="rp-admin-shipment-total-card">
          <div className="rp-admin-shipment-total-icon">
            <Truck size={28} />
          </div>

          <div>
            <span>Total Shipments</span>
            <strong>{stats.total_shipments}</strong>
            <small>
              {stats.delivered} delivered
            </small>
          </div>
        </div>
      </div>

      <div className="rp-admin-shipment-metrics">
        <div className="rp-admin-shipment-metric">
          <div className="shipment-metric-icon">
            <Package size={20} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="rp-admin-shipment-metric">
          <div className="shipment-metric-icon processing">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Processing</span>
            <strong>{stats.processing}</strong>
          </div>
        </div>

        <div className="rp-admin-shipment-metric">
          <div className="shipment-metric-icon transit">
            <Navigation size={20} />
          </div>
          <div>
            <span>In Transit</span>
            <strong>{stats.in_transit}</strong>
          </div>
        </div>

        <div className="rp-admin-shipment-metric">
          <div className="shipment-metric-icon delivered">
            <CircleCheck size={20} />
          </div>
          <div>
            <span>Delivered</span>
            <strong>{stats.delivered}</strong>
          </div>
        </div>
      </div>

      <div className="rp-admin-shipments-toolbar">
        <div className="rp-admin-shipments-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageNumber(1);
            }}
            placeholder="Search shipments, orders, customers or tracking..."
          />
        </div>

        <div className="rp-admin-shipment-filters">
          {filters.map((item) => (
            <button
              type="button"
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => {
                setFilter(item);
                setPageNumber(1);
              }}
            >
              {item === "ALL"
                ? "All Shipments"
                : statusLabel(item)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rp-admin-error">
          <X size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="rp-admin-shipments-card">
        <div className="rp-admin-shipments-scroll">
          <div className="rp-admin-shipment-table-header">
            <span>SHIPMENT</span>
            <span>CUSTOMER</span>
            <span>ORDER</span>
            <span>CARRIER</span>
            <span>TRACKING</span>
            <span>DATE</span>
            <span>STATUS</span>
            <span>ACTION</span>
          </div>

          {loading ? (
            <div className="rp-admin-table-empty">
              <LoaderCircle size={24} className="rp-spin" />
              <span>Loading shipments from backend...</span>
            </div>
          ) : shipments.length === 0 ? (
            <div className="rp-admin-table-empty">
              <Truck size={28} />
              <strong>No shipments found</strong>
              <span>
                Try another search or shipment filter.
              </span>
            </div>
          ) : (
            shipments.map((shipment) => (
              <div
                className="rp-admin-shipment-row"
                key={shipment.id}
              >
                <div className="rp-admin-shipment-identity">
                  <span className="shipment-id-icon">
                    <Truck size={15} />
                  </span>

                  <div>
                    <strong>
                      #{shipment.id.slice(0, 8).toUpperCase()}
                    </strong>
                    <small>{shipment.id}</small>
                  </div>
                </div>

                <div className="rp-admin-shipment-customer">
                  <span className="rp-admin-customer-avatar">
                    {initials(shipment.customer_name)}
                  </span>

                  <div>
                    <strong>{shipment.customer_name}</strong>
                    <small>{shipment.customer_email}</small>
                  </div>
                </div>

                <div>
                  <strong>
                    #{shipment.order_id.slice(0, 8).toUpperCase()}
                  </strong>
                </div>

                <div className="rp-admin-shipment-carrier">
                  {shipment.carrier || "Not assigned"}
                </div>

                <div className="rp-admin-shipment-tracking">
                  {shipment.tracking_number || "—"}
                </div>

                <div>{formatDate(shipment.created_at)}</div>

                <div>
                  <span
                    className={`rp-admin-shipment-status ${statusClass(
                      shipment.status,
                    )}`}
                  >
                    <i />
                    {statusLabel(shipment.status)}
                  </span>
                </div>

                <div className="rp-admin-shipment-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedShipment(shipment)
                    }
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="rp-admin-shipments-footer">
            <span>
              Showing{" "}
              {shipments.length
                ? `${(pageNumber - 1) * 10 + 1}–${Math.min(
                    (pageNumber - 1) * 10 + shipments.length,
                    total,
                  )}`
                : "0"}{" "}
              of {total} shipments
            </span>

            <div className="rp-admin-shipment-pagination">
              <button
                type="button"
                disabled={pageNumber <= 1}
                onClick={() =>
                  setPageNumber((current) => current - 1)
                }
              >
                <ChevronLeft size={16} />
              </button>

              <span>{pageNumber}</span>

              <button
                type="button"
                disabled={pageNumber >= totalPages}
                onClick={() =>
                  setPageNumber((current) => current + 1)
                }
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedShipment && (
        <div
          className="rp-admin-shipment-modal-backdrop"
          onClick={() => setSelectedShipment(null)}
        >
          <div
            className="rp-admin-shipment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="rp-admin-modal-close"
              onClick={() => setSelectedShipment(null)}
            >
              <X size={18} />
            </button>

            <span className="rp-admin-eyebrow">
              SHIPMENT DETAILS
            </span>

            <h2>
              #{selectedShipment.id.slice(0, 8).toUpperCase()}
            </h2>

            <div className="rp-admin-shipment-detail-status">
              <span
                className={`rp-admin-shipment-status ${statusClass(
                  selectedShipment.status,
                )}`}
              >
                <i />
                {statusLabel(selectedShipment.status)}
              </span>
            </div>

            <div className="rp-admin-shipment-detail-grid">
              <div>
                <span>CUSTOMER</span>
                <strong>
                  {selectedShipment.customer_name}
                </strong>
              </div>

              <div>
                <span>EMAIL</span>
                <strong>
                  {selectedShipment.customer_email}
                </strong>
              </div>

              <div>
                <span>ORDER</span>
                <strong>
                  #{selectedShipment.order_id.slice(0, 8).toUpperCase()}
                </strong>
              </div>

              <div>
                <span>CARRIER</span>
                <strong>
                  {selectedShipment.carrier || "Not assigned"}
                </strong>
              </div>

              <div>
                <span>TRACKING NUMBER</span>
                <strong>
                  {selectedShipment.tracking_number || "Not assigned"}
                </strong>
              </div>

              <div>
                <span>CREATED</span>
                <strong>
                  {formatDate(selectedShipment.created_at)}
                </strong>
              </div>
            </div>

            <div className="rp-admin-shipment-address">
              <span>
                <MapPin size={14} />
                SHIPPING ADDRESS
              </span>
              <strong>
                {selectedShipment.shipping_address}
              </strong>
            </div>

            {selectedShipment.notes && (
              <div className="rp-admin-shipment-notes">
                <span>NOTES</span>
                <strong>{selectedShipment.notes}</strong>
              </div>
            )}

            {selectedShipment.status !== "CANCELLED" &&
              selectedShipment.status !== "DELIVERED" && (
                <div className="rp-admin-shipment-modal-actions">
                  {selectedShipment.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={
                        updatingId === selectedShipment.id
                      }
                      onClick={() =>
                        void updateShipment(
                          selectedShipment,
                          "processing",
                        )
                      }
                    >
                      <Clock3 size={15} />
                      Processing
                    </button>
                  )}

                  {selectedShipment.status === "PROCESSING" && (
                    <button
                      type="button"
                      disabled={
                        updatingId === selectedShipment.id
                      }
                      onClick={() =>
                        void updateShipment(
                          selectedShipment,
                          "ship",
                        )
                      }
                    >
                      <Truck size={15} />
                      Mark Shipped
                    </button>
                  )}

                  {selectedShipment.status === "SHIPPED" && (
                    <button
                      type="button"
                      disabled={
                        updatingId === selectedShipment.id
                      }
                      onClick={() =>
                        void updateShipment(
                          selectedShipment,
                          "transit",
                        )
                      }
                    >
                      <Navigation size={15} />
                      In Transit
                    </button>
                  )}

                  {selectedShipment.status === "IN_TRANSIT" && (
                    <button
                      type="button"
                      disabled={
                        updatingId === selectedShipment.id
                      }
                      onClick={() =>
                        void updateShipment(
                          selectedShipment,
                          "deliver",
                        )
                      }
                    >
                      <Check size={15} />
                      Mark Delivered
                    </button>
                  )}

                  <button
                    type="button"
                    className="danger"
                    disabled={
                      updatingId === selectedShipment.id
                    }
                    onClick={() =>
                      void updateShipment(
                        selectedShipment,
                        "cancel",
                      )
                    }
                  >
                    <X size={15} />
                    Cancel Shipment
                  </button>

                  {updatingId === selectedShipment.id && (
                    <LoaderCircle
                      size={16}
                      className="rp-spin"
                    />
                  )}
                </div>
              )}
          </div>
        </div>
      )}
    </section>
  );
}
