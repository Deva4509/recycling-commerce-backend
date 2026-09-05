import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  Package,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: string | number;
  currency: string;
  created_at: string;
};

const API_BASE = "/api/v1";

function getStoredToken() {
  return (
    localStorage.getItem("recyclepro-access-token") ||
    sessionStorage.getItem("recyclepro-access-token")
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setLoadingOrders(false);
      return;
    }

    fetch(`${API_BASE}/orders/user/${user?.id ?? ""}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.detail || "Unable to load your orders.",
          );
        }

        return response.json();
      })
      .then((data: Order[]) => {
        setOrders(data);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your orders.",
        );
      })
      .finally(() => {
        setLoadingOrders(false);
      });
  }, [user?.id]);

  if (!user) {
    return null;
  }

  return (
    <main className="account-page">
      <section className="account-hero">
        <div>
          <span className="account-kicker">MY ACCOUNT</span>
          <h1>Welcome, {user.name}.</h1>
          <p>
            Manage your profile and keep track of everything you've ordered.
          </p>
        </div>

        <div className="account-profile-mark">
          <UserRound size={30} />
        </div>
      </section>

      <section className="account-content">
        <div className="account-profile-card">
          <div className="account-card-heading">
            <div className="account-card-icon">
              <UserRound size={19} />
            </div>
            <div>
              <span>PROFILE</span>
              <h2>Your information</h2>
            </div>
          </div>

          <div className="account-profile-grid">
            <div>
              <span>Name</span>
              <strong>{user.name}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{user.email}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{user.phone || "Not provided"}</strong>
            </div>

            <div>
              <span>Account status</span>
              <strong>{user.status || "ACTIVE"}</strong>
            </div>
          </div>
        </div>

        <section className="account-orders">
          <div className="account-orders-heading">
            <div>
              <span className="account-kicker">YOUR ORDERS</span>
              <h2>Order history</h2>
            </div>

            <span className="account-order-count">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
          </div>

          {loadingOrders ? (
            <div className="account-empty-card">
              <Clock3 size={22} />
              <p>Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="account-empty-card account-error-card">
              <p>{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="account-empty-card">
              <Package size={25} />
              <h3>No orders yet</h3>
              <p>
                Your completed purchases will appear here.
              </p>
              <Link to="/shop" className="checkout-primary-button">
                Explore products
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="account-order-list">
              {orders.map((order) => (
                <Link
                  to={`/account/orders/${order.id}`}
                  className="account-order-card"
                  key={order.id}
                >
                  <div className="account-order-icon">
                    <Package size={20} />
                  </div>

                  <div className="account-order-main">
                    <strong>#{order.order_number}</strong>

                    <span>
                      <CalendarDays size={14} />
                      {new Date(order.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>

                  <div className="account-order-status">
                    <span>
                      <CheckCircle2 size={14} />
                      {order.status}
                    </span>
                    <small>{order.payment_status}</small>
                  </div>

                  <strong className="account-order-total">
                    ₹{Number(order.total_amount).toLocaleString("en-IN")}
                  </strong>

                  <ArrowRight size={18} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          className="account-logout"
          onClick={logout}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </section>
    </main>
  );
}
