import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addAdminBulkPricingTier,
  ApiBulkOrder,
  ApiBulkOrderConfig,
  ApiProduct,
  convertAdminBulkOrder,
  deleteAdminBulkPricingTier,
  getAdminBulkOrderConfig,
  getAdminBulkOrders,
  getAdminProducts,
  issueAdminBulkOrderQuote,
  updateAdminBulkOrder,
  updateAdminBulkOrderConfig,
} from "../lib/api";
import "./BulkOrders.css";

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function money(value: number | string | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export default function AdminBulkOrders() {
  const [requests, setRequests] = useState<ApiBulkOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<ApiBulkOrderConfig | null>(null);
  const [minimumQuantity, setMinimumQuantity] = useState("10");
  const [enabled, setEnabled] = useState(false);
  const [tierQuantity, setTierQuantity] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteValidUntil, setQuoteValidUntil] = useState(tomorrow());
  const [quoteTerms, setQuoteTerms] = useState("");
  const [working, setWorking] = useState(false);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) ?? null,
    [requests, selectedRequestId],
  );

  useEffect(() => {
    let cancelled = false;
    getAdminProducts()
      .then((items) => {
        if (!cancelled) {
          setProducts(items);
          if (items.length > 0) setSelectedProductId((current) => current || items[0].id);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getAdminBulkOrders({ status: statusFilter, search })
      .then((items) => {
        if (!cancelled) {
          setRequests(items);
          setSelectedRequestId((current) =>
            items.some((item) => item.id === current) ? current : "",
          );
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load bulk requests.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, search]);

  useEffect(() => {
    if (!selectedRequest) return;
    setAdminNotes(selectedRequest.admin_notes || "");
    setQuotePrice(
      selectedRequest.quoted_unit_price == null
        ? ""
        : String(selectedRequest.quoted_unit_price),
    );
    setQuoteValidUntil(selectedRequest.quote_valid_until || tomorrow());
    setQuoteTerms(selectedRequest.quote_terms || "");
  }, [selectedRequest]);

  useEffect(() => {
    if (!selectedProductId) {
      setConfig(null);
      return;
    }
    let cancelled = false;
    setConfigLoading(true);
    getAdminBulkOrderConfig(selectedProductId)
      .then((value) => {
        if (!cancelled) {
          setConfig(value);
          setMinimumQuantity(String(value.minimum_quantity));
          setEnabled(value.is_enabled);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load product settings.");
        }
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProductId]);

  async function performAction(action: () => Promise<ApiBulkOrder>, success: string) {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const updated = await action();
      setRequests((current) =>
        current.map((request) => (request.id === updated.id ? updated : request)),
      );
      setMessage(success);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The action failed.");
    } finally {
      setWorking(false);
    }
  }

  async function saveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProductId) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateAdminBulkOrderConfig(selectedProductId, {
        minimum_quantity: Number(minimumQuantity),
        is_enabled: enabled,
      });
      setConfig(updated);
      setMinimumQuantity(String(updated.minimum_quantity));
      setEnabled(updated.is_enabled);
      setMessage("Bulk ordering configuration saved.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to save configuration.");
    } finally {
      setWorking(false);
    }
  }

  async function addTier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProductId) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const tier = await addAdminBulkPricingTier(selectedProductId, {
        minimum_quantity: Number(tierQuantity),
        unit_price: Number(tierPrice),
      });
      setConfig((current) =>
        current
          ? {
              ...current,
              pricing_tiers: [...current.pricing_tiers, tier].sort(
                (left, right) => left.minimum_quantity - right.minimum_quantity,
              ),
            }
          : current,
      );
      setTierQuantity("");
      setTierPrice("");
      setMessage("Pricing tier added.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to add pricing tier.");
    } finally {
      setWorking(false);
    }
  }

  async function removeTier(tierId: string) {
    if (!selectedProductId) return;
    setWorking(true);
    setError("");
    try {
      await deleteAdminBulkPricingTier(selectedProductId, tierId);
      setConfig((current) =>
        current
          ? {
              ...current,
              pricing_tiers: current.pricing_tiers.filter((tier) => tier.id !== tierId),
            }
          : current,
      );
      setMessage("Pricing tier removed.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to remove pricing tier.");
    } finally {
      setWorking(false);
    }
  }

  async function saveNotes() {
    if (!selectedRequest) return;
    await performAction(
      () => updateAdminBulkOrder(selectedRequest.id, { admin_notes: adminNotes || null }),
      "Internal notes saved.",
    );
  }

  async function issueQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRequest) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const updated = await issueAdminBulkOrderQuote(selectedRequest.id, {
        unit_price: Number(quotePrice),
        valid_until: quoteValidUntil,
        terms: quoteTerms.trim() || undefined,
      });
      setRequests((current) =>
        current.map((request) => (request.id === updated.id ? updated : request)),
      );
      setMessage("Quote issued to the customer.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to issue quote.");
    } finally {
      setWorking(false);
    }
  }

  async function convertRequest() {
    if (!selectedRequest) return;
    if (!window.confirm("Create an order and reserve the required stock for this accepted quote?")) {
      return;
    }
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const order = await convertAdminBulkOrder(selectedRequest.id);
      setRequests((current) =>
        current.map((request) =>
          request.id === selectedRequest.id
            ? { ...request, converted_order_id: order.id }
            : request,
        ),
      );
      setMessage(`Order ${order.id} created and stock reserved.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to convert this quote.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="bulk-admin-page">
      <section className="bulk-hero">
        <div className="bulk-hero-emblem" aria-hidden="true">⬡</div>
        <div className="bulk-hero-copy">
          <div className="bulk-eyebrow">GREENCORE / WHOLESALE CONTROL</div>
          <h1>Bulk <span>Orders</span></h1>
          <p>Review customer requests, configure wholesale pricing, and convert accepted quotes into stock-reserved orders.</p>
        </div>
        <div className="bulk-hero-stats">
          <article className="bulk-stat"><span className="bulk-stat-icon">◇</span><strong>{requests.length}</strong><small>Total Requests</small></article>
          <article className="bulk-stat"><span className="bulk-stat-icon">◷</span><strong>{requests.filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW").length}</strong><small>Pending Review</small></article>
          <article className="bulk-stat"><span className="bulk-stat-icon">▤</span><strong>{requests.filter((r) => r.status === "QUOTE_SENT").length}</strong><small>Quotes Sent</small></article>
        </div>
      </section>
      {error && <p className="bulk-page-error" role="alert">{error}</p>}
      {message && <p className="bulk-page-success" role="status">{message}</p>}

      <section className="bulk-admin-panel">
        <h2>Product bulk settings</h2>
        <div className="bulk-admin-form">
          <label>
            Product
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.sku}
                </option>
              ))}
            </select>
          </label>
        </div>
        {configLoading ? (
          <div className="bulk-state">Loading configuration…</div>
        ) : config ? (
          <>
            <form className="bulk-admin-form" onSubmit={saveConfig}>
              <label>
                Minimum quantity
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={minimumQuantity}
                  onChange={(event) => setMinimumQuantity(event.target.value)}
                />
              </label>
              <label className="bulk-check-label">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                />
                Enable bulk ordering
              </label>
              <button className="bulk-button bulk-submit" disabled={working}>
                Save settings
              </button>
            </form>
            <div className="bulk-admin-section">
              <h3>Volume pricing tiers</h3>
              {config.pricing_tiers.map((tier) => (
                <div className="bulk-tier-row" key={tier.id}>
                  <span>{tier.minimum_quantity}+ units · {money(tier.unit_price)} / unit</span>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => void removeTier(tier.id)}
                    aria-label={`Delete tier at ${tier.minimum_quantity} units`}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {config.pricing_tiers.length === 0 && (
                <p>No public pricing tiers configured.</p>
              )}
              <form className="bulk-admin-form" onSubmit={addTier}>
                <label>
                  Minimum quantity
                  <input
                    required
                    type="number"
                    min={config.minimum_quantity}
                    value={tierQuantity}
                    onChange={(event) => setTierQuantity(event.target.value)}
                  />
                </label>
                <label>
                  Unit price (INR)
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={tierPrice}
                    onChange={(event) => setTierPrice(event.target.value)}
                  />
                </label>
                <button className="bulk-button bulk-submit" disabled={working}>
                  Add pricing tier
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="bulk-state">Choose a product to configure bulk orders.</div>
        )}
      </section>

      <div className="bulk-admin-toolbar">
        <select
          className="bulk-filter"
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          {["ALL", "PENDING", "UNDER_REVIEW", "QUOTE_SENT", "ACCEPTED", "REJECTED", "FULFILLED"].map((value) => (
            <option key={value} value={value}>{value === "ALL" ? "All statuses" : value.replaceAll("_", " ")}</option>
          ))}
        </select>
        <input
          className="bulk-filter"
          type="search"
          placeholder="Search product, contact, or organization"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="bulk-admin-layout">
        <section className="bulk-admin-list" aria-label="Bulk order requests">
          {loading ? (
            <div className="bulk-state">Loading requests…</div>
          ) : requests.length === 0 ? (
            <div className="bulk-state">No bulk requests match these filters.</div>
          ) : requests.map((request) => (
            <button
              className={`bulk-admin-request ${selectedRequestId === request.id ? "active" : ""}`}
              type="button"
              key={request.id}
              onClick={() => setSelectedRequestId(request.id)}
            >
              <strong>{request.organization_name} · {request.quantity} units</strong>
              <span>{request.contact_name} · {request.status.replaceAll("_", " ")}</span>
              <span>{request.product_id}</span>
            </button>
          ))}
        </section>

        <section className="bulk-admin-panel">
          {!selectedRequest ? (
            <div className="bulk-state">Select a request to review its details.</div>
          ) : (
            <>
              <div className="bulk-card-heading">
                <h2>{selectedRequest.organization_name}</h2>
                <span className="bulk-status">{selectedRequest.status.replaceAll("_", " ")}</span>
              </div>
              <dl className="bulk-order-meta">
                <div><dt>Contact</dt><dd>{selectedRequest.contact_name}</dd></div>
                <div><dt>Email / phone</dt><dd>{selectedRequest.contact_email}<br />{selectedRequest.contact_phone}</dd></div>
                <div><dt>Product / quantity</dt><dd>{selectedRequest.product_id}<br />{selectedRequest.quantity} units</dd></div>
                <div><dt>Delivery</dt><dd>{selectedRequest.delivery_address}<br />PIN {selectedRequest.delivery_pin_code}</dd></div>
                <div><dt>Expected delivery</dt><dd>{selectedRequest.expected_delivery_date || "Not specified"}</dd></div>
                <div><dt>Intended use</dt><dd>{selectedRequest.intended_use || "Not specified"}</dd></div>
              </dl>
              <div className="bulk-actions">
                {selectedRequest.status === "PENDING" && (
                  <button
                    type="button"
                    className="bulk-button"
                    disabled={working}
                    onClick={() => void performAction(
                      () => updateAdminBulkOrder(selectedRequest.id, { status: "UNDER_REVIEW" }),
                      "Request moved to review.",
                    )}
                  >
                    Start review
                  </button>
                )}
                {selectedRequest.status === "QUOTE_SENT" && (
                  <button
                    type="button"
                    className="bulk-button secondary"
                    disabled={working}
                    onClick={() => void performAction(
                      () => updateAdminBulkOrder(selectedRequest.id, { status: "UNDER_REVIEW" }),
                      "Quote withdrawn. Request is under review.",
                    )}
                  >
                    Withdraw quote
                  </button>
                )}
                {selectedRequest.status === "REJECTED" && (
                  <button
                    type="button"
                    className="bulk-button secondary"
                    disabled={working}
                    onClick={() => void performAction(
                      () => updateAdminBulkOrder(selectedRequest.id, { status: "UNDER_REVIEW" }),
                      "Request reopened for review.",
                    )}
                  >
                    Reopen request
                  </button>
                )}
                {selectedRequest.status === "ACCEPTED" && !selectedRequest.converted_order_id && (
                  <button
                    type="button"
                    className="bulk-button"
                    disabled={working}
                    onClick={() => void convertRequest()}
                  >
                    {working ? "Converting…" : "Convert to stock-reserved order"}
                  </button>
                )}
                {selectedRequest.status === "ACCEPTED" && selectedRequest.converted_order_id && (
                  <button
                    type="button"
                    className="bulk-button secondary"
                    disabled={working}
                    onClick={() => void performAction(
                      () => updateAdminBulkOrder(selectedRequest.id, { status: "FULFILLED" }),
                      "Bulk request marked fulfilled.",
                    )}
                  >
                    Mark fulfilled after delivery
                  </button>
                )}
                {selectedRequest.converted_order_id && (
                  <span>Converted order: {selectedRequest.converted_order_id}</span>
                )}
              </div>

              {selectedRequest.status === "UNDER_REVIEW" && (
                <form className="bulk-admin-section bulk-admin-form" onSubmit={issueQuote}>
                  <h3 className="bulk-form-wide">Issue quote</h3>
                  <label>
                    Unit price (INR)
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={quotePrice}
                      onChange={(event) => setQuotePrice(event.target.value)}
                    />
                  </label>
                  <label>
                    Valid until
                    <input
                      required
                      type="date"
                      min={tomorrow()}
                      value={quoteValidUntil}
                      onChange={(event) => setQuoteValidUntil(event.target.value)}
                    />
                  </label>
                  <label className="bulk-form-wide">
                    Quote terms
                    <textarea
                      value={quoteTerms}
                      onChange={(event) => setQuoteTerms(event.target.value)}
                    />
                  </label>
                  <button className="bulk-button bulk-submit" disabled={working}>
                    Send quote
                  </button>
                </form>
              )}
              <section className="bulk-admin-section">
                <h3>Internal notes</h3>
                <textarea
                  className="bulk-filter"
                  rows={4}
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  aria-label="Internal notes (staff only)"
                />
                <div className="bulk-actions">
                  <button
                    className="bulk-button secondary"
                    type="button"
                    disabled={working}
                    onClick={() => void saveNotes()}
                  >
                    Save internal notes
                  </button>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
