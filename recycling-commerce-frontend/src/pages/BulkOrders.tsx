import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptBulkOrderQuote,
  ApiBulkOrder,
  getMyBulkOrders,
  rejectBulkOrderQuote,
} from "../lib/api";
import "./BulkOrders.css";

function money(value: number | string | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function quoteExpired(request: ApiBulkOrder) {
  return Boolean(
    request.quote_valid_until &&
      request.quote_valid_until < new Date().toISOString().slice(0, 10),
  );
}

export default function BulkOrders() {
  const [requests, setRequests] = useState<ApiBulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await getMyBulkOrders());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your bulk orders.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function respond(request: ApiBulkOrder, action: "accept" | "reject") {
    setWorkingId(request.id);
    setMessage("");
    try {
      const updated =
        action === "accept"
          ? await acceptBulkOrderQuote(request.id)
          : await rejectBulkOrderQuote(request.id);
      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(
        action === "accept"
          ? "Quote accepted. Payment will be arranged separately."
          : "Quote rejected.",
      );
    } catch (actionError) {
      setMessage(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update this quote.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="bulk-page">
      <h1>My bulk orders</h1>
      <p className="bulk-page-intro">
        Track your wholesale requests and review quotes from GreenCore.
      </p>
      {message && <p className="bulk-page-success" role="status">{message}</p>}
      {error && <p className="bulk-page-error" role="alert">{error}</p>}

      {loading ? (
        <div className="bulk-state" role="status">Loading your requests…</div>
      ) : requests.length === 0 ? (
        <div className="bulk-state">
          <p>You have not submitted any bulk order requests yet.</p>
          <Link to="/shop">Explore products</Link>
        </div>
      ) : (
        <div className="bulk-order-list">
          {requests.map((request) => {
            const expired = quoteExpired(request);
            const awaitingResponse =
              request.status === "QUOTE_SENT" && !expired;
            return (
              <article className="bulk-page-card" key={request.id}>
                <div className="bulk-card-heading">
                  <div>
                    <h2>{request.organization_name}</h2>
                    <p>Request {request.id.slice(0, 8)} · Product {request.product_id}</p>
                  </div>
                  <span className="bulk-status">{request.status.replaceAll("_", " ")}</span>
                </div>
                <dl className="bulk-order-meta">
                  <div><dt>Quantity</dt><dd>{request.quantity} units</dd></div>
                  <div><dt>Submitted</dt><dd>{new Date(request.created_at).toLocaleDateString()}</dd></div>
                  <div><dt>Quoted unit price</dt><dd>{money(request.quoted_unit_price)}</dd></div>
                  <div><dt>Quoted total</dt><dd>{money(request.quoted_total)}</dd></div>
                  <div>
                    <dt>Quote valid until</dt>
                    <dd>{request.quote_valid_until || "Not quoted"}
                      {expired && " (expired)"}
                    </dd>
                  </div>
                  <div><dt>Expected delivery</dt><dd>{request.expected_delivery_date || "Not specified"}</dd></div>
                </dl>
                {request.quote_terms && (
                  <p><strong>Quote terms:</strong> {request.quote_terms}</p>
                )}
                {request.status === "ACCEPTED" && (
                  <p>
                    Quote accepted. This is not a payment confirmation; payment
                    remains pending until separately completed.
                  </p>
                )}
                {request.converted_order_id && (
                  <p>
                    Order created:{" "}
                    <Link to={`/account/orders/${request.converted_order_id}`}>
                      View order
                    </Link>
                  </p>
                )}
                {awaitingResponse && (
                  <div className="bulk-actions">
                    <button
                      className="bulk-button"
                      type="button"
                      disabled={workingId === request.id}
                      onClick={() => void respond(request, "accept")}
                    >
                      {workingId === request.id ? "Saving…" : "Accept quote"}
                    </button>
                    <button
                      className="bulk-button secondary"
                      type="button"
                      disabled={workingId === request.id}
                      onClick={() => void respond(request, "reject")}
                    >
                      Reject quote
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
