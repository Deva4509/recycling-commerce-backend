import { useEffect, useState } from "react";
import { CheckCircle2, Package, ArrowRight, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getOrder, getOrderShipment, type ApiOrder, type ApiShipment } from "../lib/api";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [shipment, setShipment] = useState<ApiShipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    Promise.all([
      getOrder(orderId),
      getOrderShipment(orderId).catch(() => null),
    ])
      .then(([orderData, shipmentData]) => {
        setOrder(orderData);
        setShipment(shipmentData);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <main className="order-page">
        <div className="order-loading">Loading your order...</div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="order-page">
        <div className="order-empty">
          <h1>Order not found</h1>
          <Link to="/shop" className="order-primary-button">
            Continue shopping <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  const total = Number(order.total_amount ?? 0);

  return (
    <main className="order-page">
      <section className="order-confirmation">
        <div className="order-success-icon">
          <CheckCircle2 size={42} />
        </div>

        <p className="order-eyebrow">ORDER CONFIRMED</p>

        <h1>Thank you for your order.</h1>

        <p className="order-lead">
          Your order has been placed successfully and is now being prepared.
        </p>

        <div className="order-confirmation-card">
          <div>
            <span>ORDER NUMBER</span>
            <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
          </div>

          <div>
            <span>STATUS</span>
            <strong>{order.status ?? "CONFIRMED"}</strong>
          </div>

          <div>
            <span>TOTAL</span>
            <strong>₹{total.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        {shipment && (
          <div className="order-tracking-preview">
            <Truck size={19} />
            <div>
              <strong>{shipment.status ?? "Preparing shipment"}</strong>
              <span>
                {shipment.tracking_number
                  ? `Tracking: ${shipment.tracking_number}`
                  : "Your shipment will be updated here."}
              </span>
            </div>
          </div>
        )}

        <div className="order-actions">
          <Link to={`/account/orders/${order.id}`} className="order-primary-button">
            View order <ArrowRight size={16} />
          </Link>

          <Link to="/shop" className="order-secondary-button">
            Continue shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
