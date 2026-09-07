import {
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Search,
  Users,
  UserCheck,
  UserPlus,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  ApiAdminCustomer,
  getAdminCustomers,
} from "../lib/api";

type Filter = "ALL" | "ACTIVE" | "DISABLED" | "UNVERIFIED";

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

function initials(customer: ApiAdminCustomer) {
  return `${customer.first_name?.[0] ?? ""}${customer.last_name?.[0] ?? ""}`
    .toUpperCase();
}

function fullName(customer: ApiAdminCustomer) {
  return `${customer.first_name} ${customer.last_name}`.trim();
}

function statusLabel(status: string) {
  if (status === "ACTIVE") return "Active";
  if (status === "DISABLED") return "Disabled";
  return "Unverified";
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<ApiAdminCustomer[]>([]);
  const [stats, setStats] = useState({
    total_customers: 0,
    active_customers: 0,
    new_this_month: 0,
    total_spent: 0,
    average_orders: 0,
  });
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<ApiAdminCustomer | null>(null);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminCustomers({
        page,
        page_size: 8,
        search,
        status: filter,
      });

      setCustomers(result.customers);
      setStats(result.stats);
      setTotalPages(result.pagination.total_pages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCustomers();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [page, filter, search]);

  function changeFilter(next: Filter) {
    setFilter(next);
    setPage(1);
  }

  function exportCustomers() {
    const rows = customers.map((customer) => ({
      name: fullName(customer),
      email: customer.email,
      orders: customer.orders,
      total_spent: customer.total_spent,
      joined: customer.created_at,
      status: customer.status,
    }));

    const csv = [
      "Name,Email,Orders,Total Spent,Joined,Status",
      ...rows.map((row) =>
        [
          `"${row.name.replaceAll('"', '""')}"`,
          `"${row.email.replaceAll('"', '""')}"`,
          row.orders,
          row.total_spent,
          row.joined,
          row.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "greencore-customers.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="rp-admin-customers-page">
      <div className="rp-admin-customers-hero">
        <div>
          <span className="rp-admin-eyebrow">
            CUSTOMER MANAGEMENT
          </span>

          <h1>Customers</h1>

          <p>
            Manage your customers, view their activity and build
            lasting relationships.
          </p>
        </div>

        <div className="rp-admin-customers-total-card">
          <div className="rp-admin-customers-total-icon">
            <Users size={30} />
          </div>

          <div>
            <span>Total Customers</span>
            <strong>{stats.total_customers.toLocaleString("en-IN")}</strong>
            <small>registered accounts</small>
          </div>
        </div>
      </div>

      <div className="rp-admin-customer-metrics">
        <div className="rp-admin-customer-metric">
          <div className="customer-metric-icon">
            <UserCheck size={21} />
          </div>
          <div>
            <span>Active Customers</span>
            <strong>{stats.active_customers.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="rp-admin-customer-metric">
          <div className="customer-metric-icon cyan">
            <UserPlus size={21} />
          </div>
          <div>
            <span>New This Month</span>
            <strong>{stats.new_this_month.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="rp-admin-customer-metric">
          <div className="customer-metric-icon gold">
            <WalletCards size={21} />
          </div>
          <div>
            <span>Total Spent</span>
            <strong>{formatCurrency(stats.total_spent)}</strong>
          </div>
        </div>

        <div className="rp-admin-customer-metric">
          <div className="customer-metric-icon">
            <Users size={21} />
          </div>
          <div>
            <span>Avg. Orders / Customer</span>
            <strong>{stats.average_orders}</strong>
          </div>
        </div>
      </div>

      <div className="rp-admin-customers-toolbar">
        <div className="rp-admin-customers-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search customers by name, email or ID..."
          />
        </div>

        <div className="rp-admin-customer-filters">
          {(["ALL", "ACTIVE", "DISABLED", "UNVERIFIED"] as Filter[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                className={filter === item ? "active" : ""}
                onClick={() => changeFilter(item)}
              >
                {item === "ALL"
                  ? "All Customers"
                  : statusLabel(item)}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="rp-admin-customer-export"
          onClick={exportCustomers}
          disabled={customers.length === 0}
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

      <div className="rp-admin-customers-card">
        <div className="rp-admin-customers-scroll">
          <div className="rp-admin-customer-table-header">
            <span>CUSTOMER</span>
            <span>EMAIL</span>
            <span>ORDERS</span>
            <span>TOTAL SPENT</span>
            <span>JOINED DATE</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>

          {loading ? (
            <div className="rp-admin-table-empty">
              Loading customers from backend...
            </div>
          ) : customers.length === 0 ? (
            <div className="rp-admin-table-empty">
              <Users size={28} />
              <strong>No customers found</strong>
              <span>Try another search or filter.</span>
            </div>
          ) : (
            customers.map((customer) => (
              <div
                className="rp-admin-customer-row"
                key={customer.id}
              >
                <div className="rp-admin-customer-identity">
                  <span className="rp-admin-customer-avatar">
                    {initials(customer)}
                  </span>

                  <div>
                    <strong>{fullName(customer)}</strong>
                    <small>#{customer.id.slice(0, 8)}</small>
                  </div>
                </div>

                <div className="rp-admin-customer-email">
                  <Mail size={14} />
                  <span>{customer.email}</span>
                </div>

                <div>{customer.orders}</div>

                <div>
                  <strong>
                    {formatCurrency(customer.total_spent)}
                  </strong>
                </div>

                <div>{formatDate(customer.created_at)}</div>

                <div>
                  <span
                    className={`rp-admin-customer-status customer-status-${customer.status.toLowerCase()}`}
                  >
                    <i />
                    {statusLabel(customer.status)}
                  </span>
                </div>

                <div className="rp-admin-customer-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="rp-admin-customers-footer">
            <span>
              Showing{" "}
              {customers.length
                ? `${(page - 1) * 8 + 1}–${Math.min(
                    (page - 1) * 8 + customers.length,
                    total,
                  )}`
                : "0"}{" "}
              of {total.toLocaleString("en-IN")} customers
            </span>

            <div className="rp-admin-customer-pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft size={16} />
              </button>

              <span>{page}</span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedCustomer && (
        <div
          className="rp-admin-customer-modal-backdrop"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="rp-admin-customer-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="rp-admin-modal-close"
              onClick={() => setSelectedCustomer(null)}
            >
              <X size={18} />
            </button>

            <span className="rp-admin-eyebrow">
              CUSTOMER PROFILE
            </span>

            <div className="rp-admin-customer-modal-profile">
              <span className="rp-admin-customer-avatar large">
                {initials(selectedCustomer)}
              </span>

              <div>
                <h2>{fullName(selectedCustomer)}</h2>
                <p>{selectedCustomer.email}</p>
              </div>
            </div>

            <div className="rp-admin-customer-modal-grid">
              <div>
                <span>ACCOUNT STATUS</span>
                <strong>{statusLabel(selectedCustomer.status)}</strong>
              </div>

              <div>
                <span>ORDERS</span>
                <strong>{selectedCustomer.orders}</strong>
              </div>

              <div>
                <span>TOTAL SPENT</span>
                <strong>
                  {formatCurrency(selectedCustomer.total_spent)}
                </strong>
              </div>

              <div>
                <span>PHONE</span>
                <strong>{selectedCustomer.phone || "Not provided"}</strong>
              </div>

              <div>
                <span>JOINED</span>
                <strong>{formatDate(selectedCustomer.created_at)}</strong>
              </div>

              <div>
                <span>EMAIL VERIFIED</span>
                <strong>
                  {selectedCustomer.email_verified ? "Yes" : "No"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
