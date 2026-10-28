import os
import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models.order import Order
from app.database.models.order_notification import AdminOrderNotification, OrderEventOutbox
from app.dependencies.auth import get_current_user, require_roles
from app.database.models.role import RoleName

router = APIRouter(prefix="/notifications", tags=["Notifications"])
admin_access = require_roles(RoleName.ADMIN, RoleName.STAFF)


def check_node_red_token(token: str | None) -> None:
    expected = os.getenv("NODE_RED_SHARED_SECRET", "")
    if not expected or not token or not secrets.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="Invalid Node-RED credentials")


@router.get("")
def list_notifications(
    limit: int = 50,
    _user=Depends(admin_access),
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 100))
    rows = db.scalars(
        select(AdminOrderNotification).where(AdminOrderNotification.read_at.is_(None)).order_by(AdminOrderNotification.created_at.desc()).limit(limit)
    ).all()
    return {
        "items": [{
            "id": str(n.id), "order_id": str(n.order_id),
            "order_number": n.order_number, "total_amount": float(n.total_amount),
            "currency": n.currency, "created_at": n.created_at.isoformat(),
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "message": "New order received",
        } for n in rows],
        "unread_count": sum(1 for n in rows if n.read_at is None),
    }


@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: UUID,
    _user=Depends(admin_access),
    db: Session = Depends(get_db),
):
    notification = db.get(AdminOrderNotification, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
    return {"id": str(notification.id), "read": True}


@router.get("/node-red/pending")
def pending_events(
    x_node_red_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    check_node_red_token(x_node_red_token)
    rows = db.scalars(
        select(OrderEventOutbox).where(OrderEventOutbox.processed_at.is_(None))
        .order_by(OrderEventOutbox.created_at.asc()).limit(50)
    ).all()
    items = []
    for event in rows:
        order = db.get(Order, event.order_id)
        if order is not None:
            items.append({
                "id": str(event.id), "event_key": event.event_key,
                "event_type": event.event_type, "order_id": str(order.id),
                "order_number": order.order_number,
                "total_amount": float(order.total_amount),
                "currency": order.currency,
                "created_at": event.created_at.isoformat(),
            })
    return {"items": items}


@router.post("/node-red/process/{event_id}")
def process_event(
    event_id: UUID,
    x_node_red_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    check_node_red_token(x_node_red_token)
    event = db.scalar(
        select(OrderEventOutbox).where(OrderEventOutbox.id == event_id).with_for_update()
    )
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = db.scalar(
        select(AdminOrderNotification).where(AdminOrderNotification.event_key == event.event_key)
    )
    if existing is None:
        order = db.get(Order, event.order_id)
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        db.add(AdminOrderNotification(
            event_key=event.event_key, order_id=order.id,
            order_number=order.order_number, total_amount=order.total_amount,
            currency=order.currency,
        ))
    event.processed_at = event.processed_at or datetime.now(timezone.utc)
    db.commit()
    return {"processed": True, "event_key": event.event_key}
