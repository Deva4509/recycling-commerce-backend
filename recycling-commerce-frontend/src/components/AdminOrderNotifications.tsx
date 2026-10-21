import { useCallback, useEffect, useState } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAdminOrderNotifications,
  markAdminOrderNotificationRead,
  type AdminOrderNotification,
} from "../lib/api";
import "./AdminOrderNotifications.css";

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

function EcoInboxIllustration() {
  return (
    <div className="gc-inbox-scene" aria-hidden="true">
      <div className="gc-orbit gc-orbit-one" />
      <div className="gc-orbit gc-orbit-two" />
      <svg className="gc-inbox-svg" viewBox="0 0 360 270" fill="none">
        <defs>
          <linearGradient id="gcPaper" x1="85" y1="20" x2="260" y2="210" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D7FFE8" />
            <stop offset="1" stopColor="#16A765" />
          </linearGradient>
          <linearGradient id="gcBox" x1="80" y1="115" x2="290" y2="250" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B8151" stopOpacity=".72" />
            <stop offset="1" stopColor="#24F4A0" stopOpacity=".25" />
          </linearGradient>
          <filter id="gcGlow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M106 57 Q106 42 121 42 H237 Q251 42 251 57 V169 L223 194 H125 L106 177 Z"
          fill="url(#gcPaper)" fillOpacity=".84" stroke="#C9FFE1" strokeWidth="2" />
        <path d="M132 72 H211 M132 96 H222 M132 120 H190"
          stroke="#087C4D" strokeWidth="10" strokeLinecap="round" opacity=".55" />
        <path d="M78 126 L115 106 Q124 101 133 107 L166 127 Q176 133 187 126 L218 106 Q228 100 239 107 L281 132 L259 220 Q256 235 241 235 H112 Q98 235 94 221 Z"
          fill="url(#gcBox)" stroke="#44F5A5" strokeWidth="2.5" />
        <path d="M78 126 L139 166 Q151 174 163 165 L190 146 L218 165 Q230 174 242 166 L281 132"
          stroke="#83FFC1" strokeWidth="3" />
        <path d="M94 220 L111 190 L140 205 L163 188 L190 205 L219 188 L258 219"
          stroke="#1BEA92" strokeWidth="2" opacity=".6" />
        <g filter="url(#gcGlow)">
          <circle cx="274" cy="53" r="35" fill="#0C8B58" fillOpacity=".45" stroke="#4DFFB0" strokeWidth="2" />
          <path d="M260 52 Q260 37 274 37 Q288 37 288 52 V67 H260 Z" fill="#A8FFD0" />
          <path d="M256 50 Q251 44 256 38 M292 50 Q297 44 292 38"
            stroke="#5AFFB4" strokeWidth="3" strokeLinecap="round" />
          <path d="M266 69 Q274 79 282 69" stroke="#A8FFD0" strokeWidth="3" strokeLinecap="round" />
        </g>
        <path d="M42 88 Q26 67 35 52 Q56 62 58 83 Q52 75 42 70"
          fill="#4DF5A7" stroke="#A4FFD0" strokeWidth="1.5" />
        <path d="M309 122 Q325 91 349 94 Q346 122 315 137 Q327 121 335 109"
          fill="#4DF5A7" stroke="#A4FFD0" strokeWidth="1.5" />
        <path d="M300 200 Q325 203 342 187" stroke="#1BEA92" strokeWidth="2" strokeDasharray="5 8" strokeLinecap="round" />
        <g fill="#6AFFB7">
          <path d="M61 32 L65 42 L75 46 L65 50 L61 60 L57 50 L47 46 L57 42 Z" />
          <circle cx="303" cy="81" r="3" /><circle cx="70" cy="190" r="3" />
          <circle cx="317" cy="165" r="2.5" />
        </g>
      </svg>
      <span className="gc-scene-dot gc-dot-a" />
      <span className="gc-scene-dot gc-dot-b" />
      <span className="gc-scene-dot gc-dot-c" />
    </div>
  );
}

export default function AdminOrderNotifications() {
  const [items, setItems] = useState<AdminOrderNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await getAdminOrderNotifications();
      setItems(Array.isArray(result.items) ? result.items : []);
      setUnread(Number(result.unread_count || 0));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Notifications unavailable.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function markRead(id: string) {
    setBusy(id);
    try {
      await markAdminOrderNotificationRead(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setUnread((current) => Math.max(0, current - 1));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark as read.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="gc-notification-hero" aria-labelledby="order-notifications-title">
      <div className="gc-hero-grid" aria-hidden="true" />
      <div className="gc-hero-particle gc-particle-one" />
      <div className="gc-hero-particle gc-particle-two" />
      <div className="gc-hero-particle gc-particle-three" />

      <div className="gc-hero-topline">
        <span className="gc-hero-kicker">ORDER ACTIVITY</span>
        <span className="gc-kicker-line"><i /></span>
        <button
          type="button"
          className={`gc-refresh-button ${refreshing ? "is-refreshing" : ""}`}
          onClick={() => void load()}
          aria-label="Refresh notifications"
          disabled={refreshing}
        >
          <RefreshCw size={21} />
        </button>
      </div>

      <div className="gc-hero-content">
        <div className="gc-notification-copy">
          <div className="gc-title-row">
            <span className="gc-bell-orb"><Bell size={31} /></span>
            <div className="gc-title-stack">
              <h2 id="order-notifications-title">
                New order <span>notifications</span>
              </h2>
              <span className="gc-unread-badge">
                <i /> {unread} unread
              </span>
            </div>
          </div>

          {error ? (
            <p className="gc-notification-message gc-error-message" role="status">{error}</p>
          ) : items.length === 0 ? (
            <p className="gc-notification-message">No order notifications yet.</p>
          ) : (
            <div className="gc-notification-list">
              {items.slice(0, 3).map((item) => (
                <article className={`gc-notification-item ${item.read_at ? "is-read" : ""}`} key={item.id}>
                  <div className="gc-item-status"><Bell size={16} /></div>
                  <div className="gc-item-copy">
                    <strong>{item.message || "New order received"}</strong>
                    <span>Order {item.order_number || item.order_id.slice(0, 8)}</span>
                    <small>{new Date(item.created_at).toLocaleString()}</small>
                  </div>
                  <div className="gc-item-actions">
                    <strong>{money(item.total_amount, item.currency)}</strong>
                    {!item.read_at && (
                      <button type="button" disabled={busy === item.id} onClick={() => void markRead(item.id)}>
                        <Check size={14} /> Read
                      </button>
                    )}
                    <Link to="/admin/orders">Open order</Link>
                  </div>
                </article>
              ))}
              {items.length > 3 && <Link className="gc-all-orders-link" to="/admin/orders">View all orders</Link>}
            </div>
          )}
        </div>
        <EcoInboxIllustration />
      </div>
      <div className="gc-hero-bottom-glow" aria-hidden="true" />
    </section>
  );
}
