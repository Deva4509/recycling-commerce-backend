import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  LoaderCircle,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  ApiAdminPayment,
  getAdminPayments,
  markAdminPaymentPaid,
  processAdminPayment,
  refundAdminPayment,
} from "../lib/api";

type Filter =
  | "ALL"
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

const filters: Filter[] = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function methodLabel(method: string) {
  return method.replaceAll("_", " ");
}

function statusClass(status: string) {
  return `payment-status-${status.toLowerCase()}`;
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

export default function AdminPayments() {
  const [payments, setPayments] = useState<ApiAdminPayment[]>([]);
  const [stats, setStats] = useState({
    total_payments: 0,
    paid_payments: 0,
    pending_payments: 0,
    processing_payments: 0,
    failed_payments: 0,
    refunded_payments: 0,
    cancelled_payments: 0,
    total_received: 0,
    total_refunded: 0,
  });

  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] =
    useState<ApiAdminPayment | null>(null);

  async function loadPayments() {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminPayments({
        page: pageNumber,
        page_size: 10,
        search,
        status: filter,
      });

      setPayments(result.payments);
      setStats(result.stats);
      setTotalPages(result.pagination.total_pages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPayments();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [pageNumber, filter, search]);

  async function updatePayment(
    payment: ApiAdminPayment,
    action: "processing" | "paid" | "refund",
  ) {
    setUpdatingId(payment.id);
    setError("");

    try {
      if (action === "processing") {
        await processAdminPayment(payment.id);
      } else if (action === "paid") {
        await markAdminPaymentPaid(payment.id);
      } else {
        await refundAdminPayment(payment.id);
      }

      setSelectedPayment(null);
      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update payment.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function exportPayments() {
    const csv = [
      "Payment ID,Order ID,Customer,Email,Amount,Method,Status,Date",
      ...payments.map((payment) =>
        [
          payment.id,
          payment.order_id,
          `"${payment.customer_name.replaceAll('"', '""')}"`,
          payment.customer_email,
          payment.amount,
          payment.method,
          payment.status,
          payment.created_at,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "greencore-payments.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="rp-admin-payments-page">
      <div className="rp-admin-payments-hero">
        <div>
          <span className="rp-admin-eyebrow">
            PAYMENT OPERATIONS
          </span>

          <h1>Payments</h1>

          <p>
            Monitor transactions, payment status and financial activity
            from the backend.
          </p>
        </div>

        <div className="rp-admin-payment-total-card">
          <div className="rp-admin-payment-total-icon">
            <CreditCard size={28} />
          </div>

          <div>
            <span>Total Received</span>
            <strong>{formatCurrency(stats.total_received)}</strong>
            <small>
              {stats.paid_payments} successful payments
            </small>
          </div>
        </div>
      </div>

      <div className="rp-admin-payment-metrics">
        <div className="rp-admin-payment-metric">
          <div className="payment-metric-icon">
            <WalletCards size={21} />
          </div>
          <div>
            <span>Total Payments</span>
            <strong>{stats.total_payments}</strong>
          </div>
        </div>

        <div className="rp-admin-payment-metric">
          <div className="payment-metric-icon paid">
            <Check size={21} />
          </div>
          <div>
            <span>Paid</span>
            <strong>{stats.paid_payments}</strong>
          </div>
        </div>

        <div className="rp-admin-payment-metric">
          <div className="payment-metric-icon pending">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{stats.pending_payments}</strong>
          </div>
        </div>

        <div className="rp-admin-payment-metric">
          <div className="payment-metric-icon refund">
            <RefreshCw size={21} />
          </div>
          <div>
            <span>Refunded</span>
            <strong>
              {formatCurrency(stats.total_refunded)}
            </strong>
          </div>
        </div>
      </div>

      <div className="rp-admin-payments-toolbar">
        <div className="rp-admin-payments-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageNumber(1);
            }}
            placeholder="Search payments, orders, customers or IDs..."
          />
        </div>

        <div className="rp-admin-payment-filters">
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
              {item === "ALL" ? "All Payments" : statusLabel(item)}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="rp-admin-payment-export"
          disabled={payments.length === 0}
          onClick={exportPayments}
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {error && (
        <div className="rp-admin-error">
          <X size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="rp-admin-payments-card">
        <div className="rp-admin-payments-scroll">
          <div className="rp-admin-payment-table-header">
            <span>PAYMENT</span>
            <span>CUSTOMER</span>
            <span>ORDER</span>
            <span>AMOUNT</span>
            <span>METHOD</span>
            <span>DATE</span>
            <span>STATUS</span>
            <span>ACTION</span>
          </div>

          {loading ? (
            <div className="rp-admin-table-empty">
              <LoaderCircle size={24} className="rp-spin" />
              <span>Loading payments from backend...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="rp-admin-table-empty">
              <CreditCard size={28} />
              <strong>No payments found</strong>
              <span>Try another search or payment filter.</span>
            </div>
          ) : (
            payments.map((payment) => (
              <div
                className="rp-admin-payment-row"
                key={payment.id}
              >
                <div className="rp-admin-payment-identity">
                  <span className="payment-id-icon">
                    <CreditCard size={15} />
                  </span>

                  <div>
                    <strong>
                      #{payment.id.slice(0, 8).toUpperCase()}
                    </strong>
                    <small>{payment.id}</small>
                  </div>
                </div>

                <div className="rp-admin-payment-customer">
                  <span className="rp-admin-customer-avatar">
                    {initials(payment.customer_name)}
                  </span>

                  <div>
                    <strong>{payment.customer_name}</strong>
                    <small>{payment.customer_email}</small>
                  </div>
                </div>

                <div>
                  <strong>
                    #{payment.order_id.slice(0, 8).toUpperCase()}
                  </strong>
                </div>

                <div>
                  <strong>
                    {formatCurrency(payment.amount)}
                  </strong>
                </div>

                <div className="rp-admin-payment-method">
                  {methodLabel(payment.method)}
                </div>

                <div>{formatDate(payment.created_at)}</div>

                <div>
                  <span
                    className={`rp-admin-payment-status ${statusClass(
                      payment.status,
                    )}`}
                  >
                    <i />
                    {statusLabel(payment.status)}
                  </span>
                </div>

                <div className="rp-admin-payment-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="rp-admin-payments-footer">
            <span>
              Showing{" "}
              {payments.length
                ? `${(pageNumber - 1) * 10 + 1}–${Math.min(
                    (pageNumber - 1) * 10 + payments.length,
                    total,
                  )}`
                : "0"}{" "}
              of {total} payments
            </span>

            <div className="rp-admin-payment-pagination">
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

      {selectedPayment && (
        <div
          className="rp-admin-payment-modal-backdrop"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="rp-admin-payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="rp-admin-modal-close"
              onClick={() => setSelectedPayment(null)}
            >
              <X size={18} />
            </button>

            <span className="rp-admin-eyebrow">
              PAYMENT DETAILS
            </span>

            <h2>
              #{selectedPayment.id.slice(0, 8).toUpperCase()}
            </h2>

            <div className="rp-admin-payment-detail-status">
              <span
                className={`rp-admin-payment-status ${statusClass(
                  selectedPayment.status,
                )}`}
              >
                <i />
                {statusLabel(selectedPayment.status)}
              </span>
            </div>

            <div className="rp-admin-payment-detail-grid">
              <div>
                <span>CUSTOMER</span>
                <strong>{selectedPayment.customer_name}</strong>
              </div>

              <div>
                <span>EMAIL</span>
                <strong>{selectedPayment.customer_email}</strong>
              </div>

              <div>
                <span>ORDER</span>
                <strong>
                  #{selectedPayment.order_id.slice(0, 8).toUpperCase()}
                </strong>
              </div>

              <div>
                <span>AMOUNT</span>
                <strong>
                  {formatCurrency(selectedPayment.amount)}
                </strong>
              </div>

              <div>
                <span>METHOD</span>
                <strong>
                  {methodLabel(selectedPayment.method)}
                </strong>
              </div>

              <div>
                <span>PROVIDER</span>
                <strong>
                  {selectedPayment.provider || "Not specified"}
                </strong>
              </div>
            </div>

            {selectedPayment.failure_reason && (
              <div className="rp-admin-payment-failure">
                <span>FAILURE REASON</span>
                <strong>{selectedPayment.failure_reason}</strong>
              </div>
            )}

            {selectedPayment.status !== "CANCELLED" && (
              <div className="rp-admin-payment-modal-actions">
                {selectedPayment.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={updatingId === selectedPayment.id}
                    onClick={() =>
                      void updatePayment(
                        selectedPayment,
                        "processing",
                      )
                    }
                  >
                    {updatingId === selectedPayment.id ? (
                      <LoaderCircle size={15} className="rp-spin" />
                    ) : (
                      <RefreshCw size={15} />
                    )}
                    Processing
                  </button>
                )}

                {selectedPayment.status === "PROCESSING" && (
                  <button
                    type="button"
                    disabled={updatingId === selectedPayment.id}
                    onClick={() =>
                      void updatePayment(
                        selectedPayment,
                        "paid",
                      )
                    }
                  >
                    <Check size={15} />
                    Mark Paid
                  </button>
                )}

                {selectedPayment.status === "PAID" && (
                  <button
                    type="button"
                    disabled={updatingId === selectedPayment.id}
                    onClick={() =>
                      void updatePayment(
                        selectedPayment,
                        "refund",
                      )
                    }
                  >
                    <RefreshCw size={15} />
                    Refund Payment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
